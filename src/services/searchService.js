/**
 * Search Service
 * 
 * Handles comprehensive search functionality across products, stores, and categories
 * using real Supabase database integration.
 * 
 * Features:
 * - Search products by name, description, brand, category
 * - Search stores by name, business name, description
 * - Search categories
 * - Get search suggestions/autocomplete
 * - Advanced filtering options
 * 
 * @version 1.0.0
 */

import { supabase } from '../config/supabase';
import productService from './productService';
import storeService from './storeService';

class SearchService {
  /**
   * Perform comprehensive search across all content types
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} - Search results
   */
  async search(query, options = {}) {
    try {
      console.log('🔍 [SearchService] Performing search for:', query);
      
      const { type = 'all', limit = 20 } = options;
      const searchTerm = query.trim();
      
      if (!searchTerm) {
        return {
          success: true,
          data: {
            products: [],
            stores: [],
            categories: [],
            total: 0
          }
        };
      }

      let results = {
        products: [],
        stores: [],
        categories: [],
        total: 0
      };

      // Search products
      if (type === 'all' || type === 'products') {
        const productsResult = await this.searchProducts(searchTerm, limit);
        if (productsResult.success) {
          results.products = productsResult.data;
        }
      }

      // Search stores
      if (type === 'all' || type === 'stores') {
        const storesResult = await this.searchStores(searchTerm, limit);
        if (storesResult.success) {
          results.stores = storesResult.data;
        }
      }

      // Search categories
      if (type === 'all' || type === 'categories') {
        const categoriesResult = await this.searchCategories(searchTerm, limit);
        if (categoriesResult.success) {
          results.categories = categoriesResult.data;
        }
      }

      results.total = results.products.length + results.stores.length + results.categories.length;

      console.log(`✅ [SearchService] Search completed: ${results.total} results found`);
      return { success: true, data: results };
    } catch (error) {
      console.error('❌ [SearchService] Search error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Search products by name, description, brand, category
   * @param {string} query - Search query
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Object>} - Products search results
   */
  async searchProducts(query, limit = 20) {
    try {
      console.log('📦 [SearchService] Searching products for:', query);
      
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
        .or(`name.ilike.%${query}%, description.ilike.%${query}%, brand.ilike.%${query}%, category.ilike.%${query}%`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ [SearchService] Search products error:', error);
        return { success: false, error: 'Failed to search products' };
      }

      console.log(`✅ [SearchService] Found ${products?.length || 0} products`);
      return { success: true, data: products || [] };
    } catch (error) {
      console.error('❌ [SearchService] Search products error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Search stores by name, business name, description
   * @param {string} query - Search query
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Object>} - Stores search results
   */
  async searchStores(query, limit = 20) {
    try {
      console.log('🏪 [SearchService] Searching stores for:', query);
      
      const { data: stores, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_type', 'seller')
        .eq('is_active', true)
        .or(`display_name.ilike.%${query}%, business_name.ilike.%${query}%, business_description.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ [SearchService] Search stores error:', error);
        return { success: false, error: 'Failed to search stores' };
      }

      console.log(`✅ [SearchService] Found ${stores?.length || 0} stores`);
      if (stores && stores.length > 0) {
        console.log('First store sample:', {
          id: stores[0].id,
          business_name: stores[0].business_name,
          display_name: stores[0].display_name,
          business_description: stores[0].business_description,
          profile_image: stores[0].profile_image,
          is_business_verified: stores[0].is_business_verified
        });
      }
      return { success: true, data: stores || [] };
    } catch (error) {
      console.error('❌ [SearchService] Search stores error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Search categories
   * @param {string} query - Search query
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Object>} - Categories search results
   */
  async searchCategories(query, limit = 20) {
    try {
      console.log('📂 [SearchService] Searching categories for:', query);
      
      // Get unique categories from products
      const { data: products, error } = await supabase
        .from('products')
        .select('category')
        .eq('status', 'active')
        .ilike('category', `%${query}%`)
        .limit(limit);

      if (error) {
        console.error('❌ [SearchService] Search categories error:', error);
        return { success: false, error: 'Failed to search categories' };
      }

      // Get unique categories
      const uniqueCategories = [...new Set(products?.map(p => p.category) || [])]
        .filter(category => category && category.toLowerCase().includes(query.toLowerCase()))
        .map(category => ({
          id: category.toLowerCase().replace(/\s+/g, '-'),
          name: category,
          type: 'category'
        }));

      console.log(`✅ [SearchService] Found ${uniqueCategories.length} categories`);
      return { success: true, data: uniqueCategories };
    } catch (error) {
      console.error('❌ [SearchService] Search categories error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get search suggestions for autocomplete
   * @param {string} query - Search query
   * @param {number} limit - Maximum number of suggestions per type
   * @returns {Promise<Object>} - Search suggestions
   */
  async getSuggestions(query, limit = 5) {
    try {
      console.log('💡 [SearchService] Getting suggestions for:', query);
      
      if (!query || query.length < 2) {
        return { success: true, data: [] };
      }

      const suggestions = [];

      // Get product suggestions
      const productsResult = await this.searchProducts(query, limit);
      if (productsResult.success && productsResult.data.length > 0) {
        suggestions.push({
          title: 'Products',
          suggestions: productsResult.data.map(product => ({
            id: product.id,
            title: product.name,
            subtitle: product.brand || product.category,
            type: 'product',
            image: product.primary_image || product.images?.[0],
            price: product.price
          }))
        });
      }

      // Get store suggestions
      const storesResult = await this.searchStores(query, limit);
      if (storesResult.success && storesResult.data.length > 0) {
        suggestions.push({
          title: 'Stores',
          suggestions: storesResult.data.map(store => ({
            id: store.id,
            title: store.business_name || store.display_name,
            subtitle: store.business_description || 'Store',
            type: 'store',
            image: store.profile_image
          }))
        });
      }

      // Get category suggestions
      const categoriesResult = await this.searchCategories(query, limit);
      if (categoriesResult.success && categoriesResult.data.length > 0) {
        suggestions.push({
          title: 'Categories',
          suggestions: categoriesResult.data.map(category => ({
            id: category.id,
            title: category.name,
            subtitle: 'Category',
            type: 'category'
          }))
        });
      }

      console.log(`✅ [SearchService] Generated ${suggestions.length} suggestion groups`);
      return { success: true, data: suggestions };
    } catch (error) {
      console.error('❌ [SearchService] Get suggestions error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get popular search terms
   * @returns {Promise<Object>} - Popular search terms
   */
  async getPopularSearches() {
    try {
      console.log('🔥 [SearchService] Getting popular searches');
      
      // Get popular categories from products
      const { data: products, error } = await supabase
        .from('products')
        .select('category')
        .eq('status', 'active')
        .limit(100);

      if (error) {
        console.error('❌ [SearchService] Get popular searches error:', error);
        return { success: false, error: 'Failed to get popular searches' };
      }

      // Count category occurrences
      const categoryCounts = {};
      products?.forEach(product => {
        if (product.category) {
          categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
        }
      });

      // Get top categories
      const popularSearches = Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([category, count]) => ({
          term: category,
          count,
          type: 'category'
        }));

      console.log(`✅ [SearchService] Found ${popularSearches.length} popular searches`);
      return { success: true, data: popularSearches };
    } catch (error) {
      console.error('❌ [SearchService] Get popular searches error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get search filters (categories, price ranges, etc.)
   * @returns {Promise<Object>} - Available search filters
   */
  async getSearchFilters() {
    try {
      console.log('🔧 [SearchService] Getting search filters');
      
      // Get all unique categories
      const { data: products, error } = await supabase
        .from('products')
        .select('category, price')
        .eq('status', 'active');

      if (error) {
        console.error('❌ [SearchService] Get search filters error:', error);
        return { success: false, error: 'Failed to get search filters' };
      }

      // Get unique categories
      const categories = [...new Set(products?.map(p => p.category).filter(Boolean) || [])]
        .sort()
        .map(category => ({
          id: category.toLowerCase().replace(/\s+/g, '-'),
          name: category,
          count: products.filter(p => p.category === category).length
        }));

      // Get price ranges
      const prices = products?.map(p => p.price).filter(price => price > 0) || [];
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      const filters = {
        categories,
        priceRange: {
          min: minPrice,
          max: maxPrice
        }
      };

      console.log(`✅ [SearchService] Generated filters: ${categories.length} categories`);
      return { success: true, data: filters };
    } catch (error) {
      console.error('❌ [SearchService] Get search filters error:', error);
      return { success: false, error: error.message };
    }
  }
}

const searchService = new SearchService();
export default searchService;
