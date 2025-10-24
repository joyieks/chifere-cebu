/**
 * Notification Context
 * 
 * Provides real-time notification management for the entire application.
 * Handles fetching, displaying, and managing notifications with real-time updates.
 * 
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);

  // Load initial notifications
  const loadNotifications = useCallback(async (options = {}) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const result = await notificationService.getNotifications(options);
      
      if (result.success) {
        const formattedNotifications = result.notifications.map(notification => 
          notificationService.formatNotification(notification)
        );
        setNotifications(formattedNotifications);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('❌ [NotificationContext] Load notifications error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const result = await notificationService.getUnreadCount();
      
      if (result.success) {
        setUnreadCount(result.count);
      }
    } catch (error) {
      console.error('❌ [NotificationContext] Load unread count error:', error);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const result = await notificationService.markAsRead(notificationId);
      
      if (result.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, is_read: true }
              : notification
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('❌ [NotificationContext] Mark as read error:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const result = await notificationService.markAllAsRead();
      
      if (result.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, is_read: true }))
        );
        
        // Reset unread count
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('❌ [NotificationContext] Mark all as read error:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const result = await notificationService.deleteNotification(notificationId);
      
      if (result.success) {
        // Remove from local state
        setNotifications(prev => 
          prev.filter(notification => notification.id !== notificationId)
        );
        
        // Update unread count if notification was unread
        const deletedNotification = notifications.find(n => n.id === notificationId);
        if (deletedNotification && !deletedNotification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('❌ [NotificationContext] Delete notification error:', error);
    }
  }, [notifications]);

  // Handle new notification from real-time subscription
  const handleNewNotification = useCallback((newNotification, eventType = 'insert') => {
    console.log('🔔 [NotificationContext] Handling new notification:', newNotification, eventType);
    
    // CRITICAL: Only process notifications for the current user
    if (!user || newNotification.user_id !== user.id) {
      console.log('🔔 [NotificationContext] Ignoring notification for different user:', {
        notificationUserId: newNotification.user_id,
        currentUserId: user?.id
      });
      return;
    }
    
    const formattedNotification = notificationService.formatNotification(newNotification);
    
    if (eventType === 'insert') {
      // Add new notification to the beginning of the list
      setNotifications(prev => [formattedNotification, ...prev]);
      
      // Update unread count if notification is unread
      if (!newNotification.is_read) {
        setUnreadCount(prev => prev + 1);
      }
      
      // Show browser notification if permission is granted
      if (Notification.permission === 'granted') {
        new Notification(formattedNotification.title, {
          body: formattedNotification.message,
          icon: '/favicon.ico',
          tag: formattedNotification.id
        });
      }
    } else if (eventType === 'update') {
      // Update existing notification
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === newNotification.id 
            ? formattedNotification
            : notification
        )
      );
    }
  }, [user]);

  // Setup real-time subscription
  useEffect(() => {
    if (!user) return;

    console.log('🔔 [NotificationContext] Setting up real-time subscription for user:', user.id);

    const newSubscription = notificationService.subscribeToNotifications(handleNewNotification);
    setSubscription(newSubscription);

    return () => {
      if (newSubscription) {
        notificationService.unsubscribeFromNotifications(newSubscription);
      }
    };
  }, [user, handleNewNotification]);

  // Load initial data when user changes
  useEffect(() => {
    if (user) {
      loadNotifications();
      loadUnreadCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
    }
  }, [user, loadNotifications, loadUnreadCount]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('🔔 [NotificationContext] Notification permission:', permission);
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  // Refresh notifications
  const refreshNotifications = useCallback(() => {
    loadNotifications();
    loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);

  // Get notifications by type
  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(notification => notification.type === type);
  }, [notifications]);

  // Get unread notifications
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(notification => !notification.is_read);
  }, [notifications]);

  const value = {
    // State
    notifications,
    unreadCount,
    loading,
    error,
    
    // Actions
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    requestNotificationPermission,
    
    // Utilities
    getNotificationsByType,
    getUnreadNotifications,
    
    // Service
    notificationService
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
