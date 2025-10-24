/**
 * Notification Toast Component
 * 
 * Displays real-time notification toasts that appear when new notifications arrive.
 * Provides a non-intrusive way to alert users about important updates.
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, 
  FiPackage, 
  FiShoppingCart, 
  FiUsers, 
  FiStar,
  FiXCircle,
  FiDollarSign,
  FiCheckCircle
} from 'react-icons/fi';

const NotificationToast = ({ notification, onClose, duration = 2000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-close after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Get notification icon
  const getNotificationIcon = (type) => {
    const icons = {
      'order_status_update': <FiPackage className="w-5 h-5" />,
      'new_order_received': <FiShoppingCart className="w-5 h-5" />,
      'new_follower': <FiUsers className="w-5 h-5" />,
      'new_review': <FiStar className="w-5 h-5" />,
      'order_cancelled': <FiXCircle className="w-5 h-5" />,
      'payment_received': <FiDollarSign className="w-5 h-5" />,
      'item_sold': <FiCheckCircle className="w-5 h-5" />
    };
    return icons[type] || <FiPackage className="w-5 h-5" />;
  };

  // Get notification color scheme
  const getNotificationColors = (type) => {
    const colors = {
      'order_status_update': {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        iconBg: 'bg-blue-100'
      },
      'new_order_received': {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'text-green-600',
        iconBg: 'bg-green-100'
      },
      'new_follower': {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        icon: 'text-purple-600',
        iconBg: 'bg-purple-100'
      },
      'new_review': {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: 'text-yellow-600',
        iconBg: 'bg-yellow-100'
      },
      'order_cancelled': {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
        iconBg: 'bg-red-100'
      },
      'payment_received': {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        icon: 'text-emerald-600',
        iconBg: 'bg-emerald-100'
      },
      'item_sold': {
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        icon: 'text-indigo-600',
        iconBg: 'bg-indigo-100'
      }
    };
    return colors[type] || colors['order_status_update'];
  };

  const colors = getNotificationColors(notification.type);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.9 }}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 30,
            duration: 0.3
          }}
          className={`max-w-sm w-full ${colors.bg} ${colors.border} border rounded-lg shadow-lg p-4 relative overflow-hidden`}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="flex items-start space-x-3 pr-6">
            {/* Icon */}
            <div className={`flex-shrink-0 p-2 rounded-full ${colors.iconBg}`}>
              <div className={colors.icon}>
                {getNotificationIcon(notification.type)}
              </div>
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-700 line-clamp-2">
                {notification.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {notification.timeAgo}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
            className="absolute bottom-0 left-0 h-1 bg-gray-300 opacity-30"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationToast;
