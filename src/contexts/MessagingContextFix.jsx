/**
 * MessagingContext Fix
 * 
 * This is a temporary fix for the MessagingContext to handle missing tables gracefully
 * and prevent 406 errors when accessing seller orders.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../config/supabase';

const MessagingContext = createContext();

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};

export const MessagingProvider = ({ children }) => {
  let user = null;
  
  try {
    const authContext = useAuth();
    user = authContext?.user;
  } catch (error) {
    console.warn('MessagingProvider: AuthContext not ready yet:', error.message);
    return <>{children}</>;
  }
  
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [participantDetails, setParticipantDetails] = useState({});
  
  // Refs for cleanup
  const listenersRef = useRef({});
  const typingTimeoutRef = useRef({});
  const participantDetailsRef = useRef({});

  // Update ref when participantDetails state changes
  useEffect(() => {
    participantDetailsRef.current = participantDetails;
  }, [participantDetails]);

  // Safe fetch participant details with error handling
  const fetchParticipantDetails = useCallback(async (userIds) => {
    const details = {};
    
    for (const userId of userIds) {
      if (participantDetailsRef.current[userId]) {
        details[userId] = participantDetailsRef.current[userId];
        continue;
      }
      
      try {
        console.log('🔄 [MessagingContext] Fetching details for user:', userId);
        
        // Try to get user from user_profiles table with error handling
        let profileData = null;
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('display_name, profile_image, user_type')
            .eq('id', userId)
            .single();

          if (!error && data) {
            profileData = data;
          }
        } catch (profileError) {
          console.warn('🔄 [MessagingContext] user_profiles query failed:', profileError);
        }

        if (profileData) {
          details[userId] = {
            name: profileData.display_name || 'ChiFere User',
            avatar: profileData.profile_image || null,
            userType: profileData.user_type
          };
          console.log('🔄 [MessagingContext] Found in user_profiles:', details[userId]);
          continue;
        }

        // Fallback: try buyer_users table with error handling
        let buyerData = null;
        try {
          const { data, error } = await supabase
            .from('buyer_users')
            .select('display_name, profile_image')
            .eq('id', userId)
            .single();

          if (!error && data) {
            buyerData = data;
          }
        } catch (buyerError) {
          console.warn('🔄 [MessagingContext] buyer_users query failed:', buyerError);
        }

        if (buyerData) {
          details[userId] = {
            name: buyerData.display_name || 'ChiFere User',
            avatar: buyerData.profile_image || null,
            userType: 'buyer'
          };
          console.log('🔄 [MessagingContext] Found in buyer_users:', details[userId]);
          continue;
        }

        // If all else fails, use default
        details[userId] = {
          name: 'ChiFere User',
          avatar: null,
          userType: 'unknown'
        };
      } catch (error) {
        console.error('Error fetching participant details for', userId, error);
        details[userId] = {
          name: 'ChiFere User',
          avatar: null,
          userType: 'unknown'
        };
      }
    }
    
    setParticipantDetails(prev => ({ ...prev, ...details }));
    return details;
  }, []);

  // Safe load conversations with error handling
  const loadConversations = useCallback(async () => {
    if (!user?.id) {
      console.log('🔄 [MessagingContext] No user ID, skipping conversation load');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Loading timeout after 15 seconds')), 15000)
      );
      
      // Try to get conversations with error handling - use simple query
      let conversationsResult = { success: false, data: [] };
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .eq('status', 'active')
          .order('updated_at', { ascending: false });

        if (!error && data) {
          conversationsResult = { success: true, data: data || [] };
        }
      } catch (conversationError) {
        console.warn('🔄 [MessagingContext] Conversations query failed:', conversationError);
        conversationsResult = { success: true, data: [] }; // Return empty array instead of failing
      }

      console.log('🔄 [MessagingContext] Conversations result:', conversationsResult);

      if (conversationsResult.success) {
        const normalizedConversations = conversationsResult.data.map(conv => ({
          ...conv,
          participants: [conv.buyer_id, conv.seller_id].filter(Boolean),
          unreadCount: conv.unread_count || {},
          lastMessage: null, // Will be fetched separately if needed
          updatedAt: conv.updated_at || conv.last_message_at,
          createdAt: conv.created_at,
          itemId: conv.product_id,
          isActive: conv.status === 'active'
        }));
        
        console.log('🔄 [MessagingContext] Normalized conversations:', normalizedConversations);
        
        // If no conversations, set empty array and continue
        if (!normalizedConversations || normalizedConversations.length === 0) {
          console.log('🔄 [MessagingContext] No conversations found, setting empty array');
          setConversations([]);
          setUnreadCount(0);
          setIsLoading(false);
          return;
        }

        // Fetch participant details for all conversations
        const allParticipantIds = new Set();
        normalizedConversations.forEach(conv => {
          conv.participants.forEach(pid => {
            if (pid !== user.id) {
              allParticipantIds.add(pid);
            }
          });
        });

        console.log('🔄 [MessagingContext] Participant IDs to fetch:', Array.from(allParticipantIds));
        let fetchedParticipantDetails = {};
        if (allParticipantIds.size > 0) {
          fetchedParticipantDetails = await fetchParticipantDetails(Array.from(allParticipantIds));
          console.log('🔄 [MessagingContext] Fetched participant details:', fetchedParticipantDetails);
        }

        setConversations(normalizedConversations);
        setUnreadCount(0); // Reset unread count
        setIsLoading(false);
      } else {
        console.error('🔄 [MessagingContext] Failed to load conversations:', conversationsResult.error);
        setError(conversationsResult.error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('🔄 [MessagingContext] Load conversations error:', error);
      setError(error.message);
      setIsLoading(false);
    }
  }, [user, fetchParticipantDetails]);

  // Load conversations when user changes
  useEffect(() => {
    if (user?.id) {
      loadConversations();
    } else {
      setConversations([]);
      setUnreadCount(0);
      setIsLoading(false);
    }
  }, [user?.id, loadConversations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up any active listeners
      Object.values(listenersRef.current).forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, []);

  // Mock functions for compatibility
  const sendMessage = useCallback(async (conversationId, content, type = 'text', metadata = {}) => {
    console.log('🔄 [MessagingContext] sendMessage called (mock):', { conversationId, content, type, metadata });
    return { success: true, messageId: 'mock-message-id' };
  }, []);

  const sendOffer = useCallback(async (offerData) => {
    console.log('🔄 [MessagingContext] sendOffer called (mock):', offerData);
    return { success: true, messageId: 'mock-offer-id' };
  }, []);

  const getConversationMessages = useCallback(async (conversationId) => {
    console.log('🔄 [MessagingContext] getConversationMessages called:', conversationId);
    try {
      const { data, error } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('🔄 [MessagingContext] Get messages error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('🔄 [MessagingContext] Get messages error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const markMessagesAsRead = useCallback(async (conversationId, userId) => {
    console.log('🔄 [MessagingContext] markMessagesAsRead called (mock):', { conversationId, userId });
    return { success: true };
  }, []);

  const createConversation = useCallback(async (buyerId, sellerId, productId = null) => {
    console.log('🔄 [MessagingContext] createConversation called (mock):', { buyerId, sellerId, productId });
    return { success: true, conversationId: 'mock-conversation-id' };
  }, []);

  const value = {
    // State
    conversations,
    activeConversation,
    messages,
    unreadCount,
    isLoading,
    error,
    isTyping,
    onlineUsers,
    participantDetails,
    
    // Actions
    setActiveConversation,
    sendMessage,
    sendOffer,
    getConversationMessages,
    markMessagesAsRead,
    createConversation,
    loadConversations,
    fetchParticipantDetails
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};
