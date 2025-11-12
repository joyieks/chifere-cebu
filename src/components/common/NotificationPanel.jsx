/**
 * Notification Panel Component
 * 
 * Displays a list of notifications with options to mark as read, delete, and filter.
 * Shows real-time updates and provides notification management functionality.
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiBell, 
  FiCheck, 
  FiTrash2, 
  FiFilter, 
  FiRefreshCw,
  FiX,
  FiPackage,
  FiShoppingCart,
  FiUsers,
  FiStar,
  FiXCircle,
  FiCheckCircle
} from 'react-icons/fi';
import { useNotifications } from '../../contexts/NotificationContext';

const NotificationPanel = ({ onClose }) => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    getNotificationsByType,
    getUnreadNotifications
  } = useNotifications();

  const [filter, setFilter] = useState('all'); // 'all', 'unread', or specific type
  const [showFilters, setShowFilters] = useState(false);

  // Notification type icons
  const getNotificationIcon = (type) => {
    const icons = {
      'order_status_update': <FiPackage className="w-5 h-5" />,
      'new_order_received': <FiShoppingCart className="w-5 h-5" />,
      'new_follower': <FiUsers className="w-5 h-5" />,
      'new_review': <FiStar className="w-5 h-5" />,
      'order_cancelled': <FiXCircle className="w-5 h-5" />,
      'payment_received': <span className="text-lg font-bold">₱</span>,
      'item_sold': <FiCheckCircle className="w-5 h-5" />
    };
    return icons[type] || <FiBell className="w-5 h-5" />;
  };

  // Get filtered notifications
  const getFilteredNotifications = () => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return getUnreadNotifications();
    return getNotificationsByType(filter);
  };

  const filteredNotifications = getFilteredNotifications();

  // Handle mark as read
  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId);
  };

  // Handle delete notification
  const handleDelete = async (notificationId) => {
    await deleteNotification(notificationId);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  // Handle refresh
  const handleRefresh = () => {
    refreshNotifications();
  };

  return (
    <div className="flex flex-col h-[500px] max-h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <FiBell className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="Filter notifications"
          >
            <FiFilter className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            title="Refresh notifications"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={onClose}
            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="Close notifications"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-200 bg-gray-50"
          >
            <div className="p-3 space-y-2">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    filter === 'all' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    filter === 'unread' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Unread
                </button>
                <button
                  onClick={() => setFilter('order_status_update')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    filter === 'order_status_update' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Orders
                </button>
                <button
                  onClick={() => setFilter('new_follower')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    filter === 'new_follower' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Followers
                </button>
                <button
                  onClick={() => setFilter('new_review')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    filter === 'new_review' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Reviews
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      {unreadCount > 0 && (
        <div className="p-3 border-b border-gray-200 bg-blue-50">
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
          >
            <FiCheck className="w-4 h-4" />
            <span>Mark all as read</span>
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center p-8">
            <FiRefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading notifications...</span>
          </div>
        )}

        {error && (
          <div className="p-4 text-center">
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filteredNotifications.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <FiBell className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No notifications yet</p>
            <p className="text-xs mt-1">You'll see updates about your orders, followers, and reviews here</p>
          </div>
        )}

        {!loading && !error && filteredNotifications.length > 0 && (
          <div className="divide-y divide-gray-100">
            <AnimatePresence>
              {filteredNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className={`flex-shrink-0 p-2 rounded-full ${
                      !notification.is_read 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`text-sm font-medium ${
                            !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {notification.timeAgo}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.is_read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Mark as read"
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete notification"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredNotifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Showing {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
