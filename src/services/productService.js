/**
 * Product Service
 * 
 * Handles product-related operations including fetching products,
 * product details, and product management.
 * 
 * Features:
 * - Get all active products
 * - Get product by ID
 * - Get products by seller
 * - Get products by category
 * - Search products
 * 
 * @version 1.0.0
 */

import { supabase } from '../config/supabase';

class ProductService {
  /**
   * Get all active products
   * @returns {Promise<Object>} - Products result
   */
  async getAllActiveProducts() {
    try {
      console.log('🔍 Fetching all active products from multiple tables...');
      
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
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (oldError) {
        console.warn('⚠️ Error fetching from old products table:', oldError);
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
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (prelovedError) {
        console.warn('⚠️ Error fetching from preloved items table:', prelovedError);
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
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (barterError) {
        console.warn('⚠️ Error fetching from barter items table:', barterError);
      }

      // Combine all products
      const allProducts = [
        ...(oldProducts || []),
        ...(prelovedItems || []),
        ...(barterItems || [])
      ];

      // Remove duplicates based on ID (keep the newest version)
      const uniqueProducts = [];
      const seenIds = new Set();
      
      for (const product of allProducts) {
        if (!seenIds.has(product.id)) {
          seenIds.add(product.id);
          uniqueProducts.push(product);
        } else {
          console.log(`🔄 Removing duplicate product: ${product.name} (ID: ${product.id})`);
        }
      }

      // Sort by creation date (newest first)
      uniqueProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      console.log(`✅ Found ${allProducts.length} total products (${uniqueProducts.length} unique):`);
      console.log(`   - Old products: ${oldProducts?.length || 0}`);
      console.log(`   - Preloved items: ${prelovedItems?.length || 0}`);
      console.log(`   - Barter items: ${barterItems?.length || 0}`);
      console.log(`   - Duplicates removed: ${allProducts.length - uniqueProducts.length}`);

      if (uniqueProducts.length > 0) {
        console.log('First product:', uniqueProducts[0]);
      }

      return { success: true, data: uniqueProducts };
    } catch (error) {
      console.error('❌ Get all active products exception:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get product by ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} - Product result
   */
  async getProductById(productId) {
    try {
      console.log('📦 [ProductService] Fetching product with ID:', productId);
      console.log('📦 [ProductService] ID type:', typeof productId);
      
      // Try to find product in old products table first
      const { data: oldProduct, error: oldError } = await supabase
        .from('products')
        .select(`
          *,
          user_profiles!products_seller_id_fkey (
            id,
            display_name,
            business_name,
            profile_image,
            phone,
            address
          )
        `)
        .eq('id', productId)
        .single();

      if (!oldError && oldProduct) {
        console.log('✅ [ProductService] Product found in old products table:', oldProduct);
        return { success: true, data: oldProduct };
      }

      // Try to find in preloved items table
      const { data: prelovedProduct, error: prelovedError } = await supabase
        .from('seller_add_item_preloved')
        .select(`
          *,
          user_profiles!seller_add_item_preloved_seller_id_fkey (
            id,
            display_name,
            business_name,
            profile_image,
            phone,
            address
          )
        `)
        .eq('id', productId)
        .single();

      if (!prelovedError && prelovedProduct) {
        console.log('✅ [ProductService] Product found in preloved items table:', prelovedProduct);
        return { success: true, data: prelovedProduct };
      }

      // Try to find in barter items table
      const { data: barterProduct, error: barterError } = await supabase
        .from('seller_add_barter_item')
        .select(`
          *,
          user_profiles!seller_add_barter_item_seller_id_fkey (
            id,
            display_name,
            business_name,
            profile_image,
            phone,
            address
          )
        `)
        .eq('id', productId)
        .single();

      if (!barterError && barterProduct) {
        console.log('✅ [ProductService] Product found in barter items table:', barterProduct);
        return { success: true, data: barterProduct };
      }

      // Product not found in any table
      console.error('❌ [ProductService] Product not found in any table');
      console.error('❌ [ProductService] Searched for ID:', productId);
      console.error('❌ [ProductService] Old products error:', oldError?.message);
      console.error('❌ [ProductService] Preloved items error:', prelovedError?.message);
      console.error('❌ [ProductService] Barter items error:', barterError?.message);
      return { success: false, error: 'Product not found' };
    } catch (error) {
      console.error('❌ [ProductService] Get product by ID error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get products by seller
   * @param {string} sellerId - Seller ID
   * @returns {Promise<Object>} - Products result
   */
  async getProductsBySeller(sellerId) {
    try {
      const { data: products, error } = await supabase
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
        .eq('seller_id', sellerId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get products by seller error:', error);
        return { success: false, error: 'Failed to fetch seller products' };
      }

      return { success: true, data: products || [] };
    } catch (error) {
      console.error('Get products by seller error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get products by category
   * @param {string} category - Product category
   * @returns {Promise<Object>} - Products result
   */
  async getProductsByCategory(category) {
    try {
      const { data: products, error } = await supabase
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
        .eq('category', category)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get products by category error:', error);
        return { success: false, error: 'Failed to fetch products by category' };
      }

      return { success: true, data: products || [] };
    } catch (error) {
      console.error('Get products by category error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Search products
   * @param {string} query - Search query
   * @returns {Promise<Object>} - Search results
   */
  async searchProducts(query) {
    try {
      const { data: products, error } = await supabase
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
        .or(`name.ilike.%${query}%, description.ilike.%${query}%, brand.ilike.%${query}%`)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Search products error:', error);
        return { success: false, error: 'Search failed' };
      }

      return { success: true, data: products || [] };
    } catch (error) {
      console.error('Search products error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get featured products
   * @returns {Promise<Object>} - Featured products result
   */
  async getFeaturedProducts() {
    try {
      const { data: products, error } = await supabase
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
        .eq('is_featured', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Get featured products error:', error);
        return { success: false, error: 'Failed to fetch featured products' };
      }

      return { success: true, data: products || [] };
    } catch (error) {
      console.error('Get featured products error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get recent products
   * @param {number} limit - Number of products to fetch
   * @returns {Promise<Object>} - Recent products result
   */
  async getRecentProducts(limit = 20) {
    try {
      const { data: products, error } = await supabase
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
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Get recent products error:', error);
        return { success: false, error: 'Failed to fetch recent products' };
      }

      return { success: true, data: products || [] };
    } catch (error) {
      console.error('Get recent products error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get product categories
   * @returns {Promise<Object>} - Categories result
   */
  async getProductCategories() {
    try {
      const { data: categories, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Get product categories error:', error);
        return { success: false, error: 'Failed to fetch categories' };
      }

      return { success: true, data: categories || [] };
    } catch (error) {
      console.error('Get product categories error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get product conditions
   * @returns {Promise<Object>} - Conditions result
   */
  async getProductConditions() {
    try {
      const { data: conditions, error } = await supabase
        .from('product_conditions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Get product conditions error:', error);
        return { success: false, error: 'Failed to fetch conditions' };
      }

      return { success: true, data: conditions || [] };
    } catch (error) {
      console.error('Get product conditions error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Increment product views
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} - Result
   */
  async incrementProductViews(productId) {
    try {
      const { error } = await supabase
        .from('products')
        .update({ views: supabase.raw('views + 1') })
        .eq('id', productId);

      if (error) {
        console.error('Increment product views error:', error);
        return { success: false, error: 'Failed to update views' };
      }

      return { success: true };
    } catch (error) {
      console.error('Increment product views error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Toggle product like
   * @param {string} productId - Product ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Result
   */
  async toggleProductLike(productId, userId) {
    try {
      // Check if already liked
      const { data: existingLike, error: checkError } = await supabase
        .from('product_likes')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Check product like error:', checkError);
        return { success: false, error: 'Failed to check like status' };
      }

      if (existingLike) {
        // Unlike
        const { error: deleteError } = await supabase
          .from('product_likes')
          .delete()
          .eq('id', existingLike.id);

        if (deleteError) {
          console.error('Unlike product error:', deleteError);
          return { success: false, error: 'Failed to unlike product' };
        }

        // Decrement likes count
        await supabase
          .from('products')
          .update({ likes: supabase.raw('likes - 1') })
          .eq('id', productId);

        return { success: true, liked: false };
      } else {
        // Like
        const { error: insertError } = await supabase
          .from('product_likes')
          .insert({ product_id: productId, user_id: userId });

        if (insertError) {
          console.error('Like product error:', insertError);
          return { success: false, error: 'Failed to like product' };
        }

        // Increment likes count
        await supabase
          .from('products')
          .update({ likes: supabase.raw('likes + 1') })
          .eq('id', productId);

        return { success: true, liked: true };
      }
    } catch (error) {
      console.error('Toggle product like error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new ProductService();