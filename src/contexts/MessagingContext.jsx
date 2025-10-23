/**
 * MessagingContext - State management for ChiFere messaging system
 *
 * Provides centralized state management for conversations, messages,
 * and real-time updates using Supabase realtime channels.
 *
 * @version 2.0.0 - Migrated to Supabase
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import messagingService from '../services/messagingService';
import authService from '../services/authService';
import { supabase } from '../config/supabase';

// Helper function to normalize conversation data from Supabase
const normalizeConversation = (conv) => {
  console.log('🔄 [MessagingContext] Normalizing conversation:', conv);
  
  const normalized = {
    ...conv,
    participants: [conv.buyer_id, conv.seller_id].filter(Boolean), // Convert buyer_id/seller_id to participants array
    unreadCount: conv.unread_count || {},
    lastMessage: conv.last_message,
    updatedAt: conv.updated_at || conv.last_message_at,
    createdAt: conv.created_at,
    itemId: conv.product_id, // Map product_id to itemId
    isActive: conv.status === 'active'
  };
  
  console.log('🔄 [MessagingContext] Normalized conversation result:', normalized);
  return normalized;
};

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
    // Return children without messaging context if auth is not ready
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

  // Fetch participant details from database
  const fetchParticipantDetails = useCallback(async (userIds) => {
    const details = {};
    
    for (const userId of userIds) {
      if (participantDetailsRef.current[userId]) {
        details[userId] = participantDetailsRef.current[userId];
        continue;
      }
      
      try {
        console.log('🔄 [MessagingContext] Fetching details for user:', userId);
        
        // Try to get user from user_profiles table first (most common)
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('display_name, profile_image, user_type')
          .eq('id', userId)
          .single();

        console.log('🔄 [MessagingContext] user_profiles result:', { profileData, profileError });

        if (!profileError && profileData) {
          details[userId] = {
            name: profileData.display_name || 'ChiFere User',
            avatar: profileData.profile_image || null,
            userType: profileData.user_type
          };
          console.log('🔄 [MessagingContext] Found in user_profiles:', details[userId]);
          continue;
        }

        // Fallback: try buyer_users table
        const { data: buyerData, error: buyerError } = await supabase
          .from('buyer_users')
          .select('display_name, profile_image')
          .eq('id', userId)
          .single();

        console.log('🔄 [MessagingContext] buyer_users result:', { buyerData, buyerError });

        if (!buyerError && buyerData) {
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
  }, []); // No dependencies - uses ref for current state

  // Load user conversations on mount
  useEffect(() => {
    if (!user?.id || user.id === 'undefined' || user.id === 'null') {
      console.log('🔄 [MessagingContext] No valid user ID, skipping conversation load');
      setConversations([]);
      setIsLoading(false);
      return;
    }

    const loadConversations = async () => {
      setIsLoading(true);
      console.log('🔄 [MessagingContext] Loading conversations for user:', user.id);
      
      try {
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Loading timeout after 10 seconds')), 10000)
        );
        
        const result = await Promise.race([
          messagingService.getUserConversations(user.id),
          timeoutPromise
        ]);
        console.log('🔄 [MessagingContext] Conversations result:', result);

        if (result.success) {
        // Normalize conversation data from Supabase
        const normalizedConversations = result.data.map(normalizeConversation);
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

        // Fetch last message for each conversation if not present
        const conversationsWithMessages = await Promise.all(
          normalizedConversations.map(async (conv) => {
            let lastMessage = conv.lastMessage;
            
            // If no last message object, fetch the actual last message
            if (!lastMessage && conv.last_message_at) {
              try {
                const { data: messages, error } = await supabase
                  .from('messages')
                  .select('*')
                  .eq('conversation_id', conv.id)
                  .order('created_at', { ascending: false })
                  .limit(1);
                
                if (!error && messages && messages.length > 0) {
                  lastMessage = {
                    content: messages[0].content,
                    type: messages[0].type || 'text',
                    senderId: messages[0].sender_id,
                    createdAt: messages[0].created_at
                  };
                }
              } catch (error) {
                console.error('Error fetching last message for conversation', conv.id, error);
              }
            }
            
            return {
              ...conv,
              lastMessage,
              participantInfo: {}
            };
          })
        );

        // Attach participant info to conversations
        const conversationsWithInfo = conversationsWithMessages.map(conv => ({
          ...conv,
          participantInfo: {}
        }));

        // Populate participant info for each conversation
        conversationsWithInfo.forEach(conv => {
          conv.participants.forEach(participantId => {
            if (participantId !== user.id) {
              const details = fetchedParticipantDetails[participantId] || {
                name: 'ChiFere User',
                avatar: null
              };
              conv.participantInfo[participantId] = details;
            }
          });
        });

        setConversations(conversationsWithInfo);

        // Calculate total unread and per-conversation counts
        const unreadResult = await messagingService.getUnreadMessageCount(user.id);
        const total = unreadResult.success ? unreadResult.count : 0;
        const unreadCounts = unreadResult.success ? unreadResult.unreadCounts : {};
        setUnreadCount(total);

        // Update conversations with unread counts
        setConversations(prev => prev.map(conv => ({
          ...conv,
          unreadCount: {
            ...conv.unreadCount,
            [user.id]: unreadCounts[conv.id] || 0
          }
        })));
        } else {
          console.error('🔄 [MessagingContext] Failed to load conversations:', result.error);
          setError(result.error);
        }
      } catch (error) {
        console.error('🔄 [MessagingContext] Error in loadConversations:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();

    // Get unread count
    const updateUnreadCount = async () => {
      const result = await messagingService.getUnreadMessageCount(user.id);
      if (result.success) {
        setUnreadCount(result.count);
      }
    };
    updateUnreadCount();
  }, [user]);

  // Get conversations for current user
  const getUserConversations = useCallback(async () => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    setIsLoading(true);
    try {
      const result = await messagingService.getUserConversations(user.id);

      if (result.success) {
        // Normalize conversation data from Supabase
        const normalizedConversations = result.data.map(normalizeConversation);

        // Fetch participant details
        const allParticipantIds = new Set();
        normalizedConversations.forEach(conv => {
          conv.participants.forEach(pid => {
            if (pid !== user.id) allParticipantIds.add(pid);
          });
        });

        let fetchedParticipantDetails = {};
        if (allParticipantIds.size > 0) {
          fetchedParticipantDetails = await fetchParticipantDetails(Array.from(allParticipantIds));
        }

        // Attach participant info to conversations
        const conversationsWithInfo = normalizedConversations.map(conv => ({
          ...conv,
          participantInfo: {}
        }));

        // Populate participant info for each conversation
        conversationsWithInfo.forEach(conv => {
          conv.participants.forEach(participantId => {
            if (participantId !== user.uid) {
              const details = fetchedParticipantDetails[participantId] || {
                name: 'ChiFere User',
                avatar: null
              };
              conv.participantInfo[participantId] = details;
            }
          });
        });

        setConversations(conversationsWithInfo);

        // Calculate unread
        const total = normalizedConversations.reduce((sum, conv) =>
          sum + (conv.unreadCount[user.id] || 0), 0
        );
        setUnreadCount(total);
      }

      return result;
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchParticipantDetails]);

  // Get messages for a conversation
  const getConversationMessages = useCallback(async (conversationId) => {
    if (!conversationId) return { success: false, error: 'No conversation ID provided' };
    
    setIsLoading(true);
    try {
      const result = await messagingService.getConversationMessages(conversationId);
      
      if (result.success) {
        console.log('🔄 [MessagingContext] Setting messages for conversation', conversationId, ':', result.data);
        setMessages(prev => ({
          ...prev,
          [conversationId]: result.data
        }));
      } else {
        console.error('🔄 [MessagingContext] Failed to load messages:', result.error);
      }
      
      return result;
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(async (conversationId, content, type = 'text', metadata = {}) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };
    
    try {
      // Optimistic update
      const optimisticMessage = {
        id: `temp_${Date.now()}`,
        conversationId,
        senderId: user.id,
        content,
        type,
        metadata,
        createdAt: new Date(),
        isRead: false,
        isEdited: false
      };

      setMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), optimisticMessage]
      }));

      // Send to Supabase
      const result = await messagingService.sendMessage(
        conversationId,
        user.id,
        content,
        type,
        metadata
      );

      if (result.success) {
        // Update conversation last message
        setConversations(prev => prev.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              lastMessage: {
                content,
                type,
                senderId: user.id,
                createdAt: new Date()
              },
              updatedAt: new Date()
            };
          }
          return conv;
        }));
      } else {
        // Revert optimistic update on failure
        setMessages(prev => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).filter(m => m.id !== optimisticMessage.id)
        }));
      }
      
      return result;
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  }, [user]);

  // Send an offer
  const sendOffer = useCallback(async (offerData) => {
    if (!user?.id || user.id === 'undefined' || user.id === 'null') {
      console.error('🔄 [MessagingContext] Invalid user ID for sendOffer:', user?.id);
      return { success: false, error: 'User not authenticated' };
    }
    
    try {
      // Create or get conversation with the seller
      console.log('🔄 [MessagingContext] Creating conversation for offer:', {
        buyerId: user.id,
        sellerId: offerData.sellerId,
        productId: offerData.productId
      });
      
      const conversationResult = await messagingService.createConversation(
        user.id, // buyer ID
        offerData.sellerId, // seller ID
        offerData.productId // product ID
      );

      if (!conversationResult.success) {
        return { success: false, error: conversationResult.error };
      }

      // Create offer message content with product image
      const offerMessage = `🛍️ **MAKE OFFER REQUEST**

**Product:** ${offerData.productName}
**Price:** ₱${offerData.productPrice || '0'}
**Product ID:** ${offerData.productId}
**Product Image:** ${offerData.productImage || 'No image available'}

**Offer Type:** ${offerData.offerType}
${offerData.offerValue ? `**Offer Value:** ₱${offerData.offerValue}` : ''}
${offerData.offerItems ? `**Items Offered:** ${offerData.offerItems}` : ''}
**Description:** ${offerData.offerDescription}
${offerData.message ? `**Additional Message:** ${offerData.message}` : ''}

**Status:** ${offerData.status || 'pending'}`;

      // Send the offer as a message
      const messageResult = await messagingService.sendMessage(
        conversationResult.conversationId,
        user.id,
        offerMessage,
        'offer',
        {
          offerType: offerData.offerType,
          offerValue: offerData.offerValue,
          offerDescription: offerData.offerDescription,
          offerItems: offerData.offerItems,
          productId: offerData.productId,
          productName: offerData.productName,
          status: offerData.status || 'pending'
        }
      );

      if (messageResult.success) {
        // Update local messages state
        setMessages(prev => ({
          ...prev,
          [conversationResult.conversationId]: [
            ...(prev[conversationResult.conversationId] || []),
            {
              id: messageResult.messageId,
              conversationId: conversationResult.conversationId,
              senderId: user.id,
              content: offerMessage,
              type: 'offer',
        metadata: {
          offerType: offerData.offerType,
          offerValue: offerData.offerValue,
          offerDescription: offerData.offerDescription,
          offerItems: offerData.offerItems,
          productId: offerData.productId,
          productName: offerData.productName,
          productImage: offerData.productImage,
          productPrice: offerData.productPrice,
          status: offerData.status || 'pending'
        },
              createdAt: new Date(),
              isRead: false
            }
          ]
        }));

        // Update conversations list
        setConversations(prev => prev.map(conv => {
          if (conv.id === conversationResult.conversationId) {
            return {
              ...conv,
              lastMessage: {
                content: offerMessage,
                type: 'offer',
                senderId: user.id,
                createdAt: new Date()
              },
              updatedAt: new Date()
            };
          }
          return conv;
        }));
      }

      return messageResult;
    } catch (error) {
      console.error('Error sending offer:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  }, [user]);

  // Create a new conversation
  const createConversation = useCallback(async (participants, itemId = null, initialMessage = null) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };
    
    try {
      // Check if conversation already exists
      const existingResult = await messagingService.getConversationByParticipants(
        [...participants, user.id],
        itemId
      );
      
      if (existingResult.success && existingResult.data) {
        // Conversation exists, use it
        return { success: true, conversationId: existingResult.data.id };
      }

      // Create new conversation
      const result = await messagingService.createConversation(
        [...participants, user.uid],
        itemId,
        initialMessage
      );

      if (result.success) {
        // Refresh conversations list
        await getUserConversations();
      }

      return result;
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  }, [user, getUserConversations]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (conversationId) => {
    if (!user?.uid) return { success: false, error: 'User not authenticated' };
    
    try {
      const result = await messagingService.markMessagesAsRead(conversationId, user.uid);
      
      if (result.success) {
        // Update local state
        setConversations(prev => prev.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              unreadCount: {
                ...conv.unreadCount,
                [user.id]: 0
              }
            };
          }
          return conv;
        }));

        // Mark messages as read locally
        setMessages(prev => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).map(message => ({
            ...message,
            isRead: message.senderId === user.id ? message.isRead : true
          }))
        }));

        // Recalculate total unread count
        const newUnreadCount = conversations.reduce((total, conv) => {
          if (conv.id === conversationId) return total;
          return total + (conv.unreadCount[user.id] || 0);
        }, 0);
        setUnreadCount(newUnreadCount);

        // Also update the unread count in the database
        await messagingService.markMessagesAsRead(conversationId, user.id);
      }

      return result;
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  }, [user, conversations]);

  // Set typing status
  const setTypingStatus = useCallback((conversationId, isTyping) => {
    if (!user) return;

    setIsTyping(prev => ({
      ...prev,
      [conversationId]: isTyping
    }));

    // Clear typing status after timeout
    if (typingTimeoutRef.current[conversationId]) {
      clearTimeout(typingTimeoutRef.current[conversationId]);
    }

    if (isTyping) {
      typingTimeoutRef.current[conversationId] = setTimeout(() => {
        setIsTyping(prev => ({
          ...prev,
          [conversationId]: false
        }));
      }, 3000);
    }
  }, [user]);

  // Get unread message count
  const getUnreadMessageCount = useCallback(() => {
    return unreadCount;
  }, [unreadCount]);

  // Listen to active conversation in real-time using Supabase channels
  useEffect(() => {
    if (!activeConversation?.id) return;

    const conversationId = activeConversation.id;

    // Set up Supabase realtime channel for messages
    const unsubscribe = messagingService.listenToConversation(
      conversationId,
      (result) => {
        if (result.success) {
          // Normalize message timestamps from Supabase
          const normalizedMessages = result.data.map(msg => ({
            ...msg,
            senderId: msg.sender_id,
            conversationId: msg.conversation_id,
            createdAt: msg.created_at,
            updatedAt: msg.updated_at,
            isRead: msg.is_read,
            isEdited: msg.is_edited,
            isDeleted: msg.is_deleted
          }));

          setMessages(prev => ({
            ...prev,
            [conversationId]: normalizedMessages
          }));
        }
      }
    );

    // Store unsubscribe function
    listenersRef.current[conversationId] = unsubscribe;

    // Cleanup on conversation change
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
      delete listenersRef.current[conversationId];
    };
  }, [activeConversation]);

  // Cleanup function
  useEffect(() => {
    return () => {
      // Clean up listeners and timeouts
      Object.values(listenersRef.current).forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
      
      Object.values(typingTimeoutRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
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

    // Actions
    getUserConversations,
    getConversationMessages,
    sendMessage,
    sendOffer,
    createConversation,
    markMessagesAsRead,
    setTypingStatus,
    getUnreadMessageCount,
    setActiveConversation,
    setError
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};

export default MessagingContext;
