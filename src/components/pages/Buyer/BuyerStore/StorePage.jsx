/**
 * Store Page Component - Inspired by EverShop E-commerce Platform
 * 
 * This component creates a comprehensive store interface for buyers to view seller stores.
 * Design inspired by EverShop's modern TypeScript e-commerce platform.
 * 
 * Key Features:
 * - Modern store header with cover image and branding
 * - Store statistics and verification badges
 * - Product grid with advanced filtering
 * - Store navigation and categories
 * - Interactive store actions (follow, message, share)
 * - Responsive design following ChiFere design system
 * 
 * Design System Usage:
 * - Colors: Uses theme.colors tokens for consistent branding
 * - Typography: Applies theme.typography for font consistency
 * - Spacing: Uses theme.spacing for margins and padding
 * - Shadows: Applies theme.shadows for depth
 * - Animations: Uses theme.animations for smooth interactions
 * 
 * @version 1.0.0 - Initial implementation inspired by EverShop
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BuyerLayout from '../Buyer_Menu/Buyer_Layout/Buyer_layout';
import theme from '../../../../styles/designSystem';
import storeService from '../../../../services/storeService';
import productService from '../../../../services/productService';
import followService from '../../../../services/followService';
import { useAuth } from '../../../../contexts/AuthContext';

const StorePage = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State management
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [storeStats, setStoreStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState('grid');

  // Load store and products data
  useEffect(() => {
    const loadStoreData = async () => {
      try {
        setLoading(true);
        setError(null);

        // If no storeId provided, show error
        if (!storeId) {
          setError('No store ID provided');
          setLoading(false);
          return;
        }

        // Load store data
        const storeResult = await storeService.getStoreById(storeId);
        if (!storeResult.success) {
          throw new Error(storeResult.error || 'Store not found');
        }
        setStore(storeResult.data || null);

        // Load store statistics
        const statsResult = await storeService.getStoreStats(storeId);
        if (statsResult.success) {
          setStoreStats(statsResult.data);
        }

        // Load products for this store
        const productsResult = await storeService.getStoreProducts(storeId);
        if (productsResult.success) {
          setProducts(productsResult.data || []);
        } else {
          console.warn('Failed to load store products:', productsResult.error);
          setProducts([]);
        }

      } catch (err) {
        console.error('Error loading store data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStoreData();
  }, [storeId]);

  // Check follow status when user and store are loaded
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (user && storeId && user.id !== storeId) {
        try {
          const result = await followService.isFollowing(user.id, storeId);
          if (result.success) {
            setIsFollowing(result.isFollowing);
          }
        } catch (error) {
          console.error('Error checking follow status:', error);
        }
      }
    };

    checkFollowStatus();
  }, [user, storeId]);

  // Filtered and sorted products
  const filteredProducts = (products || []).filter(product => {
    if (selectedCategory === 'all') return true;
    return product.category === selectedCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return (a.price || 0) - (b.price || 0);
      case 'price-high': return (b.price || 0) - (a.price || 0);
      case 'rating': return (b.rating || 0) - (a.rating || 0);
      case 'newest': return new Date(b.created_at) - new Date(a.created_at);
      case 'sold': return (b.total_sales || 0) - (a.total_sales || 0);
      default: return new Date(b.created_at) - new Date(a.created_at); // Default to newest
    }
  });

  const handleFollow = async () => {
    if (!user) {
      // Redirect to login or show login modal
      navigate('/auth/login');
      return;
    }

    if (user.id === storeId) {
      // User can't follow themselves
      return;
    }

    setIsFollowLoading(true);

    try {
      const result = await followService.toggleFollow(user.id, storeId);
      
      if (result.success) {
        setIsFollowing(result.isFollowing);
        
        // Update the follower count in storeStats
        setStoreStats(prevStats => ({
          ...prevStats,
          totalFollowers: result.isFollowing 
            ? (prevStats?.totalFollowers || 0) + 1 
            : Math.max((prevStats?.totalFollowers || 0) - 1, 0)
        }));

        // Show success message
        const action = result.isFollowing ? 'following' : 'unfollowed';
        console.log(`Successfully ${action} store`);
      } else {
        console.error('Follow toggle failed:', result.error);
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleMessageStore = () => {
    // TODO: Firebase Implementation - Open messaging interface
    console.log('Message store:', store.business_name || store.display_name);
  };

  const handleShareStore = () => {
    // TODO: Firebase Implementation - Share store link
    navigator.share?.({
      title: store.business_name || store.display_name,
      text: store.business_description || 'Check out this store!',
      url: window.location.href
    });
  };

  const handleProductClick = (productId) => {
    navigate(`/item/${productId}`);
  };

  // Loading state
  if (loading) {
    return (
      <BuyerLayout>
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background.accent }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4" style={{ borderColor: theme.colors.primary[600] }}></div>
            <p style={{ color: theme.colors.gray[600] }}>Loading store information...</p>
          </div>
        </div>
      </BuyerLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <BuyerLayout>
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background.accent }}>
          <div className="text-center">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: theme.colors.error[100] }}>
              <span className="text-4xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.error[600] }}>Store Not Found</h2>
            <p style={{ color: theme.colors.gray[600] }} className="mb-4">{error}</p>
            <button
              onClick={() => navigate('/buyer/store')}
              className="px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
              style={{
                backgroundColor: theme.colors.primary[600],
                color: theme.colors.white
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = theme.colors.primary[700];
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = theme.colors.primary[600];
              }}
            >
              Browse All Stores
            </button>
          </div>
        </div>
      </BuyerLayout>
    );
  }

  // No store data
  if (!store) {
    return (
      <BuyerLayout>
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background.accent }}>
          <div className="text-center">
            <p style={{ color: theme.colors.gray[600] }}>Store information not available</p>
            {error && (
              <p style={{ color: theme.colors.error[600], marginTop: '1rem' }}>
                Error: {error}
              </p>
            )}
          </div>
        </div>
      </BuyerLayout>
    );
  }

  return (
    <BuyerLayout>
      <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.accent }}>
        
        {/* Store Cover & Header */}
        <div className="relative h-80 mb-8 overflow-hidden">
          {/* Cover Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary[600]} 0%, ${theme.colors.secondary[600]} 100%)`,
              filter: 'blur(8px) brightness(0.7)'
            }}
          />
          
          {/* Gradient Overlay */}
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, transparent 0%, ${theme.colors.primary[900]}80 100%)`
            }}
          />

          {/* Store Header Content */}
          <div className="relative h-full flex items-end">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 w-full">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
                
                {/* Store Logo */}
                <div 
                  className="w-32 h-32 rounded-full overflow-hidden border-4 flex-shrink-0"
                  style={{ borderColor: theme.colors.white }}
                >
                  <img 
                    src={store.profile_image || '/default-avatar.png'} 
                    alt={store.business_name || store.display_name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Store Info */}
                <div className="flex-1 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold">
                      {store.business_name || store.display_name}
                    </h1>
                    {store.is_business_verified && (
                      <div 
                        className="flex items-center px-3 py-1 rounded-full"
                        style={{ backgroundColor: theme.colors.success[500] }}
                      >
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-semibold">Verified</span>
                      </div>
                    )}
                  </div>

                  <p className="text-lg mb-4 opacity-90 max-w-2xl">
                    {store.business_description || 'Welcome to our store! We offer quality products at great prices.'}
                  </p>

                  {/* Store Stats */}
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-semibold">{storeStats?.rating || 0}</span>
                      <span className="opacity-75">({storeStats?.totalRatings || 0} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <span>{storeStats?.totalSales || 0} sales</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM9 12a1 1 0 002 0V9a1 1 0 00-2 0v3z" clipRule="evenodd" />
                      </svg>
                      <span>{storeStats?.totalProducts || 0} products</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" clipRule="evenodd" />
                      </svg>
                      <span>{storeStats?.totalFollowers || 0} followers</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <span>{store.business_address || store.address || 'Cebu, Philippines'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <span>Joined {new Date(store.created_at).getFullYear()}</span>
                    </div>
                  </div>
                </div>

                {/* Store Actions */}
                <div className="flex flex-col gap-3 md:ml-auto">
                  {/* Only show follow button if user is logged in and not the store owner */}
                  {user && user.id !== storeId && (
                    <button
                      onClick={handleFollow}
                      disabled={isFollowLoading}
                      className="px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: isFollowing ? theme.colors.gray[200] : theme.colors.white,
                        color: isFollowing ? theme.colors.gray[700] : theme.colors.primary[600],
                        boxShadow: theme.shadows.lg
                      }}
                    >
                      {isFollowLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {isFollowing ? 'Unfollowing...' : 'Following...'}
                        </span>
                      ) : (
                        isFollowing ? '✓ Following' : '+ Follow Store'
                      )}
                    </button>
                  )}
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleMessageStore}
                      className="flex-1 px-4 py-2 rounded-lg transition-all duration-200"
                      style={{
                        backgroundColor: theme.colors.primary[600],
                        color: theme.colors.white
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = theme.colors.primary[700];
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = theme.colors.primary[600];
                      }}
                    >
                      💬 Message
                    </button>
                    
                    <button
                      onClick={handleShareStore}
                      className="px-4 py-2 rounded-lg transition-all duration-200"
                      style={{
                        backgroundColor: theme.colors.gray[600],
                        color: theme.colors.white
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = theme.colors.gray[700];
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = theme.colors.gray[600];
                      }}
                    >
                      📤
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-12">
          
          {/* Store Navigation & Filters */}
          <div 
            className="p-6 mb-8 rounded-2xl"
            style={{
              backgroundColor: theme.colors.white,
              boxShadow: theme.shadows.lg,
              border: `1px solid ${theme.colors.gray[200]}`
            }}
          >
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Categories */}
              <div className="flex-1">
                <h3 
                  className="text-sm font-semibold mb-3"
                  style={{ color: theme.colors.gray[600] }}
                >
                  CATEGORIES
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
                    style={{
                      backgroundColor: selectedCategory === 'all' ? theme.colors.primary[600] : theme.colors.gray[100],
                      color: selectedCategory === 'all' ? theme.colors.white : theme.colors.gray[700]
                    }}
                  >
                    All Products ({products?.length || 0})
                  </button>
                  {/* Get unique categories from products */}
                  {products && products.length > 0 && [...new Set(products.map(p => p.category))].map(category => {
                    const count = products.filter(p => p.category === category).length;
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
                        style={{
                          backgroundColor: selectedCategory === category ? theme.colors.primary[600] : theme.colors.gray[100],
                          color: selectedCategory === category ? theme.colors.white : theme.colors.gray[700]
                        }}
                      >
                        {category} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort & View Controls */}
              <div className="flex items-center gap-4">
                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 rounded-lg border"
                  style={{
                    borderColor: theme.colors.gray[300],
                    backgroundColor: theme.colors.white,
                    color: theme.colors.gray[800]
                  }}
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="sold">Best Selling</option>
                </select>

                {/* View Mode Toggle */}
                <div className="flex border rounded-lg overflow-hidden" style={{ borderColor: theme.colors.gray[300] }}>
                  <button
                    onClick={() => setViewMode('grid')}
                    className="px-3 py-2 transition-all duration-200"
                    style={{
                      backgroundColor: viewMode === 'grid' ? theme.colors.primary[600] : theme.colors.white,
                      color: viewMode === 'grid' ? theme.colors.white : theme.colors.gray[600]
                    }}
                  >
                    ⊞
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className="px-3 py-2 transition-all duration-200"
                    style={{
                      backgroundColor: viewMode === 'list' ? theme.colors.primary[600] : theme.colors.white,
                      color: viewMode === 'list' ? theme.colors.white : theme.colors.gray[600]
                    }}
                  >
                    ☰
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 
                className="text-2xl font-bold"
                style={{ color: theme.colors.gray[800] }}
              >
                Products ({filteredProducts.length})
              </h2>
              <div 
                className="text-sm"
                style={{ color: theme.colors.gray[600] }}
              >
                Showing {filteredProducts.length} of {products?.length || 0} products
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: theme.colors.gray[100] }}
                >
                  <span className="text-4xl">📦</span>
                </div>
                <h3 
                  className="text-xl font-bold mb-2"
                  style={{ color: theme.colors.gray[400] }}
                >
                  No products found
                </h3>
                <p style={{ color: theme.colors.gray[500] }}>
                  Try adjusting your filters or check back later
                </p>
              </div>
            ) : (
              <div 
                className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                    : 'grid-cols-1'
                }`}
              >
                {filteredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="group cursor-pointer transition-all duration-300 transform hover:scale-105"
                    style={{
                      backgroundColor: theme.colors.white,
                      borderRadius: theme.borderRadius.xl,
                      boxShadow: theme.shadows.md,
                      border: `1px solid ${theme.colors.gray[200]}`,
                      overflow: 'hidden',
                      animationDelay: `${index * 100}ms`
                    }}
                    onClick={() => handleProductClick(product.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = theme.shadows.xl;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = theme.shadows.md;
                    }}
                  >
                    {/* Product Image */}
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={product.images?.[0] || product.primary_image || '/placeholder-product.jpg'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 space-y-2">
                        {product.original_price && product.original_price > product.price && (
                          <div 
                            className="px-2 py-1 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: theme.colors.error[500],
                              color: theme.colors.white
                            }}
                          >
                            -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                          </div>
                        )}
                        {product.is_featured && (
                          <div 
                            className="px-2 py-1 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: theme.colors.secondary[500],
                              color: theme.colors.white
                            }}
                          >
                            Featured
                          </div>
                        )}
                        {product.quantity <= 0 && (
                          <div 
                            className="px-2 py-1 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: theme.colors.gray[500],
                              color: theme.colors.white
                            }}
                          >
                            Out of Stock
                          </div>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-y-2">
                        <button 
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200"
                          style={{ backgroundColor: theme.colors.white, color: theme.colors.gray[600] }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = theme.colors.error[50];
                            e.target.style.color = theme.colors.error[600];
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = theme.colors.white;
                            e.target.style.color = theme.colors.gray[600];
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Add to wishlist
                          }}
                        >
                          ♡
                        </button>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 
                        className="font-semibold mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200"
                        style={{ color: theme.colors.gray[800] }}
                      >
                        {product.name}
                      </h3>

                      {/* Rating & Reviews */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span 
                            className="text-sm ml-1"
                            style={{ color: theme.colors.gray[600] }}
                          >
                            {product.rating || 0} ({product.total_ratings || 0})
                          </span>
                        </div>
                        <span 
                          className="text-xs"
                          style={{ color: theme.colors.gray[500] }}
                        >
                          {product.total_sales || 0} sold
                        </span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center gap-2 mb-3">
                        <span 
                          className="text-lg font-bold"
                          style={{ color: theme.colors.primary[600] }}
                        >
                          ₱{product.price?.toLocaleString() || '0'}
                        </span>
                        {product.original_price && product.original_price > product.price && (
                          <span 
                            className="text-sm line-through"
                            style={{ color: theme.colors.gray[500] }}
                          >
                            ₱{product.original_price.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Stock Status */}
                      {product.quantity > 0 && (
                        <div 
                          className={`text-xs px-2 py-1 rounded-full inline-block ${
                            product.quantity <= 5 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {product.quantity <= 5 ? `Only ${product.quantity} left` : 'In Stock'}
                        </div>
                      )}
                      {product.quantity <= 0 && (
                        <div className="text-xs px-2 py-1 rounded-full inline-block bg-gray-100 text-gray-600">
                          Out of Stock
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Store Information Tabs */}
          <div 
            className="p-6 rounded-2xl"
            style={{
              backgroundColor: theme.colors.white,
              boxShadow: theme.shadows.lg,
              border: `1px solid ${theme.colors.gray[200]}`
            }}
          >
            <h3 
              className="text-xl font-bold mb-6"
              style={{ color: theme.colors.gray[800] }}
            >
              Store Information
            </h3>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Store Policies */}
              <div>
                <h4 
                  className="font-semibold mb-3"
                  style={{ color: theme.colors.gray[700] }}
                >
                  📋 Store Policies
                </h4>
                <div className="space-y-2 text-sm" style={{ color: theme.colors.gray[600] }}>
                  <div>🚚 Standard shipping within 3-5 business days</div>
                  <div>↩️ 30-day return policy</div>
                  <div>🛡️ 1-year warranty on electronics</div>
                </div>
              </div>

              {/* Store Stats */}
              <div>
                <h4 
                  className="font-semibold mb-3"
                  style={{ color: theme.colors.gray[700] }}
                >
                  📊 Store Performance
                </h4>
                <div className="space-y-2 text-sm" style={{ color: theme.colors.gray[600] }}>
                  <div>📈 Response Rate: 95%</div>
                  <div>⏱️ Response Time: Within 2 hours</div>
                </div>
              </div>

              {/* Awards & Recognition */}
              <div>
                <h4 
                  className="font-semibold mb-3"
                  style={{ color: theme.colors.gray[700] }}
                >
                  🏆 Awards & Recognition
                </h4>
                <div className="space-y-2">
                  <div 
                    className="text-xs px-2 py-1 rounded-full inline-block mr-2 mb-1"
                    style={{
                      backgroundColor: theme.colors.secondary[100],
                      color: theme.colors.secondary[700]
                    }}
                  >
                    Verified Seller
                  </div>
                  <div 
                    className="text-xs px-2 py-1 rounded-full inline-block mr-2 mb-1"
                    style={{
                      backgroundColor: theme.colors.secondary[100],
                      color: theme.colors.secondary[700]
                    }}
                  >
                    Quality Products
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Line clamp styles */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>
    </BuyerLayout>
  );
};

export default StorePage;
