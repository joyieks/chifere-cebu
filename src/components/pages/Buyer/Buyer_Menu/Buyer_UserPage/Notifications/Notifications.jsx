import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../../../contexts/AuthContext';
import notificationService from '../../../../../../services/notificationService';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showClearModal, setShowClearModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen to real-time notifications from Firebase
  useEffect(() => {
    if (!user) {
      setLoading(false);
      setNotifications([]);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = notificationService.listenToUserNotifications(
      user.uid,
      (result) => {
        if (result.success) {
          // Transform Firebase notifications to component format
          const transformedNotifications = result.data
            .filter(notif => !notif.isDeleted) // Filter out deleted notifications
            .map(notif => ({
              id: notif.id,
              type: notif.type || 'system',
              title: notif.title || 'Notification',
              message: notif.message || '',
              time: formatTime(notif.createdAt),
              read: notif.isRead || false,
              icon: getNotificationIcon(notif.type),
              data: notif.data || {},
              isActionable: notif.isActionable || false,
              actionUrl: notif.actionUrl || null
            }));

          setNotifications(transformedNotifications);
          setLoading(false);
        } else {
          console.error('Failed to load notifications:', result.error);
          setError(result.error);
          setLoading(false);
        }
      },
      100 // Limit to 100 recent notifications
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Format timestamp to relative time
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    const icons = {
      order: '📦',
      barter: '🔄',
      message: '💬',
      promo: '🎉',
      system: '🔒',
      offer: '💰',
      transaction: '💳'
    };
    return icons[type] || '🔔';
  };

  const markAsRead = async (id) => {
    const result = await notificationService.markNotificationAsRead(id);
    if (!result.success) {
      console.error('Failed to mark notification as read:', result.error);
    }
    // Real-time listener will update the UI automatically
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const result = await notificationService.markAllNotificationsAsRead(user.uid);
    if (!result.success) {
      console.error('Failed to mark all notifications as read:', result.error);
    }
    // Real-time listener will update the UI automatically
  };

  const deleteNotification = async (id) => {
    const result = await notificationService.deleteNotification(id);
    if (!result.success) {
      console.error('Failed to delete notification:', result.error);
    }
    // Real-time listener will update the UI automatically
  };

  const clearAllNotifications = async () => {
    if (!user) return;

    // Delete all notifications for the user
    const deletePromises = notifications.map(notif =>
      notificationService.deleteNotification(notif.id)
    );

    try {
      await Promise.all(deletePromises);
      setShowClearModal(false);
      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.read;
    return notif.type === filter;
  });

  const unreadCount = notifications.filter(notif => !notif.read).length;

  const getTypeColor = (type) => {
    const colors = {
      order: 'bg-blue-100 text-blue-600',
      barter: 'bg-orange-100 text-orange-600',
      message: 'bg-green-100 text-green-600',
      promo: 'bg-purple-100 text-purple-600',
      system: 'bg-gray-100 text-gray-600'
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  };

  const filterOptions = [
    { value: 'all', label: 'All', count: notifications.length },
    { value: 'unread', label: 'Unread', count: unreadCount },
    { value: 'order', label: 'Orders', count: notifications.filter(n => n.type === 'order').length },
    { value: 'barter', label: 'Barter', count: notifications.filter(n => n.type === 'barter').length },
    { value: 'message', label: 'Messages', count: notifications.filter(n => n.type === 'message').length },
    { value: 'promo', label: 'Promotions', count: notifications.filter(n => n.type === 'promo').length }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Notifications
          </h1>
          <p className="text-gray-600 text-lg">Stay updated with your latest activities</p>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          {/* Header Actions */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  <h2 className="text-xl font-bold text-gray-800">
                    {notifications.length} Notifications
                  </h2>
                  {unreadCount > 0 && (
                    <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-semibold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm"
                >
                  Mark All Read
                </button>
                <button
                  onClick={() => setShowClearModal(true)}
                  disabled={notifications.length === 0}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="mt-6">
              <div className="flex flex-wrap gap-2">
                {filterOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFilter(option.value)}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 ${
                      filter === option.value
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                        : 'bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-200'
                    }`}
                  >
                    <span>{option.label}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      filter === option.value ? 'bg-white/20' : 'bg-gray-200'
                    }`}>
                      {option.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-400 mb-2">Loading notifications...</h3>
                <p className="text-gray-500">Please wait while we fetch your notifications</p>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <svg className="w-16 h-16 mx-auto text-red-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-red-400 mb-2">Failed to load notifications</h3>
                <p className="text-gray-500">{error}</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No notifications</h3>
                <p className="text-gray-500">You're all caught up! No new notifications to show.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notif, index) => (
                  <div
                    key={notif.id}
                    className={`group relative p-4 rounded-2xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                      notif.read 
                        ? 'bg-white border-gray-200' 
                        : 'bg-blue-50 border-blue-200 ring-2 ring-blue-100'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg ${getTypeColor(notif.type)}`}>
                        {notif.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className={`font-semibold ${notif.read ? 'text-gray-800' : 'text-blue-800'}`}>
                              {notif.title}
                            </h3>
                            <p className="text-gray-600 mt-1">{notif.message}</p>
                            <p className="text-sm text-gray-500 mt-2">{notif.time}</p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {!notif.read && (
                              <button
                                onClick={() => markAsRead(notif.id)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                                title="Mark as read"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notif.id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                              title="Delete notification"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Unread indicator */}
                      {!notif.read && (
                        <div className="flex-shrink-0 w-3 h-3 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clear All Modal */}
        {showClearModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4 transform animate-slide-up">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Clear All Notifications</h2>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete all notifications? This action cannot be undone.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowClearModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={clearAllNotifications}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-semibold"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
      `}</style>
    </div>
  );
};

export default Notifications;
