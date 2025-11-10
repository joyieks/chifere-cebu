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
      
      // Fetch from old products table
      const { data: oldProducts, error: oldError } = await supabase
        .from('products')
        .select(`
          *,
          user_profiles!products_seller_id_fkey (
            id,
            display_name,
            business_name,
            profile_image
          )
        `)
        .eq('seller_id', storeId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (oldError) {
        console.warn('⚠️ [StoreService] Error fetching from old products table:', oldError);
      }

      // Fetch from new seller preloved items table
      const { data: prelovedItems, error: prelovedError } = await supabase
        .from('seller_add_item_preloved')
        .select(`
          *,
          user_profiles!seller_add_item_preloved_seller_id_fkey (
            id,
            display_name,
            business_name,
            profile_image
          )
        `)
        .eq('seller_id', storeId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (prelovedError) {
        console.warn('⚠️ [StoreService] Error fetching from preloved items table:', prelovedError);
      }

      // Fetch from new seller barter items table
      const { data: barterItems, error: barterError } = await supabase
        .from('seller_add_barter_item')
        .select(`
          *,
          user_profiles!seller_add_barter_item_seller_id_fkey (
            id,
            display_name,
            business_name,
            profile_image
          )
        `)
        .eq('seller_id', storeId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (barterError) {
        console.warn('⚠️ [StoreService] Error fetching from barter items table:', barterError);
      }

      // Add metadata to products to indicate their source table
      const oldProductsWithMeta = (oldProducts || []).map(p => ({ ...p, collection: 'products' }));
      const prelovedItemsWithMeta = (prelovedItems || []).map(p => ({ ...p, collection: 'seller_add_item_preloved' }));
      const barterItemsWithMeta = (barterItems || []).map(p => ({ ...p, collection: 'seller_addBarterItem' }));

      // Combine all products
      const allProducts = [
        ...oldProductsWithMeta,
        ...prelovedItemsWithMeta,
        ...barterItemsWithMeta
      ];

      // Remove duplicates based on ID (keep the newest version)
      const uniqueProducts = [];
      const seenIds = new Set();
      
      for (const product of allProducts) {
        if (!seenIds.has(product.id)) {
          seenIds.add(product.id);
          uniqueProducts.push(product);
        } else {
          console.log(`🔄 [StoreService] Removing duplicate product: ${product.name} (ID: ${product.id})`);
        }
      }

      // Sort by creation date (newest first)
      uniqueProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      console.log(`✅ [StoreService] Found ${allProducts.length} total products (${uniqueProducts.length} unique) for store:`);
      console.log(`   - Old products: ${oldProducts?.length || 0}`);
      console.log(`   - Preloved items: ${prelovedItems?.length || 0}`);
      console.log(`   - Barter items: ${barterItems?.length || 0}`);
      console.log(`   - Duplicates removed: ${allProducts.length - uniqueProducts.length}`);

      if (uniqueProducts.length > 0) {
        console.log('First product sample:', {
          id: uniqueProducts[0].id,
          name: uniqueProducts[0].name,
          price: uniqueProducts[0].price,
          quantity: uniqueProducts[0].quantity,
          category: uniqueProducts[0].category,
          collection: uniqueProducts[0].collection || uniqueProducts[0].table_name || 'products'
        });
      }

      return { success: true, data: uniqueProducts };
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
      
      // Get product count from all tables
      const [oldProductsCount, prelovedCount, barterCount] = await Promise.all([
        supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', storeId)
          .eq('status', 'active'),
        supabase
          .from('seller_add_item_preloved')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', storeId)
          .eq('status', 'active'),
        supabase
          .from('seller_add_barter_item')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', storeId)
          .eq('status', 'active')
      ]);

      const productCount = (oldProductsCount.count || 0) + 
                          (prelovedCount.count || 0) + 
                          (barterCount.count || 0);

      if (oldProductsCount.error) {
        console.warn('⚠️ [StoreService] Get old products count error:', oldProductsCount.error);
      }
      if (prelovedCount.error) {
        console.warn('⚠️ [StoreService] Get preloved count error:', prelovedCount.error);
      }
      if (barterCount.error) {
        console.warn('⚠️ [StoreService] Get barter count error:', barterCount.error);
      }

      // Get seller stats (followers, reviews, ratings)
      const { data: sellerStats, error: sellerStatsError } = await supabase
        .from('seller_stats')
        .select('*')
        .eq('seller_id', storeId)
        .single();

      if (sellerStatsError && sellerStatsError.code !== 'PGRST116') {
        console.error('❌ [StoreService] Get seller stats error:', sellerStatsError);
      }

      // Get store profile for additional stats
      const storeResult = await this.getStoreById(storeId);
      const store = storeResult.success ? storeResult.data : null;

      const stats = {
        totalProducts: productCount || 0,
        totalSales: store?.total_sales || 0,
        rating: sellerStats?.average_rating || store?.rating || 0,
        totalRatings: sellerStats?.total_reviews || store?.total_ratings || 0,
        totalFollowers: sellerStats?.total_followers || 0,
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
