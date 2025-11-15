import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import messagingService from '../services/messagingService';

const MessageContext = createContext();

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

export const MessageProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch unread message count
  const fetchUnreadCount = async () => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const result = await messagingService.getUnreadMessageCount(user.id);
      
      if (result.success) {
        setUnreadCount(result.count || 0);
      } else {
        console.error('Failed to fetch unread count:', result.error);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Load unread count on mount and when user changes
  useEffect(() => {
    fetchUnreadCount();
  }, [user?.id]);

  // Refresh unread count every 30 seconds
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user?.id]);

  // Listen for messages marked as read event from MessagingContext
  useEffect(() => {
    const handleMessagesMarkedAsRead = () => {
      // Refresh unread count when messages are marked as read
      fetchUnreadCount();
    };

    window.addEventListener('messagesMarkedAsRead', handleMessagesMarkedAsRead);

    return () => {
      window.removeEventListener('messagesMarkedAsRead', handleMessagesMarkedAsRead);
    };
  }, []);

  // Function to manually refresh count (call after sending/reading a message)
  const refreshUnreadCount = () => {
    fetchUnreadCount();
  };

  // Mark conversation as read
  const markConversationAsRead = async (conversationId) => {
    if (!user?.id) return;

    try {
      const result = await messagingService.markConversationAsRead(conversationId, user.id);
      if (result.success) {
        // Refresh count after marking as read
        await fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const value = {
    unreadCount,
    loading,
    refreshUnreadCount,
    markConversationAsRead
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

export default MessageContext;
