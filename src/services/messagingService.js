import { supabase, handleSupabaseError } from '../config/supabase';

class MessagingService {
  // Create a new conversation or get existing one
  async createConversation(buyerId, sellerId, productId = null, offerId = null, initialMessage = null) {
    try {
      console.log('🔄 [MessagingService] Creating/finding conversation:', { buyerId, sellerId, productId });
      
      // Validate required IDs
      if (!buyerId || buyerId === 'undefined' || buyerId === 'null') {
        console.error('🔄 [MessagingService] Invalid buyerId:', buyerId);
        return { success: false, error: 'Invalid buyer ID provided' };
      }
      
      if (!sellerId || sellerId === 'undefined' || sellerId === 'null') {
        console.error('🔄 [MessagingService] Invalid sellerId:', sellerId);
        return { success: false, error: 'Invalid seller ID provided' };
      }

      // First, check if a conversation already exists between these users
      const { data: existingConversation, error: findError } = await supabase
        .from('conversations')
        .select('*')
        .eq('buyer_id', buyerId)
        .eq('seller_id', sellerId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!findError && existingConversation) {
        console.log('🔄 [MessagingService] Found existing conversation:', existingConversation.id);
        
        // If there's an initial message, add it to the existing conversation
        if (initialMessage) {
          await this.sendMessage(existingConversation.id, initialMessage.senderId, initialMessage.content, initialMessage.type);
        }

        return { success: true, conversationId: existingConversation.id };
      }

      console.log('🔄 [MessagingService] No existing conversation found, creating new one');

      // If productId is provided, check if it exists in the products table
      if (productId) {
        const { data: productExists, error: productError } = await supabase
          .from('products')
          .select('id')
          .eq('id', productId)
          .single();

        if (productError || !productExists) {
          console.warn('Product not found in products table, creating conversation without product_id:', productId);
          productId = null; // Set to null if product doesn't exist
        }
      }

      const conversationData = {
        buyer_id: buyerId,
        seller_id: sellerId,
        status: 'active'
      };

      // Only add product_id if it exists and is valid
      if (productId) {
        conversationData.product_id = productId;
      }

      // Only add offer_id if provided
      if (offerId) {
        conversationData.offer_id = offerId;
      }

      const { data, error } = await supabase
        .from('conversations')
        .insert([conversationData])
        .select()
        .single();

      if (error) throw error;

      console.log('🔄 [MessagingService] Created new conversation:', data.id);

      // If there's an initial message, add it
      if (initialMessage) {
        await this.sendMessage(data.id, initialMessage.senderId, initialMessage.content, initialMessage.type);
      }

      return { success: true, conversationId: data.id };
    } catch (error) {
      console.error('Create conversation error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Send a message
  async sendMessage(conversationId, senderId, content, type = 'text', metadata = {}) {
    try {
      const messageData = {
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: type || 'text', // Use message_type instead of type
        metadata,
        is_read: false
      };

      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select()
        .single();

      if (error) throw error;

      // Update conversation with last message timestamp
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('Send message error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Get conversations for a user
  async getUserConversations(userId, limitCount = 20) {
    try {
      console.log('🔄 [MessagingService] Getting conversations for user:', userId);
      
      // Validate userId before making query
      if (!userId || userId === 'undefined' || userId === 'null') {
        console.error('🔄 [MessagingService] Invalid userId:', userId);
        return { success: false, error: 'Invalid user ID provided' };
      }

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(limitCount);

      if (error) {
        console.error('🔄 [MessagingService] Supabase error:', error);
        throw error;
      }

      console.log('🔄 [MessagingService] Found conversations:', data?.length || 0);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get user conversations error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Get messages for a conversation
  async getConversationMessages(conversationId, limitCount = 50) {
    try {
      console.log('🔄 [MessagingService] Getting messages for conversation:', conversationId);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limitCount);

      if (error) {
        console.error('🔄 [MessagingService] Supabase error:', error);
        throw error;
      }

      console.log('🔄 [MessagingService] Found messages:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('🔄 [MessagingService] Sample message:', data[0]);
      }

      // Sort by creation time (oldest first)
      const messages = (data || []).sort((a, b) =>
        new Date(a.created_at) - new Date(b.created_at)
      );

      // Ensure consistent field naming for frontend
      const normalizedMessages = messages.map(msg => ({
        ...msg,
        senderId: msg.sender_id, // Map sender_id to senderId for frontend consistency
        createdAt: msg.created_at, // Map created_at to createdAt for frontend consistency
        messageType: msg.message_type // Map message_type to messageType for frontend consistency
      }));

      console.log('🔄 [MessagingService] Normalized messages:', normalizedMessages);

      return { success: true, data: normalizedMessages };
    } catch (error) {
      console.error('Get conversation messages error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Listen to conversation messages in real-time
  listenToConversation(conversationId, callback, limitCount = 50) {
    try {
      const channel = supabase
        .channel(`conversation:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          async () => {
            // Fetch updated messages
            const result = await this.getConversationMessages(conversationId, limitCount);
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
      console.error('Listen to conversation error:', error);
      callback({ success: false, error: handleSupabaseError(error) });
      return () => {};
    }
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId, userId) {
    try {
      // Mark individual messages as read
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Mark messages as read error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Edit message
  async editMessage(messageId, newContent) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          content: newContent
        })
        .eq('id', messageId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Edit message error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Delete message
  async deleteMessage(messageId) {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Delete message error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Get conversation by buyer, seller and product
  async getConversationByParticipants(buyerId, sellerId, productId = null) {
    try {
      let query = supabase
        .from('conversations')
        .select('*')
        .eq('buyer_id', buyerId)
        .eq('seller_id', sellerId)
        .eq('status', 'active');

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query.limit(1).single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        return { success: true, data };
      } else {
        return { success: false, data: null };
      }
    } catch (error) {
      console.error('Get conversation by participants error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Send offer message
  async sendOfferMessage(conversationId, senderId, offerData) {
    try {
      const messageData = {
        conversation_id: conversationId,
        sender_id: senderId,
        content: 'Offer made',
        message_type: 'offer',
        metadata: {
          offer_type: offerData.offerType, // 'barter', 'price_reduction', 'bundle'
          offer_value: offerData.offerValue,
          offer_description: offerData.offerDescription,
          offer_items: offerData.offerItems || [],
          original_price: offerData.originalPrice,
          offered_price: offerData.offeredPrice,
          expires_at: offerData.expiresAt
        },
        is_read: false
      };

      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select()
        .single();

      if (error) throw error;

      // Update conversation
      await supabase
        .from('conversations')
        .update({
          last_message: {
            content: 'Offer made',
            type: 'offer',
            sender_id: senderId,
            created_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('Send offer message error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Get unread message count for a user
  async getUnreadMessageCount(userId) {
    try {
      // First get all conversations for this user
      const conversationsResult = await this.getUserConversations(userId);
      if (!conversationsResult.success) {
        return { success: false, error: conversationsResult.error };
      }

      const conversations = conversationsResult.data;
      if (!conversations || conversations.length === 0) {
        return { success: true, count: 0 };
      }

      // Get unread messages for all conversations
      const conversationIds = conversations.map(conv => conv.id);
      
      const { data, error } = await supabase
        .from('messages')
        .select('id, conversation_id')
        .in('conversation_id', conversationIds)
        .eq('is_read', false)
        .neq('sender_id', userId);

      if (error) throw error;

      // Count unread messages per conversation
      const unreadCounts = {};
      (data || []).forEach(message => {
        unreadCounts[message.conversation_id] = (unreadCounts[message.conversation_id] || 0) + 1;
      });

      const totalCount = data?.length || 0;

      return { success: true, count: totalCount, unreadCounts };
    } catch (error) {
      console.error('Get unread message count error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Mark all messages in a conversation as read
  async markConversationAsRead(conversationId, userId) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Mark conversation as read error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }
}

export default new MessagingService();
