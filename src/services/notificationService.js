/**
 * Notification Service
 * 
 * Handles all notification-related operations including:
 * - Fetching notifications
 * - Marking notifications as read
 * - Real-time notification updates
 * - Notification management
 * 
 * @version 1.0.0
 */

import { supabase } from '../config/supabase';

class NotificationService {
  /**
   * Get notifications for the current user
   * @param {Object} options - Query options
   * @param {number} options.limit - Number of notifications to fetch
   * @param {number} options.offset - Offset for pagination
   * @param {boolean} options.unreadOnly - Only fetch unread notifications
   * @param {string} options.type - Filter by notification type
   * @returns {Promise<Object>} - Notifications
   */
  async getNotifications(options = {}) {
    try {
      const { limit = 20, offset = 0, unreadOnly = false, type = null, userId = null } = options;
      
      console.log('🔔 [NotificationService] Fetching notifications:', options);

      // Get current user if userId not provided
      let currentUserId = userId;
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        currentUserId = user?.id;
      }

      if (!currentUserId) {
        console.log('❌ [NotificationService] No user ID available');
        return { success: false, error: 'No user ID available' };
      }

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUserId) // CRITICAL: Only get notifications for current user
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [NotificationService] Get notifications error:', error);
        throw error;
      }

      console.log('✅ [NotificationService] Notifications fetched:', data?.length || 0);
      return { success: true, notifications: data || [] };
    } catch (error) {
      console.error('❌ [NotificationService] Get notifications error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get unread notification count
   * @returns {Promise<Object>} - Unread count
   */
  async getUnreadCount() {
    try {
      console.log('🔔 [NotificationService] Getting unread count');

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ [NotificationService] No user available for unread count');
        return { success: false, error: 'No user available', count: 0 };
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id) // CRITICAL: Only count notifications for current user
        .eq('is_read', false);

      if (error) {
        console.error('❌ [NotificationService] Get unread count error:', error);
        throw error;
      }

      const unreadCount = count || 0;
      console.log('✅ [NotificationService] Unread count:', unreadCount);
      return { success: true, count: unreadCount };
    } catch (error) {
      console.error('❌ [NotificationService] Get unread count error:', error);
      return { success: false, error: error.message, count: 0 };
    }
  }

  /**
   * Mark a notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} - Result
   */
  async markAsRead(notificationId) {
    try {
      console.log('🔔 [NotificationService] Marking notification as read:', notificationId);

      const { data, error } = await supabase
        .rpc('mark_notification_read', { notification_id: notificationId });

      if (error) {
        console.error('❌ [NotificationService] Mark as read error:', error);
        throw error;
      }

      console.log('✅ [NotificationService] Notification marked as read');
      return { success: true, marked: data };
    } catch (error) {
      console.error('❌ [NotificationService] Mark as read error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark all notifications as read
   * @returns {Promise<Object>} - Result
   */
  async markAllAsRead() {
    try {
      console.log('🔔 [NotificationService] Marking all notifications as read');

      const { data, error } = await supabase
        .rpc('mark_all_notifications_read');

      if (error) {
        console.error('❌ [NotificationService] Mark all as read error:', error);
        throw error;
      }

      const updatedCount = data || 0;
      console.log('✅ [NotificationService] Marked', updatedCount, 'notifications as read');
      return { success: true, updatedCount };
    } catch (error) {
      console.error('❌ [NotificationService] Mark all as read error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} - Result
   */
  async deleteNotification(notificationId) {
    try {
      console.log('🔔 [NotificationService] Deleting notification:', notificationId);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('❌ [NotificationService] Delete notification error:', error);
        throw error;
      }

      console.log('✅ [NotificationService] Notification deleted');
      return { success: true };
    } catch (error) {
      console.error('❌ [NotificationService] Delete notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Subscribe to real-time notifications
   * @param {Function} callback - Callback function for new notifications
   * @returns {Object} - Subscription object
   */
  subscribeToNotifications(callback) {
    console.log('🔔 [NotificationService] Subscribing to real-time notifications');

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          console.log('🔔 [NotificationService] New notification received:', payload);
          callback(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          console.log('🔔 [NotificationService] Notification updated:', payload);
          callback(payload.new, 'update');
        }
      )
      .subscribe();

    return subscription;
  }

  /**
   * Unsubscribe from notifications
   * @param {Object} subscription - Subscription object
   */
  unsubscribeFromNotifications(subscription) {
    console.log('🔔 [NotificationService] Unsubscribing from notifications');
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  }

  /**
   * Create a new notification
   * @param {string} userId - User ID to send notification to
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} - Result
   */
  async createNotification(userId, notificationData) {
    try {
      console.log('🔔 [NotificationService] Creating notification:', { userId, notificationData });

      const { title, message, type = 'general', data = {} } = notificationData;

      // Ensure message is not null or empty
      const notificationMessage = message || title || 'New notification';

      const { data: notification, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          title: title || 'Notification',
          message: notificationMessage,
          type: type,
          data: data,
          is_read: false
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ [NotificationService] Create notification error:', error);
        throw error;
      }

      console.log('✅ [NotificationService] Notification created:', notification.id);
      return { success: true, notificationId: notification.id };
    } catch (error) {
      console.error('❌ [NotificationService] Create notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get notification types for filtering
   * @returns {Array} - Available notification types
   */
  getNotificationTypes() {
    return [
      { value: 'order_status_update', label: 'Order Updates', icon: '📦' },
      { value: 'new_order_received', label: 'New Orders', icon: '🛒' },
      { value: 'new_follower', label: 'New Followers', icon: '👥' },
      { value: 'new_review', label: 'New Reviews', icon: '⭐' },
      { value: 'order_cancelled', label: 'Cancelled Orders', icon: '❌' },
      { value: 'payment_received', label: 'Payments', icon: '💰' },
      { value: 'item_sold', label: 'Items Sold', icon: '✅' }
    ];
  }

  /**
   * Format notification for display
   * @param {Object} notification - Notification object
   * @returns {Object} - Formatted notification
   */
  formatNotification(notification) {
    const types = this.getNotificationTypes();
    const typeInfo = types.find(t => t.value === notification.type) || { label: 'Notification', icon: '🔔' };
    
    return {
      ...notification,
      typeInfo,
      timeAgo: this.getTimeAgo(notification.created_at),
      isRecent: this.isRecent(notification.created_at)
    };
  }

  /**
   * Get time ago string
   * @param {string} dateString - Date string
   * @returns {string} - Time ago string
   */
  getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  }

  /**
   * Check if notification is recent (within last hour)
   * @param {string} dateString - Date string
   * @returns {boolean} - Is recent
   */
  isRecent(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = (now - date) / (1000 * 60 * 60);
    return diffInHours < 1;
  }

  /**
   * Notify about order status update
   * @param {string} orderId - Order ID
   * @param {string} oldStatus - Previous status
   * @param {string} newStatus - New status
   * @param {string} buyerId - Buyer ID
   * @param {string} sellerId - Seller ID
   * @returns {Promise<Object>} - Result
   */
  async notifyOrderStatusUpdate(orderId, oldStatus, newStatus, buyerId, sellerId) {
    try {
      console.log('🔔 [NotificationService] Notifying order status update:', {
        orderId,
        oldStatus,
        newStatus,
        buyerId,
        sellerId
      });

      // Check for duplicate notifications first
      const { data: existingNotifications, error: duplicateError } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', buyerId)
        .eq('type', 'order_status_update')
        .eq('data->>order_id', orderId)
        .eq('data->>new_status', newStatus)
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Last 5 minutes

      if (duplicateError) {
        console.error('❌ [NotificationService] Error checking for duplicates:', duplicateError);
      } else if (existingNotifications && existingNotifications.length > 0) {
        console.log('⚠️ [NotificationService] Duplicate notification prevented for order:', orderId);
        return { success: true, notificationId: existingNotifications[0].id, duplicate: true };
      }

      // NOTE: Database trigger will handle notification creation automatically
      // We don't need to create notifications here to avoid duplicates
      console.log('✅ [NotificationService] Order status update notification will be handled by database trigger');
      return { success: true, handledByTrigger: true };
    } catch (error) {
      console.error('❌ [NotificationService] Notify order status update error:', error);
      return { success: false, error: error.message };
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;