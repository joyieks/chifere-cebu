/**
 * Notification Bell Component
 * 
 * A bell icon that shows unread notification count and opens the notification panel.
 * Displays real-time notification updates with visual indicators.
 * 
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX } from 'react-icons/fi';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationPanel from './NotificationPanel';

const NotificationBell = ({ showLabel = false, label = "Notifications" }) => {
  const { unreadCount, requestNotificationPermission } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);
  const bellRef = useRef(null);

  // Request notification permission on first interaction
  useEffect(() => {
    if (!hasRequestedPermission && unreadCount > 0) {
      requestNotificationPermission();
      setHasRequestedPermission(true);
    }
  }, [unreadCount, requestNotificationPermission, hasRequestedPermission]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={bellRef}>
      {/* Notification Bell Button */}
      <button
        onClick={togglePanel}
        className={`relative ${showLabel ? 'p-2' : 'p-2'} text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2`}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <FiBell className="w-6 h-6" />
        {showLabel && <span className="text-sm">{label}</span>}
        
        {/* Unread Count Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse Animation for New Notifications */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 1.2, opacity: 0 }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                repeatType: 'reverse',
                ease: 'easeInOut'
              }}
              className="absolute inset-0 bg-red-500 rounded-full opacity-20"
            />
          )}
        </AnimatePresence>
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border border-gray-200 z-50"
          >
            <NotificationPanel onClose={() => setIsOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
