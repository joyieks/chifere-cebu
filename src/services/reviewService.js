/**
 * Review Service
 * 
 * Handles all review-related operations including:
 * - Creating reviews
 * - Fetching reviews
 * - Updating reviews
 * - Deleting reviews
 * - Getting seller statistics
 * 
 * @version 1.0.0
 */

import { supabase } from '../config/supabase';

class ReviewService {
  /**
   * Create a new review
   * @param {Object} reviewData - Review data
   * @param {string} reviewData.buyer_id - Buyer ID
   * @param {string} reviewData.seller_id - Seller ID
   * @param {string} reviewData.product_id - Product ID
   * @param {string} reviewData.order_id - Order ID
   * @param {number} reviewData.rating - Rating (1-5)
   * @param {string} reviewData.comment - Review comment
   * @returns {Promise<Object>} - Result
   */
  async createReview(reviewData) {
    try {
      console.log('🔍 [ReviewService] Creating review:', reviewData);
      console.log('🔍 [ReviewService] Rating being saved:', reviewData.rating, 'Type:', typeof reviewData.rating);

      const insertData = {
        buyer_id: reviewData.buyer_id,
        seller_id: reviewData.seller_id,
        product_id: reviewData.product_id,
        order_id: reviewData.order_id,
        rating: reviewData.rating,
        comment: reviewData.comment,
        is_verified: true // Mark as verified since it's from a completed order
      };

      console.log('🔍 [ReviewService] Insert data:', insertData);

      const { data, error } = await supabase
        .from('reviews')
        .insert([insertData])
        .select();

      if (error) {
        console.error('❌ [ReviewService] Create review error:', error);
        throw error;
      }

      console.log('✅ [ReviewService] Review created:', data);
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('❌ [ReviewService] Create review error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get reviews for a seller
   * @param {string} sellerId - Seller ID
   * @param {number} limit - Number of reviews to fetch
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Object>} - Reviews
   */
  async getSellerReviews(sellerId, limit = 10, offset = 0) {
    try {
      console.log('🔍 [ReviewService] Getting reviews for seller:', sellerId);

      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ [ReviewService] Get seller reviews error:', error);
        throw error;
      }

      console.log('✅ [ReviewService] Seller reviews fetched:', data?.length || 0);
      return { success: true, reviews: data || [] };
    } catch (error) {
      console.error('❌ [ReviewService] Get seller reviews error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get reviews for a product
   * @param {string} productId - Product ID
   * @param {number} limit - Number of reviews to fetch
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Object>} - Reviews
   */
  async getProductReviews(productId, limit = 10, offset = 0) {
    try {
      console.log('🔍 [ReviewService] Getting reviews for product:', productId);

      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ [ReviewService] Get product reviews error:', error);
        throw error;
      }

      console.log('✅ [ReviewService] Product reviews fetched:', data?.length || 0);
      return { success: true, reviews: data || [] };
    } catch (error) {
      console.error('❌ [ReviewService] Get product reviews error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get seller statistics
   * @param {string} sellerId - Seller ID
   * @returns {Promise<Object>} - Seller stats
   */
  async getSellerStats(sellerId) {
    try {
      console.log('🔍 [ReviewService] Getting seller stats:', sellerId);

      const { data, error } = await supabase
        .from('seller_stats')
        .select('*')
        .eq('seller_id', sellerId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ [ReviewService] Get seller stats error:', error);
        throw error;
      }

      const stats = data || {
        seller_id: sellerId,
        total_followers: 0,
        total_reviews: 0,
        average_rating: 0.00,
        total_rating_sum: 0
      };

      console.log('✅ [ReviewService] Seller stats fetched:', stats);
      return { success: true, stats };
    } catch (error) {
      console.error('❌ [ReviewService] Get seller stats error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update a review
   * @param {string} reviewId - Review ID
   * @param {Object} updateData - Update data
   * @param {number} updateData.rating - New rating
   * @param {string} updateData.comment - New comment
   * @returns {Promise<Object>} - Result
   */
  async updateReview(reviewId, updateData) {
    try {
      console.log('🔍 [ReviewService] Updating review:', reviewId, updateData);

      const { data, error } = await supabase
        .from('reviews')
        .update({
          rating: updateData.rating,
          comment: updateData.comment,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId)
        .select();

      if (error) {
        console.error('❌ [ReviewService] Update review error:', error);
        throw error;
      }

      console.log('✅ [ReviewService] Review updated:', data);
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('❌ [ReviewService] Update review error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a review
   * @param {string} reviewId - Review ID
   * @returns {Promise<Object>} - Result
   */
  async deleteReview(reviewId) {
    try {
      console.log('🔍 [ReviewService] Deleting review:', reviewId);

      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) {
        console.error('❌ [ReviewService] Delete review error:', error);
        throw error;
      }

      console.log('✅ [ReviewService] Review deleted');
      return { success: true };
    } catch (error) {
      console.error('❌ [ReviewService] Delete review error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if buyer has already reviewed an order
   * @param {string} orderId - Order ID
   * @param {string} buyerId - Buyer ID
   * @returns {Promise<Object>} - Result
   */
  async hasReviewedOrder(orderId, buyerId) {
    try {
      console.log('🔍 [ReviewService] Checking if order is reviewed:', orderId, buyerId);

      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at')
        .eq('order_id', orderId)
        .eq('buyer_id', buyerId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ [ReviewService] Check review error:', error);
        throw error;
      }

      console.log('✅ [ReviewService] Review check result:', data ? 'exists' : 'not found');
      return { success: true, hasReviewed: !!data, review: data };
    } catch (error) {
      console.error('❌ [ReviewService] Check review error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new ReviewService();
