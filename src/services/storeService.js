/**
 * Store Service
 * 
 * Handles store/seller-related operations including fetching store data,
 * store products, and store statistics from Supabase.
 * 
 * Features:
 * - Get store by ID
 * - Get store products
 * - Get store statistics
 * - Search stores
 * 
 * @version 1.0.0
 */

import { supabase } from '../config/supabase';

class StoreService {
  /**
   * Get store/seller profile by ID
   * @param {string} storeId - Store/Seller ID
   * @returns {Promise<Object>} - Store result
   */
  async getStoreById(storeId) {
    try {
      console.log('🏪 [StoreService] Fetching store with ID:', storeId);
      
      // First try to get from user_profiles table (main seller data)
      const { data: store, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', storeId)
        .eq('user_type', 'seller')
        .single();

      if (error) {
        console.error('❌ [StoreService] Get store by ID error:', error);
        return { success: false, error: 'Store not found' };
      }

      if (!store) {
        return { success: false, error: 'Store not found' };
      }

      console.log('✅ [StoreService] Store found:', store);
      console.log('Store data sample:', {
        id: store.id,
        business_name: store.business_name,
        display_name: store.display_name,
        business_description: store.business_description,
        is_business_verified: store.is_business_verified,
        profile_image: store.profile_image
      });
      return { success: true, data: store };
    } catch (error) {
      console.error('❌ [StoreService] Get store by ID error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get products by store/seller ID
   * @param {string} storeId - Store/Seller ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Products result
   */
  async getStoreProducts(storeId, options = {}) {
    try {
      console.log('📦 [StoreService] Fetching products for store:', storeId);
      
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', storeId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [StoreService] Get store products error:', error);
        return { success: false, error: 'Failed to fetch store products' };
      }

      console.log(`✅ [StoreService] Found ${products?.length || 0} products for store`);
      if (products && products.length > 0) {
        console.log('First product sample:', {
          id: products[0].id,
          name: products[0].name,
          price: products[0].price,
          quantity: products[0].quantity,
          category: products[0].category
        });
      }
      return { success: true, data: products || [] };
    } catch (error) {
      console.error('❌ [StoreService] Get store products error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get store statistics
   * @param {string} storeId - Store/Seller ID
   * @returns {Promise<Object>} - Store statistics
   */
  async getStoreStats(storeId) {
    try {
      console.log('📊 [StoreService] Fetching stats for store:', storeId);
      
      // Get product count
      const { count: productCount, error: productError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', storeId)
        .eq('status', 'active');

      if (productError) {
        console.error('❌ [StoreService] Get product count error:', productError);
      }

      // Get store profile for additional stats
      const storeResult = await this.getStoreById(storeId);
      const store = storeResult.success ? storeResult.data : null;

      const stats = {
        totalProducts: productCount || 0,
        totalSales: store?.total_sales || 0,
        rating: store?.rating || 0,
        totalRatings: store?.total_ratings || 0,
        memberSince: store?.created_at || null,
        isVerified: store?.is_business_verified || false
      };

      console.log('✅ [StoreService] Store stats:', stats);
      return { success: true, data: stats };
    } catch (error) {
      console.error('❌ [StoreService] Get store stats error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all stores/sellers
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Stores result
   */
  async getAllStores(options = {}) {
    try {
      console.log('🏪 [StoreService] Fetching all stores...');
      
      const { data: stores, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_type', 'seller')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [StoreService] Get all stores error:', error);
        return { success: false, error: 'Failed to fetch stores' };
      }

      console.log(`✅ [StoreService] Found ${stores?.length || 0} stores`);
      return { success: true, data: stores || [] };
    } catch (error) {
      console.error('❌ [StoreService] Get all stores error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Search stores by name or business name
   * @param {string} query - Search query
   * @returns {Promise<Object>} - Search results
   */
  async searchStores(query) {
    try {
      console.log('🔍 [StoreService] Searching stores with query:', query);
      
      const { data: stores, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_type', 'seller')
        .eq('is_active', true)
        .or(`display_name.ilike.%${query}%,business_name.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [StoreService] Search stores error:', error);
        return { success: false, error: 'Failed to search stores' };
      }

      console.log(`✅ [StoreService] Found ${stores?.length || 0} stores matching "${query}"`);
      return { success: true, data: stores || [] };
    } catch (error) {
      console.error('❌ [StoreService] Search stores error:', error);
      return { success: false, error: error.message };
    }
  }
}

const storeService = new StoreService();
export default storeService;
