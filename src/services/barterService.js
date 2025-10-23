/**
 * Barter Service
 *
 * Handles the barter trading system as per ChiFere's core feature.
 * Allows users to exchange items without monetary transactions.
 *
 * Features:
 * - Create barter offers
 * - Counter-offer system
 * - Negotiation tracking
 * - Accept/reject offers
 * - Complete barter exchanges
 *
 * @version 1.0.0
 */

import { supabase, handleSupabaseError } from '../config/supabase';
import notificationService from './notificationService';

class BarterService {
  /**
   * Create a new barter offer
   * @param {Object} barterData - Barter offer details
   * @returns {Promise<Object>} - Result with barterId
   */
  async createBarterOffer(barterData) {
    try {
      // Validate required fields
      if (!barterData.requesterId || !barterData.ownerId || !barterData.originalItemId || !barterData.offeredItems || barterData.offeredItems.length === 0) {
        return { success: false, error: 'Missing required barter fields' };
      }

      // Calculate total value of offered items
      const offeredValue = barterData.offeredItems.reduce((sum, item) =>
        sum + (item.estimatedValue || 0), 0
      );

      const barter = {
        // Parties
        requester_id: barterData.requesterId,
        owner_id: barterData.ownerId,

        // Items
        original_item_id: barterData.originalItemId,
        original_item: barterData.originalItem || null,

        offered_items: barterData.offeredItems.map(item => ({
          item_id: item.id || item.itemId,
          name: item.name,
          condition: item.condition,
          category: item.category,
          estimated_value: item.estimatedValue || 0,
          description: item.description || '',
          image: item.image || ''
        })),

        // Negotiation
        status: 'pending',
        current_offer_id: null,

        negotiations: [
          {
            from_user_id: barterData.requesterId,
            to_user_id: barterData.ownerId,
            items: barterData.offeredItems,
            message: barterData.message || '',
            total_value: offeredValue,
            type: 'initial_offer',
            timestamp: new Date().toISOString(),
            status: 'pending'
          }
        ],

        // Messaging
        conversation_id: barterData.conversationId || null,
        message: barterData.message || '',

        // Delivery
        delivery_status: null,
        delivery_id: null,

        // Timestamps
        accepted_at: null,
        completed_at: null,
        cancelled_at: null
      };

      const { data, error } = await supabase
        .from('buyer_barter_offer')
        .insert([barter])
        .select()
        .single();

      if (error) throw error;

      // Send notification to owner
      await notificationService.createBarterNotification(
        barterData.ownerId,
        {
          barterId: data.id,
          itemId: barterData.originalItemId,
          itemName: barterData.originalItem?.name || 'your item',
          status: 'received',
          senderId: barterData.requesterId,
          senderName: barterData.requesterName || 'A user'
        }
      );

      return {
        success: true,
        barterId: data.id,
        barter: data
      };
    } catch (error) {
      console.error('Create barter offer error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  /**
   * Create a counter-offer
   * @param {string} barterId - Original barter ID
   * @param {string} userId - User making counter-offer
   * @param {Object} counterOfferData - Counter-offer details
   * @returns {Promise<Object>} - Result
   */
  async createCounterOffer(barterId, userId, counterOfferData) {
    try {
      const barterResult = await this.getBarterById(barterId);
      if (!barterResult.success) {
        return barterResult;
      }

      const barter = barterResult.data;

      // Verify user is authorized to counter
      if (barter.requester_id !== userId && barter.owner_id !== userId) {
        return { success: false, error: 'Unauthorized' };
      }

      const counterValue = counterOfferData.items.reduce((sum, item) =>
        sum + (item.estimatedValue || 0), 0
      );

      const negotiation = {
        from_user_id: userId,
        to_user_id: userId === barter.requester_id ? barter.owner_id : barter.requester_id,
        items: counterOfferData.items,
        message: counterOfferData.message || '',
        total_value: counterValue,
        type: 'counter_offer',
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      const updatedNegotiations = [...barter.negotiations, negotiation];

      const { error } = await supabase
        .from('buyer_barter_offer')
        .update({
          negotiations: updatedNegotiations,
          status: 'counter_offered',
          updated_at: new Date().toISOString()
        })
        .eq('id', barterId);

      if (error) throw error;

      // Notify the other party
      const notifyUserId = userId === barter.requester_id ? barter.owner_id : barter.requester_id;

      await notificationService.createBarterNotification(
        notifyUserId,
        {
          barterId,
          itemId: barter.original_item_id,
          itemName: barter.original_item?.name || 'the item',
          status: 'counter-offered',
          senderId: userId,
          senderName: 'Another user'
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Create counter-offer error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  /**
   * Accept a barter offer
   * @param {string} barterId - Barter ID
   * @param {string} userId - User accepting the offer
   * @returns {Promise<Object>} - Result
   */
  async acceptBarterOffer(barterId, userId) {
    try {
      const barterResult = await this.getBarterById(barterId);
      if (!barterResult.success) {
        return barterResult;
      }

      const barter = barterResult.data;

      // Verify user is authorized
      if (barter.requester_id !== userId && barter.owner_id !== userId) {
        return { success: false, error: 'Unauthorized' };
      }

      const { error } = await supabase
        .from('buyer_barter_offer')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          accepted_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', barterId);

      if (error) throw error;

      // Notify the other party
      const notifyUserId = userId === barter.requester_id ? barter.owner_id : barter.requester_id;

      await notificationService.createBarterNotification(
        notifyUserId,
        {
          barterId,
          itemId: barter.original_item_id,
          itemName: barter.original_item?.name || 'the item',
          status: 'accepted',
          senderId: userId,
          senderName: 'The other party'
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Accept barter offer error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  /**
   * Reject a barter offer
   * @param {string} barterId - Barter ID
   * @param {string} userId - User rejecting
   * @param {string} reason - Optional rejection reason
   * @returns {Promise<Object>} - Result
   */
  async rejectBarterOffer(barterId, userId, reason = '') {
    try {
      const barterResult = await this.getBarterById(barterId);
      if (!barterResult.success) {
        return barterResult;
      }

      const barter = barterResult.data;

      // Verify user is authorized
      if (barter.requester_id !== userId && barter.owner_id !== userId) {
        return { success: false, error: 'Unauthorized' };
      }

      const { error } = await supabase
        .from('buyer_barter_offer')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          rejected_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', barterId);

      if (error) throw error;

      // Notify the other party
      const notifyUserId = userId === barter.requester_id ? barter.owner_id : barter.requester_id;

      await notificationService.createBarterNotification(
        notifyUserId,
        {
          barterId,
          itemId: barter.original_item_id,
          itemName: barter.original_item?.name || 'the item',
          status: 'rejected',
          senderId: userId,
          senderName: 'The other party'
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Reject barter offer error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  /**
   * Complete a barter exchange (both parties received items)
   * @param {string} barterId - Barter ID
   * @param {string} userId - User completing
   * @returns {Promise<Object>} - Result
   */
  async completeBarterExchange(barterId, userId) {
    try {
      const barterResult = await this.getBarterById(barterId);
      if (!barterResult.success) {
        return barterResult;
      }

      const barter = barterResult.data;

      // Must be accepted first
      if (barter.status !== 'accepted') {
        return { success: false, error: 'Barter must be accepted first' };
      }

      const { error } = await supabase
        .from('buyer_barter_offer')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', barterId);

      if (error) throw error;

      // Notify the other party
      const notifyUserId = userId === barter.requester_id ? barter.owner_id : barter.requester_id;

      await notificationService.createBarterNotification(
        notifyUserId,
        {
          barterId,
          itemId: barter.original_item_id,
          itemName: barter.original_item?.name || 'the item',
          status: 'completed',
          senderId: userId,
          senderName: 'The other party'
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Complete barter exchange error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  /**
   * Cancel a barter offer
   * @param {string} barterId - Barter ID
   * @param {string} userId - User cancelling
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} - Result
   */
  async cancelBarterOffer(barterId, userId, reason = '') {
    try {
      const barterResult = await this.getBarterById(barterId);
      if (!barterResult.success) {
        return barterResult;
      }

      const barter = barterResult.data;

      // Only requester can cancel before acceptance
      if (barter.status !== 'accepted' && barter.requester_id !== userId) {
        return { success: false, error: 'Only the requester can cancel pending offers' };
      }

      // Can't cancel if already completed
      if (barter.status === 'completed') {
        return { success: false, error: 'Cannot cancel completed barter' };
      }

      const { error } = await supabase
        .from('buyer_barter_offer')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_by: userId,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', barterId);

      if (error) throw error;

      // Notify the other party
      const notifyUserId = userId === barter.requester_id ? barter.owner_id : barter.requester_id;

      await notificationService.createSystemNotification(
        notifyUserId,
        {
          title: 'Barter Cancelled',
          message: `The barter for "${barter.original_item?.name || 'an item'}" has been cancelled. ${reason}`,
          isActionable: true,
          actionUrl: `/barter/${barterId}`
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Cancel barter offer error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  /**
   * Get a barter by ID
   * @param {string} barterId - Barter ID
   * @returns {Promise<Object>} - Barter data
   */
  async getBarterById(barterId) {
    try {
      const { data, error } = await supabase
        .from('buyer_barter_offer')
        .select('*')
        .eq('id', barterId)
        .single();

      if (error) throw error;

      if (!data) {
        return { success: false, error: 'Barter not found' };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Get barter by ID error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  /**
   * Get user barters (received or sent)
   * @param {string} userId - User ID
   * @param {string} type - 'received' or 'sent' or 'all'
   * @param {number} limitCount - Limit
   * @returns {Promise<Object>} - Barters array
   */
  async getUserBarters(userId, type = 'all', limitCount = 50) {
    try {
      let data;

      if (type === 'received') {
        const { data: received, error } = await supabase
          .from('buyer_barter_offer')
          .select('*')
          .eq('owner_id', userId)
          .order('created_at', { ascending: false })
          .limit(limitCount);

        if (error) throw error;
        data = received.map(item => ({ ...item, type: 'received' }));
      } else if (type === 'sent') {
        const { data: sent, error } = await supabase
          .from('buyer_barter_offer')
          .select('*')
          .eq('requester_id', userId)
          .order('created_at', { ascending: false })
          .limit(limitCount);

        if (error) throw error;
        data = sent.map(item => ({ ...item, type: 'sent' }));
      } else {
        // Get both
        const [receivedResult, sentResult] = await Promise.all([
          supabase
            .from('buyer_barter_offer')
            .select('*')
            .eq('owner_id', userId)
            .order('created_at', { ascending: false })
            .limit(limitCount),
          supabase
            .from('buyer_barter_offer')
            .select('*')
            .eq('requester_id', userId)
            .order('created_at', { ascending: false })
            .limit(limitCount)
        ]);

        if (receivedResult.error) throw receivedResult.error;
        if (sentResult.error) throw sentResult.error;

        const allBarters = [
          ...(receivedResult.data || []).map(item => ({ ...item, type: 'received' })),
          ...(sentResult.data || []).map(item => ({ ...item, type: 'sent' }))
        ];

        // Sort by created_at
        allBarters.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        data = allBarters.slice(0, limitCount);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Get user barters error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  /**
   * Listen to real-time barter updates
   * @param {string} barterId - Barter ID
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  listenToBarterUpdates(barterId, callback) {
    try {
      const channel = supabase
        .channel(`barter:${barterId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'buyer_barter_offer',
            filter: `id=eq.${barterId}`
          },
          (payload) => {
            callback({ success: true, data: payload.new });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Listen to barter error:', error);
      return () => {};
    }
  }

  /**
   * Listen to user barters in real-time
   * @param {string} userId - User ID
   * @param {string} type - 'received' or 'sent'
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  listenToUserBarters(userId, type = 'received', callback) {
    try {
      const field = type === 'received' ? 'owner_id' : 'requester_id';

      const channel = supabase
        .channel(`user-barters:${userId}:${type}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'buyer_barter_offer',
            filter: `${field}=eq.${userId}`
          },
          async () => {
            // Fetch updated data
            const result = await this.getUserBarters(userId, type, 50);
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
      console.error('Listen to user barters error:', error);
      return () => {};
    }
  }

  /**
   * Link barter to conversation
   * @param {string} barterId - Barter ID
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} - Result
   */
  async linkBarterToConversation(barterId, conversationId) {
    try {
      const { error } = await supabase
        .from('buyer_barter_offer')
        .update({
          conversation_id: conversationId,
          updated_at: new Date().toISOString()
        })
        .eq('id', barterId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Link barter to conversation error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }
}

export default new BarterService();
