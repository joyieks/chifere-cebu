import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BuyerLayout from '../../Buyer/Buyer_Menu/Buyer_Layout/Buyer_layout';
import theme from '../../../../styles/designSystem';
import searchService from '../../../../services/searchService';
import { useCart } from '../../../../contexts/CartContext';

const SearchResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const query = params.get('q') || ''; // Fixed: use 'q' parameter to match Navigation component
  const { addToCart, loading: cartLoading } = useCart();
  
  // State management
  const [searchResults, setSearchResults] = useState({ products: [], stores: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  // Load search results
  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setSearchResults({ products: [], stores: [], categories: [] });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const results = await searchService.search(query, {
          type: 'all',
          limit: 50
        });
        
        if (results.success) {
          setSearchResults(results.data);
        } else {
          throw new Error(results.error || 'Search failed');
        }
      } catch (err) {
        console.error('Search error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  const handleProductClick = (productId) => {
    navigate(`/item/${productId}`);
  };

  const handleStoreClick = (storeId) => {
    navigate(`/buyer/store/${storeId}`);
  };

  const handleAddToCart = async (product) => {
    try {
      const cartItem = {
        id: product.id,
        name: product.name,
        price: product.price || 0,
        image: product.primary_image || product.images?.[0] || '',
        sellerId: product.seller_id || '',
        sellerName: product.user_profiles?.business_name || product.user_profiles?.display_name || 'Store',
        category: product.category,
        quantity: 1
      };
      
      await addToCart(cartItem, 1);
      console.log('✅ Item added to cart:', product.name);
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
    }
  };

  const totalResults = searchResults.products.length + searchResults.stores.length + searchResults.categories.length;

  // Loading state
  if (loading) {
    return (
      <BuyerLayout>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4" style={{ borderColor: theme.colors.primary[600] }}></div>
              <p style={{ color: theme.colors.gray[600] }}>Searching for "{query}"...</p>
            </div>
          </div>
        </div>
      </BuyerLayout>
    );
  }

  return (
    <BuyerLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: theme.colors.gray[800] }}>
            Search Results
          </h1>
          {query && (
            <p className="text-lg" style={{ color: theme.colors.gray[600] }}>
              Found {totalResults} results for "<span className="font-semibold">{query}</span>"
            </p>
          )}
          {!query && (
            <p className="text-lg" style={{ color: theme.colors.gray[600] }}>
              Enter a search term to find products and stores
            </p>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: theme.colors.error[100] }}>
              <span className="text-4xl">❌</span>
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: theme.colors.error[600] }}>Search Error</h3>
            <p style={{ color: theme.colors.gray[600] }}>{error}</p>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && query && totalResults === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: theme.colors.gray[100] }}>
              <span className="text-4xl">🔍</span>
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: theme.colors.gray[400] }}>No results found</h3>
            <p style={{ color: theme.colors.gray[500] }}>
              Try searching with different keywords or check your spelling
            </p>
          </div>
        )}

        {/* Search Results */}
        {!loading && !error && totalResults > 0 && (
          <>
            {/* Tab Navigation */}
            <div className="flex gap-1 mb-8 p-1 rounded-xl" style={{ backgroundColor: theme.colors.gray[100] }}>
              <button
                onClick={() => setActiveTab('all')}
                className="px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                style={{
                  backgroundColor: activeTab === 'all' ? theme.colors.white : 'transparent',
                  color: activeTab === 'all' ? theme.colors.primary[600] : theme.colors.gray[600],
                  boxShadow: activeTab === 'all' ? theme.shadows.sm : 'none'
                }}
              >
                All ({totalResults})
              </button>
              {searchResults.products.length > 0 && (
                <button
                  onClick={() => setActiveTab('products')}
                  className="px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: activeTab === 'products' ? theme.colors.white : 'transparent',
                    color: activeTab === 'products' ? theme.colors.primary[600] : theme.colors.gray[600],
                    boxShadow: activeTab === 'products' ? theme.shadows.sm : 'none'
                  }}
                >
                  Products ({searchResults.products.length})
                </button>
              )}
              {searchResults.stores.length > 0 && (
                <button
                  onClick={() => setActiveTab('stores')}
                  className="px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: activeTab === 'stores' ? theme.colors.white : 'transparent',
                    color: activeTab === 'stores' ? theme.colors.primary[600] : theme.colors.gray[600],
                    boxShadow: activeTab === 'stores' ? theme.shadows.sm : 'none'
                  }}
                >
                  Stores ({searchResults.stores.length})
                </button>
              )}
            </div>

            {/* Products Section */}
            {(activeTab === 'all' || activeTab === 'products') && searchResults.products.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.gray[800] }}>
                  Products
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {searchResults.products.map((product) => (
                    <div
                      key={product.id}
                      className="group cursor-pointer transition-all duration-300 transform hover:scale-105"
                      style={{
                        backgroundColor: theme.colors.white,
                        borderRadius: theme.borderRadius.xl,
                        boxShadow: theme.shadows.md,
                        border: `1px solid ${theme.colors.gray[200]}`,
                        overflow: 'hidden'
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
                          src={product.primary_image || product.images?.[0] || '/placeholder-product.jpg'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        
                        {/* Discount Badge */}
                        {product.original_price && product.original_price > product.price && (
                          <div 
                            className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: theme.colors.error[500],
                              color: theme.colors.white
                            }}
                          >
                            -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-2" style={{ color: theme.colors.gray[800] }}>
                          {product.name}
                        </h3>
                        
                        {/* Price */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg font-bold" style={{ color: theme.colors.primary[600] }}>
                            ₱{product.price?.toLocaleString() || '0'}
                          </span>
                          {product.original_price && product.original_price > product.price && (
                            <span className="text-sm line-through" style={{ color: theme.colors.gray[500] }}>
                              ₱{product.original_price.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Store and Rating */}
                        <div className="flex items-center justify-between text-sm">
                          <span style={{ color: theme.colors.gray[600] }}>
                            Store: <span className="font-semibold">{product.user_profiles?.business_name || product.user_profiles?.display_name || 'Store Name'}</span>
                          </span>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span style={{ color: theme.colors.gray[600] }}>
                              {product.rating || 0}
                            </span>
                          </div>
                        </div>

                        {/* Add to Cart Button */}
                        <div className="mt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click
                              handleAddToCart(product);
                            }}
                            disabled={cartLoading || product.quantity <= 0}
                            className="w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                            style={{
                              backgroundColor: product.quantity > 0 
                                ? theme.colors.primary[500] 
                                : theme.colors.gray[300],
                              color: theme.colors.white,
                              cursor: product.quantity > 0 ? 'pointer' : 'not-allowed'
                            }}
                            onMouseEnter={(e) => {
                              if (product.quantity > 0) {
                                e.target.style.backgroundColor = theme.colors.primary[600];
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = product.quantity > 0 
                                ? theme.colors.primary[500] 
                                : theme.colors.gray[300];
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                            </svg>
                            <span>
                              {cartLoading ? 'Adding...' : (product.quantity > 0 ? 'Add to Cart' : 'Out of Stock')}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
          ))}
        </div>
      </div>
            )}

            {/* Stores Section */}
            {(activeTab === 'all' || activeTab === 'stores') && searchResults.stores.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.gray[800] }}>
                  Stores
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.stores.map((store) => (
                    <div
                      key={store.id}
                      className="group cursor-pointer transition-all duration-300 transform hover:scale-105"
                      style={{
                        backgroundColor: theme.colors.white,
                        borderRadius: theme.borderRadius.xl,
                        boxShadow: theme.shadows.md,
                        border: `1px solid ${theme.colors.gray[200]}`,
                        overflow: 'hidden'
                      }}
                      onClick={() => handleStoreClick(store.id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = theme.shadows.xl;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = theme.shadows.md;
                      }}
                    >
                      {/* Store Cover */}
                      <div className="relative h-32 overflow-hidden">
                        <div 
                          className="absolute inset-0 bg-cover bg-center"
                          style={{
                            background: `linear-gradient(135deg, ${theme.colors.primary[600]} 0%, ${theme.colors.secondary[600]} 100%)`,
                            filter: 'blur(4px) brightness(0.8)'
                          }}
                        />
                        <div 
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(to bottom, transparent 0%, ${theme.colors.primary[900]}60 100%)`
                          }}
                        />
                        
                        {/* Store Logo */}
                        <div className="absolute bottom-4 left-4">
                          <div 
                            className="w-16 h-16 rounded-full overflow-hidden border-2"
                            style={{ borderColor: theme.colors.white }}
                          >
                            <img 
                              src={store.profile_image || '/default-avatar.png'} 
                              alt={store.business_name || store.display_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>

                        {/* Verified Badge */}
                        {store.is_business_verified && (
                          <div className="absolute top-3 right-3">
                            <div 
                              className="flex items-center px-2 py-1 rounded-full"
                              style={{ backgroundColor: theme.colors.success[500] }}
                            >
                              <svg className="w-3 h-3 mr-1 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs font-semibold text-white">Verified</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Store Info */}
                      <div className="p-6">
                        <h3 className="text-lg font-bold mb-2" style={{ color: theme.colors.gray[800] }}>
                          {store.business_name || store.display_name}
                        </h3>

                        <p className="text-sm mb-4 line-clamp-2" style={{ color: theme.colors.gray[600] }}>
                          {store.business_description || 'Welcome to our store! We offer quality products at great prices.'}
                        </p>

                        {/* Store Stats */}
                        <div className="flex flex-wrap gap-4 text-xs" style={{ color: theme.colors.gray[500] }}>
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span>{store.rating || 0} ({store.total_ratings || 0})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
                            </svg>
                            <span>{store.total_items || 0} products</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <span>{store.business_address || store.address || 'Cebu, Philippines'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Line clamp styles */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </BuyerLayout>
  );
};

export default SearchResult;
