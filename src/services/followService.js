/**
 * Follow Service
 * 
 * Handles all follow-related operations including:
 * - Following sellers
 * - Unfollowing sellers
 * - Getting followers
 * - Getting following list
 * - Checking follow status
 * 
 * @version 1.0.0
 */

import { supabase } from '../config/supabase';

class FollowService {
  /**
   * Follow a seller
   * @param {string} buyerId - Buyer ID
   * @param {string} sellerId - Seller ID
   * @returns {Promise<Object>} - Result
   */
  async followSeller(buyerId, sellerId) {
    try {
      console.log('🔍 [FollowService] Following seller:', { buyerId, sellerId });

      const { data, error } = await supabase
        .from('follows')
        .insert([{
          buyer_id: buyerId,
          seller_id: sellerId
        }])
        .select();

      if (error) {
        console.error('❌ [FollowService] Follow seller error:', error);
        throw error;
      }

      console.log('✅ [FollowService] Seller followed:', data);
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('❌ [FollowService] Follow seller error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Unfollow a seller
   * @param {string} buyerId - Buyer ID
   * @param {string} sellerId - Seller ID
   * @returns {Promise<Object>} - Result
   */
  async unfollowSeller(buyerId, sellerId) {
    try {
      console.log('🔍 [FollowService] Unfollowing seller:', { buyerId, sellerId });

      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('buyer_id', buyerId)
        .eq('seller_id', sellerId);

      if (error) {
        console.error('❌ [FollowService] Unfollow seller error:', error);
        throw error;
      }

      console.log('✅ [FollowService] Seller unfollowed');
      return { success: true };
    } catch (error) {
      console.error('❌ [FollowService] Unfollow seller error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get followers for a seller
   * @param {string} sellerId - Seller ID
   * @param {number} limit - Number of followers to fetch
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Object>} - Followers
   */
  async getSellerFollowers(sellerId, limit = 20, offset = 0) {
    try {
      console.log('🔍 [FollowService] Getting followers for seller:', sellerId);

      const { data, error } = await supabase
        .from('follows')
        .select(`
          *,
          buyer:buyer_id (
            id,
            email,
            raw_user_meta_data
          )
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ [FollowService] Get seller followers error:', error);
        throw error;
      }

      console.log('✅ [FollowService] Seller followers fetched:', data?.length || 0);
      return { success: true, followers: data || [] };
    } catch (error) {
      console.error('❌ [FollowService] Get seller followers error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get following list for a buyer
   * @param {string} buyerId - Buyer ID
   * @param {number} limit - Number of following to fetch
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Object>} - Following list
   */
  async getBuyerFollowing(buyerId, limit = 20, offset = 0) {
    try {
      console.log('🔍 [FollowService] Getting following for buyer:', buyerId);

      const { data, error } = await supabase
        .from('follows')
        .select(`
          *,
          seller:seller_id (
            id,
            email,
            raw_user_meta_data
          )
        `)
        .eq('buyer_id', buyerId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ [FollowService] Get buyer following error:', error);
        throw error;
      }

      console.log('✅ [FollowService] Buyer following fetched:', data?.length || 0);
      return { success: true, following: data || [] };
    } catch (error) {
      console.error('❌ [FollowService] Get buyer following error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if buyer is following a seller
   * @param {string} buyerId - Buyer ID
   * @param {string} sellerId - Seller ID
   * @returns {Promise<Object>} - Follow status
   */
  async isFollowing(buyerId, sellerId) {
    try {
      console.log('🔍 [FollowService] Checking follow status:', { buyerId, sellerId });

      const { data, error } = await supabase
        .from('follows')
        .select('id, created_at')
        .eq('buyer_id', buyerId)
        .eq('seller_id', sellerId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ [FollowService] Check follow status error:', error);
        throw error;
      }

      const isFollowing = !!data;
      console.log('✅ [FollowService] Follow status:', isFollowing ? 'following' : 'not following');
      return { success: true, isFollowing, followData: data };
    } catch (error) {
      console.error('❌ [FollowService] Check follow status error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get follower count for a seller
   * @param {string} sellerId - Seller ID
   * @returns {Promise<Object>} - Follower count
   */
  async getFollowerCount(sellerId) {
    try {
      console.log('🔍 [FollowService] Getting follower count for seller:', sellerId);

      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', sellerId);

      if (error) {
        console.error('❌ [FollowService] Get follower count error:', error);
        throw error;
      }

      console.log('✅ [FollowService] Follower count:', count || 0);
      return { success: true, count: count || 0 };
    } catch (error) {
      console.error('❌ [FollowService] Get follower count error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get following count for a buyer
   * @param {string} buyerId - Buyer ID
   * @returns {Promise<Object>} - Following count
   */
  async getFollowingCount(buyerId) {
    try {
      console.log('🔍 [FollowService] Getting following count for buyer:', buyerId);

      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('buyer_id', buyerId);

      if (error) {
        console.error('❌ [FollowService] Get following count error:', error);
        throw error;
      }

      console.log('✅ [FollowService] Following count:', count || 0);
      return { success: true, count: count || 0 };
    } catch (error) {
      console.error('❌ [FollowService] Get following count error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Toggle follow status (follow if not following, unfollow if following)
   * @param {string} buyerId - Buyer ID
   * @param {string} sellerId - Seller ID
   * @returns {Promise<Object>} - Result with new follow status
   */
  async toggleFollow(buyerId, sellerId) {
    try {
      console.log('🔍 [FollowService] Toggling follow status:', { buyerId, sellerId });

      // Check current follow status
      const followStatus = await this.isFollowing(buyerId, sellerId);
      if (!followStatus.success) {
        return followStatus;
      }

      let result;
      if (followStatus.isFollowing) {
        // Unfollow
        result = await this.unfollowSeller(buyerId, sellerId);
        if (result.success) {
          return { success: true, isFollowing: false, action: 'unfollowed' };
        }
      } else {
        // Follow
        result = await this.followSeller(buyerId, sellerId);
        if (result.success) {
          return { success: true, isFollowing: true, action: 'followed' };
        }
      }

      return result;
    } catch (error) {
      console.error('❌ [FollowService] Toggle follow error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new FollowService();
