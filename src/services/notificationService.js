import { supabase, handleSupabaseError } from '../config/supabase';

class NotificationService {
  // Create a new notification
  async createNotification(userId, notificationData) {
    try {
      const notification = {
        user_id: userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type, // 'message', 'offer', 'system', 'transaction', 'barter'
        data: notificationData.data || {},
        is_read: false,
        is_actionable: notificationData.isActionable || false,
        action_url: notificationData.actionUrl || null,
        expires_at: notificationData.expiresAt || null,
        priority: notificationData.priority || 'normal' // 'low', 'normal', 'high', 'urgent'
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert([notification])
        .select()
        .single();

      if (error) throw error;

      return { success: true, notificationId: data.id };
    } catch (error) {
      console.error('Create notification error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Get user notifications
  async getUserNotifications(userId, limitCount = 50, unreadOnly = false) {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limitCount);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get user notifications error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Listen to user notifications in real-time
  listenToUserNotifications(userId, callback, limitCount = 50) {
    try {
      const channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          async () => {
            // Fetch updated notifications
            const result = await this.getUserNotifications(userId, limitCount);
            if (result.success) {
              callback(result);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Listen to notifications error:', error);
      callback({ success: false, error: handleSupabaseError(error) });
      return () => {}; // Return no-op function on error
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Mark notification as read error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Mark all user notifications as read
  async markAllNotificationsAsRead(userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Delete notification error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Get unread notification count
  async getUnreadNotificationCount(userId) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return { success: true, count: count || 0 };
    } catch (error) {
      console.error('Get unread notification count error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Create message notification
  async createMessageNotification(userId, messageData) {
    try {
      const notification = {
        title: 'New Message',
        message: `You have a new message from ${messageData.senderName}`,
        type: 'message',
        data: {
          conversation_id: messageData.conversationId,
          sender_id: messageData.senderId,
          sender_name: messageData.senderName,
          message_preview: messageData.content.substring(0, 100),
          item_id: messageData.itemId
        },
        isActionable: true,
        actionUrl: `/messages/${messageData.conversationId}`,
        priority: 'normal'
      };

      return await this.createNotification(userId, notification);
    } catch (error) {
      console.error('Create message notification error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Create offer notification
  async createOfferNotification(userId, offerData) {
    try {
      const notification = {
        title: 'New Offer',
        message: `You have a new ${offerData.offerType} offer for ${offerData.itemName}`,
        type: 'offer',
        data: {
          offer_id: offerData.offerId,
          item_id: offerData.itemId,
          item_name: offerData.itemName,
          offer_type: offerData.offerType,
          offer_value: offerData.offerValue,
          sender_id: offerData.senderId,
          sender_name: offerData.senderName
        },
        isActionable: true,
        actionUrl: `/offers/${offerData.offerId}`,
        priority: 'high'
      };

      return await this.createNotification(userId, notification);
    } catch (error) {
      console.error('Create offer notification error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Create system notification
  async createSystemNotification(userId, systemData) {
    try {
      const notification = {
        title: systemData.title || 'System Update',
        message: systemData.message,
        type: 'system',
        data: systemData.data || {},
        isActionable: systemData.isActionable || false,
        actionUrl: systemData.actionUrl || null,
        priority: systemData.priority || 'normal'
      };

      return await this.createNotification(userId, notification);
    } catch (error) {
      console.error('Create system notification error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Create transaction notification
  async createTransactionNotification(userId, transactionData) {
    try {
      const notification = {
        title: 'Transaction Update',
        message: `Your ${transactionData.type} transaction has been ${transactionData.status}`,
        type: 'transaction',
        data: {
          transaction_id: transactionData.transactionId,
          type: transactionData.type, // 'purchase', 'sale', 'barter'
          status: transactionData.status,
          item_name: transactionData.itemName,
          amount: transactionData.amount
        },
        isActionable: true,
        actionUrl: `/transactions/${transactionData.transactionId}`,
        priority: 'high'
      };

      return await this.createNotification(userId, notification);
    } catch (error) {
      console.error('Create transaction notification error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Create barter notification
  async createBarterNotification(userId, barterData) {
    try {
      const notification = {
        title: 'Barter Update',
        message: `Your barter request for ${barterData.itemName} has been ${barterData.status}`,
        type: 'barter',
        data: {
          barter_id: barterData.barterId,
          item_id: barterData.itemId,
          item_name: barterData.itemName,
          status: barterData.status,
          sender_id: barterData.senderId,
          sender_name: barterData.senderName
        },
        isActionable: true,
        actionUrl: `/barter/${barterData.barterId}`,
        priority: 'high'
      };

      return await this.createNotification(userId, notification);
    } catch (error) {
      console.error('Create barter notification error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Clean up expired notifications
  async cleanupExpiredNotifications() {
    try {
      const now = new Date().toISOString();
      const { count, error } = await supabase
        .from('notifications')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .lt('expires_at', now);

      if (error) throw error;

      return { success: true, deletedCount: count || 0 };
    } catch (error) {
      console.error('Cleanup expired notifications error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Get notification statistics
  async getNotificationStats(userId) {
    try {
      const allNotifications = await this.getUserNotifications(userId, 1000);
      const unreadCount = await this.getUnreadNotificationCount(userId);

      if (!allNotifications.success || !unreadCount.success) {
        return { success: false, error: 'Failed to get notification data' };
      }

      const notifications = allNotifications.data;
      const stats = {
        total: notifications.length,
        unread: unreadCount.count,
        read: notifications.length - unreadCount.count,
        byType: {},
        byPriority: {}
      };

      // Count by type
      notifications.forEach(notification => {
        stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
        stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
      });

      return { success: true, data: stats };
    } catch (error) {
      console.error('Get notification stats error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }
}

export default new NotificationService();
