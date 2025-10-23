/**
 * Data Service - Centralized data management for ChiFere App
 * 
 * This service provides a unified interface for accessing dummy data
 * and will be easily replaceable with Firebase/API calls in the future.
 * 
 * Features:
 * - Store management
 * - Product catalog
 * - Reviews and ratings
 * - Categories
 * - Search functionality
 * - Filtering and sorting
 * 
 * TODO: Firebase Implementation - Replace with actual API calls
 */

// Import dummy data
import storesData from '../data/stores.json';
import productsData from '../data/products.json';
import reviewsData from '../data/reviews.json';
import categoriesData from '../data/categories.json';

class DataService {
  constructor() {
    this.stores = storesData.stores;
    this.products = productsData.products;
    this.reviews = reviewsData.reviews;
    this.storeReviews = reviewsData.storeReviews;
    this.categories = categoriesData.categories;
  }

  /**
   * Simulate network delay for realistic API behavior
   * @param {number} ms - Delay in milliseconds
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ===== STORE METHODS =====

  /**
   * Get all stores with optional filtering
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of stores
   */
  async getAllStores(filters = {}) {
    try {
      let filteredStores = [...this.stores];

      // Filter by category
      if (filters.category) {
        filteredStores = filteredStores.filter(store => 
          store.categories.some(cat => cat.toLowerCase().includes(filters.category.toLowerCase()))
        );
      }

      // Filter by location
      if (filters.location) {
        filteredStores = filteredStores.filter(store => 
          store.location.city.toLowerCase().includes(filters.location.toLowerCase()) ||
          store.location.province.toLowerCase().includes(filters.location.toLowerCase())
        );
      }

      // Filter by rating
      if (filters.minRating) {
        filteredStores = filteredStores.filter(store => store.rating >= filters.minRating);
      }

      // Filter by verified status
      if (filters.verified !== undefined) {
        filteredStores = filteredStores.filter(store => store.verified === filters.verified);
      }

      // Sort stores
      if (filters.sortBy) {
        filteredStores.sort((a, b) => {
          switch (filters.sortBy) {
            case 'rating':
              return b.rating - a.rating;
            case 'followers':
              return b.followersCount - a.followersCount;
            case 'products':
              return b.productsCount - a.productsCount;
            case 'newest':
              return new Date(b.joinedDate) - new Date(a.joinedDate);
            case 'name':
              return a.name.localeCompare(b.name);
            default:
              return 0;
          }
        });
      }

      // Simulate API delay
      await this.simulateDelay();

      return filteredStores;
    } catch (error) {
      console.error('Error fetching stores:', error);
      throw new Error('Failed to fetch stores');
    }
  }

  /**
   * Get store by ID or slug
   * @param {string} identifier - Store ID or slug
   * @returns {Promise<Object|null>} Store object or null
   */
  async getStoreById(identifier) {
    try {
      await this.simulateDelay();
      
      const store = this.stores.find(store => 
        store.id === identifier || 
        store.storeId === identifier || 
        store.slug === identifier
      );

      if (!store) {
        throw new Error('Store not found');
      }

      // Get store reviews
      const storeReviews = this.storeReviews.filter(review => review.storeId === store.id);
      
      return {
        ...store,
        storeReviews
      };
    } catch (error) {
      console.error('Error fetching store:', error);
      throw error;
    }
  }

  /**
   * Get featured stores
   * @param {number} limit - Number of stores to return
   * @returns {Promise<Array>} Array of featured stores
   */
  async getFeaturedStores(limit = 5) {
    try {
      await this.simulateDelay();
      
      return this.stores
        .filter(store => store.featured)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching featured stores:', error);
      throw new Error('Failed to fetch featured stores');
    }
  }

  // ===== PRODUCT METHODS =====

  /**
   * Get all products with filtering and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Products with pagination info
   */
  async getAllProducts(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        storeId,
        search,
        minPrice,
        maxPrice,
        inStock,
        sortBy = 'featured',
        featured
      } = options;

      let filteredProducts = [...this.products];

      // Filter by category
      if (category) {
        filteredProducts = filteredProducts.filter(product => 
          product.category.id === category || 
          product.category.name.toLowerCase().includes(category.toLowerCase())
        );
      }

      // Filter by store
      if (storeId) {
        filteredProducts = filteredProducts.filter(product => product.storeId === storeId);
      }

      // Search filter
      if (search) {
        const searchTerm = search.toLowerCase();
        filteredProducts = filteredProducts.filter(product =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm) ||
          product.brand.name.toLowerCase().includes(searchTerm) ||
          product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      // Price range filter
      if (minPrice !== undefined) {
        filteredProducts = filteredProducts.filter(product => product.price.current >= minPrice);
      }
      if (maxPrice !== undefined) {
        filteredProducts = filteredProducts.filter(product => product.price.current <= maxPrice);
      }

      // Stock filter
      if (inStock !== undefined) {
        filteredProducts = filteredProducts.filter(product => product.stock.inStock === inStock);
      }

      // Featured filter
      if (featured !== undefined) {
        filteredProducts = filteredProducts.filter(product => product.featured === featured);
      }

      // Sort products
      filteredProducts.sort((a, b) => {
        switch (sortBy) {
          case 'price-low':
            return a.price.current - b.price.current;
          case 'price-high':
            return b.price.current - a.price.current;
          case 'rating':
            return b.rating.average - a.rating.average;
          case 'newest':
            return new Date(b.createdAt) - new Date(a.createdAt);
          case 'sold':
            return b.sales.totalSold - a.sales.totalSold;
          case 'name':
            return a.name.localeCompare(b.name);
          case 'featured':
          default:
            // Featured items first, then by rating
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return b.rating.average - a.rating.average;
        }
      });

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

      await this.simulateDelay();

      // Add store information to products
      const productsWithStore = paginatedProducts.map(product => ({
        ...product,
        store: this.stores.find(store => store.id === product.storeId)
      }));

      return {
        products: productsWithStore,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(filteredProducts.length / limit),
          totalItems: filteredProducts.length,
          itemsPerPage: limit,
          hasNext: endIndex < filteredProducts.length,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }
  }

  /**
   * Get product by ID or slug
   * @param {string} identifier - Product ID or slug
   * @returns {Promise<Object|null>} Product object or null
   */
  async getProductById(identifier) {
    try {
      await this.simulateDelay();
      
      const product = this.products.find(product => 
        product.id === identifier || 
        product.sku === identifier || 
        product.slug === identifier
      );

      if (!product) {
        throw new Error('Product not found');
      }

      // Get product reviews
      const productReviews = this.reviews.filter(review => review.productId === product.id);
      
      // Get store info
      const store = await this.getStoreById(product.storeId);

      return {
        ...product,
        reviews: productReviews,
        store
      };
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }

  /**
   * Get products by store ID
   * @param {string} storeId - Store ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Store products with pagination
   */
  async getProductsByStore(storeId, options = {}) {
    try {
      return await this.getAllProducts({ ...options, storeId });
    } catch (error) {
      console.error('Error fetching store products:', error);
      throw new Error('Failed to fetch store products');
    }
  }

  /**
   * Get featured products
   * @param {number} limit - Number of products to return
   * @returns {Promise<Array>} Array of featured products
   */
  async getFeaturedProducts(limit = 10) {
    try {
      await this.simulateDelay();
      
      const featuredProducts = this.products
        .filter(product => product.featured)
        .sort((a, b) => b.rating.average - a.rating.average)
        .slice(0, limit);

      // Add store information to products
      return featuredProducts.map(product => ({
        ...product,
        store: this.stores.find(store => store.id === product.storeId)
      }));
    } catch (error) {
      console.error('Error fetching featured products:', error);
      throw new Error('Failed to fetch featured products');
    }
  }

  // ===== CATEGORY METHODS =====

  /**
   * Get all categories
   * @returns {Promise<Array>} Array of categories
   */
  async getAllCategories() {
    try {
      await this.simulateDelay();
      return this.categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  /**
   * Get category by ID or slug
   * @param {string} identifier - Category ID or slug
   * @returns {Promise<Object|null>} Category object or null
   */
  async getCategoryById(identifier) {
    try {
      await this.simulateDelay();
      
      // Search in main categories
      let category = this.categories.find(cat => 
        cat.id === identifier || cat.slug === identifier
      );

      // Search in subcategories
      if (!category) {
        for (const mainCat of this.categories) {
          if (mainCat.subcategories) {
            category = mainCat.subcategories.find(subCat => 
              subCat.id === identifier || subCat.slug === identifier
            );
            if (category) {
              category.parent = mainCat;
              break;
            }
          }
        }
      }

      if (!category) {
        throw new Error('Category not found');
      }

      return category;
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  }

  // ===== REVIEW METHODS =====

  /**
   * Get reviews for a product
   * @param {string} productId - Product ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Reviews with pagination
   */
  async getProductReviews(productId, options = {}) {
    try {
      const { page = 1, limit = 10, sortBy = 'newest' } = options;

      let productReviews = this.reviews.filter(review => review.productId === productId);

      // Sort reviews
      productReviews.sort((a, b) => {
        switch (sortBy) {
          case 'oldest':
            return new Date(a.createdAt) - new Date(b.createdAt);
          case 'rating-high':
            return b.rating - a.rating;
          case 'rating-low':
            return a.rating - b.rating;
          case 'helpful':
            return b.helpful - a.helpful;
          case 'newest':
          default:
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
      });

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedReviews = productReviews.slice(startIndex, endIndex);

      await this.simulateDelay();

      return {
        reviews: paginatedReviews,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(productReviews.length / limit),
          totalItems: productReviews.length,
          itemsPerPage: limit,
          hasNext: endIndex < productReviews.length,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      throw new Error('Failed to fetch product reviews');
    }
  }

  /**
   * Get reviews for a store
   * @param {string} storeId - Store ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Store reviews with pagination
   */
  async getStoreReviews(storeId, options = {}) {
    try {
      const { page = 1, limit = 10, sortBy = 'newest' } = options;

      let storeReviews = this.storeReviews.filter(review => review.storeId === storeId);

      // Sort reviews
      storeReviews.sort((a, b) => {
        switch (sortBy) {
          case 'oldest':
            return new Date(a.createdAt) - new Date(b.createdAt);
          case 'rating-high':
            return b.rating - a.rating;
          case 'rating-low':
            return a.rating - b.rating;
          case 'helpful':
            return b.helpful - a.helpful;
          case 'newest':
          default:
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
      });

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedReviews = storeReviews.slice(startIndex, endIndex);

      await this.simulateDelay();

      return {
        reviews: paginatedReviews,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(storeReviews.length / limit),
          totalItems: storeReviews.length,
          itemsPerPage: limit,
          hasNext: endIndex < storeReviews.length,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error fetching store reviews:', error);
      throw new Error('Failed to fetch store reviews');
    }
  }

  // ===== SEARCH METHODS =====

  /**
   * Get search suggestions for autocomplete
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Grouped suggestions
   */
  async getSuggestions(query, options = {}) {
    try {
      // Simulate network delay for realistic autocomplete behavior
      await this.delay(150);

      const { limit = 10 } = options;
      const searchTerm = query.toLowerCase().trim();

      if (!searchTerm || searchTerm.length < 2) {
        return [];
      }

      const suggestions = [];

      // Get store suggestions
      const stores = this.stores
        .filter(store =>
          store.name.toLowerCase().includes(searchTerm) ||
          store.description.toLowerCase().includes(searchTerm)
        )
        .slice(0, 3)
        .map(store => ({
          id: store.id,
          type: 'store',
          title: store.name,
          subtitle: `${store.productsCount} products • ${store.location.city}`,
          icon: '🏪',
          data: store
        }));

      if (stores.length > 0) {
        suggestions.push({
          title: 'Stores',
          suggestions: stores
        });
      }

      // Get product suggestions
      const products = this.products
        .filter(product => 
          product.name.toLowerCase().includes(searchTerm) ||
          product.brand.name.toLowerCase().includes(searchTerm)
        )
        .slice(0, 4)
        .map(product => {
          const store = this.stores.find(store => store.id === product.storeId);
          return {
            id: product.id,
            type: 'product',
            title: product.name,
            subtitle: `₱${product.price.current.toLocaleString()} • ${store?.name || 'Store'}`,
            icon: '📦',
            data: { ...product, store }
          };
        });

      if (products.length > 0) {
        suggestions.push({
          title: 'Products',
          suggestions: products
        });
      }

      // Get category suggestions
      const allCategories = [];
      this.categories.forEach(cat => {
        allCategories.push(cat);
        if (cat.subcategories) {
          allCategories.push(...cat.subcategories);
        }
      });

      const categories = allCategories
        .filter(category =>
          category.name.toLowerCase().includes(searchTerm)
        )
        .slice(0, 3)
        .map(category => ({
          id: category.id,
          type: 'category',
          title: category.name,
          subtitle: category.description || 'Browse category',
          icon: category.icon || '📋',
          data: category
        }));

      if (categories.length > 0) {
        suggestions.push({
          title: 'Categories',
          suggestions: categories
        });
      }

      return suggestions;

    } catch (error) {
      console.error('Error fetching suggestions:', error);
      return [];
    }
  }

  /**
   * Search across products and stores
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async search(query, options = {}) {
    try {
      const { type = 'all', limit = 20 } = options;
      const searchTerm = query.toLowerCase();

      let results = {
        products: [],
        stores: [],
        categories: []
      };

      // Search products
      if (type === 'all' || type === 'products') {
        results.products = this.products.filter(product =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm) ||
          product.brand.name.toLowerCase().includes(searchTerm) ||
          product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        ).slice(0, limit).map(product => ({
          ...product,
          store: this.stores.find(store => store.id === product.storeId)
        }));
      }

      // Search stores
      if (type === 'all' || type === 'stores') {
        results.stores = this.stores.filter(store =>
          store.name.toLowerCase().includes(searchTerm) ||
          store.description.toLowerCase().includes(searchTerm) ||
          store.categories.some(cat => cat.toLowerCase().includes(searchTerm)) ||
          store.location.city.toLowerCase().includes(searchTerm)
        ).slice(0, limit);
      }

      // Search categories
      if (type === 'all' || type === 'categories') {
        const allCategories = [];
        this.categories.forEach(cat => {
          allCategories.push(cat);
          if (cat.subcategories) {
            allCategories.push(...cat.subcategories);
          }
        });

        results.categories = allCategories.filter(category =>
          category.name.toLowerCase().includes(searchTerm) ||
          category.description.toLowerCase().includes(searchTerm)
        ).slice(0, limit);
      }

      await this.simulateDelay();

      return results;
    } catch (error) {
      console.error('Error performing search:', error);
      throw new Error('Search failed');
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Simulate API delay for realistic loading states
   * @param {number} ms - Delay in milliseconds
   */
  async simulateDelay(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get popular search terms
   * @returns {Promise<Array>} Array of popular search terms
   */
  async getPopularSearchTerms() {
    try {
      await this.simulateDelay(200);
      
      // Extract popular terms from product names and categories
      const terms = [
        'iPhone', 'Samsung', 'Canon', 'Sony', 'MacBook',
        'Gaming', 'Headphones', 'Camera', 'Laptop', 'Tablet',
        'Smartphone', 'Electronics', 'Fashion', 'Korean Fashion'
      ];

      return terms;
    } catch (error) {
      console.error('Error fetching popular search terms:', error);
      throw new Error('Failed to fetch popular search terms');
    }
  }

  /**
   * Get statistics for dashboard
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics() {
    try {
      await this.simulateDelay();

      return {
        totalStores: this.stores.length,
        verifiedStores: this.stores.filter(s => s.verified).length,
        totalProducts: this.products.length,
        inStockProducts: this.products.filter(p => p.stock.inStock).length,
        totalReviews: this.reviews.length + this.storeReviews.length,
        averageRating: this.products.reduce((sum, p) => sum + p.rating.average, 0) / this.products.length,
        totalCategories: this.categories.length
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw new Error('Failed to fetch statistics');
    }
  }
}

// Create and export singleton instance
const dataService = new DataService();
export default dataService;
