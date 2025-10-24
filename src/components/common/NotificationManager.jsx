/**
 * Notification Manager Component
 * 
 * Manages the display of notification toasts and handles real-time notification updates.
 * This component should be placed at the root level of the application.
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationToast from './NotificationToast';

const NotificationManager = () => {
  const { notifications } = useNotifications();
  const [activeToasts, setActiveToasts] = useState([]);
  const [processedNotificationIds, setProcessedNotificationIds] = useState(new Set());

  // Handle new notifications
  useEffect(() => {
    if (notifications.length === 0) return;

    // Find new notifications that haven't been processed yet
    const newNotifications = notifications.filter(
      notification => 
        !processedNotificationIds.has(notification.id) && 
        notification.isRecent && 
        !notification.is_read
    );

    if (newNotifications.length > 0) {
      // Add new notifications to active toasts
      setActiveToasts(prev => [
        ...prev,
        ...newNotifications.map(notification => ({
          id: notification.id,
          notification,
          timestamp: Date.now()
        }))
      ]);

      // Mark these notifications as processed
      setProcessedNotificationIds(prev => {
        const newSet = new Set(prev);
        newNotifications.forEach(notification => {
          newSet.add(notification.id);
        });
        return newSet;
      });
    }
  }, [notifications, processedNotificationIds]);

  // Remove toast when it's closed
  const removeToast = (toastId) => {
    setActiveToasts(prev => prev.filter(toast => toast.id !== toastId));
  };

  // Clean up old toasts (older than 30 seconds)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setActiveToasts(prev => 
        prev.filter(toast => now - toast.timestamp < 30000)
      );
    }, 5000);

    return () => clearInterval(cleanupInterval);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {activeToasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <NotificationToast
            notification={toast.notification}
            onClose={() => removeToast(toast.id)}
            duration={2000}
          />
        </div>
      ))}
    </div>
  );
};

export default NotificationManager;
