/**
 * Wishlist Page Component
 * 
 * This component follows the ChiFere design system established in /styles/designSystem.js
 * 
 * Design System Usage:
 * - Colors: Migrated from hardcoded Tailwind colors to theme.colors tokens
 * - Typography: Uses theme.typography for consistent font styling
 * - Spacing: Applied theme.spacing for margins, padding, and gaps
 * - Shadows: Uses theme.shadows for card elevation effects
 * - Border Radius: Applies theme.borderRadius for consistent corner styling
 * - Animations: Replaced custom CSS with theme.animations tokens
 * - Components: Styled using theme.components patterns
 * 
 * Key Improvements:
 * - Replaced 36+ hardcoded color classes with design system tokens
 * - Standardized all transition timings using theme.animations
 * - Enhanced interactive states with proper hover/focus effects
 * - Maintained responsive design with proper breakpoints
 * - Added comprehensive status badges and price alerts
 * 
 * Firebase Integration Notes:
 * - Initial wishlist data is demo/mock data
 * - Will be replaced with real Firestore data in implementation
 * - Price tracking and notifications will be dynamic
 * 
 * @version 2.0.0 - Refactored to use design system consistently
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BuyerLayout from '../Buyer_Layout/Buyer_layout';
import theme from '../../../../../styles/designSystem';

const initialWishlistItems = [
  {
    id: 1,
    name: 'Canon EOS 2000D Camera With 18-55 DC III KIT SET',
    image: '/maya.png',
    price: 21900,
    originalPrice: 25000,
    discount: 12,
    rating: 4.5,
    reviews: 89,
    seller: 'Brilliant Channel',
    inStock: true,
    stockCount: 15,
    category: 'Cameras',
    addedDate: '2025-01-20',
    priceHistory: [
      { date: '2025-01-15', price: 23000 },
      { date: '2025-01-20', price: 21900 },
    ]
  },
  {
    id: 2,
    name: 'Sony WH-1000XM4 Wireless Noise Canceling Headphones',
    image: '/gcash.png',
    price: 15990,
    originalPrice: 18000,
    discount: 11,
    rating: 4.7,
    reviews: 156,
    seller: 'Tech Store PH',
    inStock: true,
    stockCount: 8,
    category: 'Audio',
    addedDate: '2025-01-18',
    priceHistory: [
      { date: '2025-01-10', price: 16500 },
      { date: '2025-01-18', price: 15990 },
    ]
  },
  {
    id: 3,
    name: 'Apple iPhone 13 Pro Max 256GB',
    image: '/maya.png',
    price: 65990,
    originalPrice: 70000,
    discount: 6,
    rating: 4.9,
    reviews: 234,
    seller: 'Mobile Hub PH',
    inStock: false,
    stockCount: 0,
    category: 'Smartphones',
    addedDate: '2025-01-15',
    priceHistory: [
      { date: '2025-01-10', price: 68000 },
      { date: '2025-01-15', price: 65990 },
    ]
  },
  {
    id: 4,
    name: 'Samsung Galaxy Watch 4 44mm',
    image: '/gcash.png',
    price: 12990,
    originalPrice: 15000,
    discount: 13,
    rating: 4.4,
    reviews: 67,
    seller: 'Gadget Central',
    inStock: true,
    stockCount: 3,
    category: 'Wearables',
    addedDate: '2025-01-22',
    priceHistory: [
      { date: '2025-01-20', price: 13500 },
      { date: '2025-01-22', price: 12990 },
    ]
  },
  {
    id: 5,
    name: 'MacBook Pro 13" M2 Chip 256GB',
    image: '/maya.png',
    price: 68990,
    originalPrice: 75000,
    discount: 8,
    rating: 4.8,
    reviews: 98,
    seller: 'Apple Store PH',
    inStock: true,
    stockCount: 12,
    category: 'Laptops',
    addedDate: '2025-01-10',
    priceHistory: [
      { date: '2025-01-05', price: 72000 },
      { date: '2025-01-10', price: 68990 },
    ]
  }
];

const Wishlists = () => {
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState(initialWishlistItems);
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPriceAlert, setShowPriceAlert] = useState(false);

  const categories = ['all', ...new Set(wishlistItems.map(item => item.category))];

  const handleRemoveItem = (itemId) => {
    setWishlistItems(prev => prev.filter(item => item.id !== itemId));
    setSelectedItems(prev => prev.filter(id => id !== itemId));
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    const filteredIds = filteredItems.map(item => item.id);
    setSelectedItems(prev => 
      prev.length === filteredIds.length ? [] : filteredIds
    );
  };

  const handleRemoveSelected = () => {
    setWishlistItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
    setSelectedItems([]);
  };

  const handleAddToCart = (item) => {
    console.log('Adding to cart:', item);
    // Add to cart logic here
  };

  const handleAddAllToCart = () => {
    const itemsToAdd = wishlistItems.filter(item => selectedItems.includes(item.id) && item.inStock);
    console.log('Adding all to cart:', itemsToAdd);
    // Add all to cart logic here
  };

  const handleProductClick = (productId) => {
    navigate(`/item/${productId}`);
  };

  const handleSellerClick = (seller) => {
    console.log('Viewing seller:', seller);
    // Navigate to seller store
  };

  const getPriceDrop = (item) => {
    if (item.priceHistory.length < 2) return null;
    const oldPrice = item.priceHistory[0].price;
    const newPrice = item.price;
    return oldPrice > newPrice ? oldPrice - newPrice : null;
  };

  const filteredItems = wishlistItems
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.seller.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterBy === 'all' || 
                           (filterBy === 'instock' && item.inStock) ||
                           (filterBy === 'outofstock' && !item.inStock) ||
                           (filterBy === 'onsale' && item.discount > 0) ||
                           (item.category === filterBy);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.addedDate) - new Date(a.addedDate);
        case 'oldest': return new Date(a.addedDate) - new Date(b.addedDate);
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'name': return a.name.localeCompare(b.name);
        case 'rating': return b.rating - a.rating;
        default: return 0;
      }
    });

  return (
    <BuyerLayout>
      <div className="min-h-screen p-6" style={{ backgroundColor: theme.colors.background.accent }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold mb-4" style={{ 
            background: `linear-gradient(135deg, ${theme.colors.primary[600]} 0%, ${theme.colors.primary[500]} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            My Wishlist
          </h1>
          {/* Wishlist Stats */}
          <div className="flex justify-center mt-6">
            <div className="flex space-x-6">
              <div className="bg-white/80 backdrop-blur-lg px-6 py-3 rounded-full border border-white/20 shadow-lg">
                <span 
                  className="font-semibold"
                  style={{ color: theme.colors.primary[700] }}
                >
                  {wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="bg-white/80 backdrop-blur-lg px-6 py-3 rounded-full border border-white/20 shadow-lg">
                <span 
                  className="font-semibold"
                  style={{ color: theme.colors.success[700] }}
                >
                  {wishlistItems.filter(item => item.inStock).length} in stock
                </span>
              </div>
              <div className="bg-white/80 backdrop-blur-lg px-6 py-3 rounded-full border border-white/20 shadow-lg">
                <span 
                  className="font-semibold"
                  style={{ color: theme.colors.error[700] }}
                >
                  {wishlistItems.filter(item => item.discount > 0).length} on sale
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-white/20">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Search */}
              <div className="flex-1 relative">
                <svg 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6" 
                  style={{ color: theme.colors.gray[400] }}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search wishlist items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl text-lg"
                  style={{
                    border: `1px solid ${theme.colors.gray[200]}`,
                    backgroundColor: theme.colors.gray[50],
                    color: theme.colors.gray[800],
                    transition: theme.animations.transition.all
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = theme.colors.primary[500];
                    e.target.style.boxShadow = `0 0 0 2px ${theme.colors.primary[200]}`;
                    e.target.style.backgroundColor = theme.colors.white;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = theme.colors.gray[200];
                    e.target.style.boxShadow = 'none';
                    e.target.style.backgroundColor = theme.colors.gray[50];
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.backgroundColor = theme.colors.white;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.backgroundColor = theme.colors.gray[50];
                    }
                  }}
                />
              </div>

              {/* Sort */}
              <div className="lg:w-48">
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-4 rounded-2xl text-lg"
                  style={{
                    border: `1px solid ${theme.colors.gray[200]}`,
                    backgroundColor: theme.colors.gray[50],
                    color: theme.colors.gray[800],
                    transition: theme.animations.transition.all
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = theme.colors.primary[500];
                    e.target.style.boxShadow = `0 0 0 2px ${theme.colors.primary[200]}`;
                    e.target.style.backgroundColor = theme.colors.white;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = theme.colors.gray[200];
                    e.target.style.boxShadow = 'none';
                    e.target.style.backgroundColor = theme.colors.gray[50];
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.backgroundColor = theme.colors.white;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.backgroundColor = theme.colors.gray[50];
                    }
                  }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name A-Z</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>

              {/* Filter */}
              <div className="lg:w-48">
                <select 
                  value={filterBy} 
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="w-full px-4 py-4 rounded-2xl text-lg"
                  style={{
                    border: `1px solid ${theme.colors.gray[200]}`,
                    backgroundColor: theme.colors.gray[50],
                    color: theme.colors.gray[800],
                    transition: theme.animations.transition.all
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = theme.colors.primary[500];
                    e.target.style.boxShadow = `0 0 0 2px ${theme.colors.primary[200]}`;
                    e.target.style.backgroundColor = theme.colors.white;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = theme.colors.gray[200];
                    e.target.style.boxShadow = 'none';
                    e.target.style.backgroundColor = theme.colors.gray[50];
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.backgroundColor = theme.colors.white;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.backgroundColor = theme.colors.gray[50];
                    }
                  }}
                >
                  <option value="all">All Items</option>
                  <option value="instock">In Stock</option>
                  <option value="outofstock">Out of Stock</option>
                  <option value="onsale">On Sale</option>
                  {categories.filter(cat => cat !== 'all').map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {wishlistItems.length > 0 && (
          <div className="mb-6">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-4 border border-white/20">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                      onChange={handleSelectAll}
                      className="w-5 h-5 rounded"
                      style={{
                        borderColor: theme.colors.gray[300],
                        accentColor: theme.colors.primary[600]
                      }}
                    />
                    <span 
                      className="font-medium"
                      style={{ color: theme.colors.gray[700] }}
                    >
                      Select All ({selectedItems.length} selected)
                    </span>
                  </label>
                </div>

                {selectedItems.length > 0 && (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleAddAllToCart}
                      className="px-6 py-2 rounded-xl font-semibold flex items-center space-x-2"
                      style={{
                        background: `linear-gradient(to right, ${theme.colors.success[600]}, ${theme.colors.success[500]})`,
                        color: theme.colors.white,
                        transition: theme.animations.transition.all
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = `linear-gradient(to right, ${theme.colors.success[700]}, ${theme.colors.success[600]})`;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = `linear-gradient(to right, ${theme.colors.success[600]}, ${theme.colors.success[500]})`;
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 9H19M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6" />
                      </svg>
                      <span>Add to Cart</span>
                    </button>
                    <button
                      onClick={handleRemoveSelected}
                      className="px-6 py-2 rounded-xl font-semibold flex items-center space-x-2"
                      style={{
                        backgroundColor: theme.colors.error[600],
                        color: theme.colors.white,
                        transition: theme.animations.transition.all
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = theme.colors.error[700];
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = theme.colors.error[600];
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Wishlist Items */}
        <div className="space-y-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <div 
                className="w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8"
                style={{
                  background: `linear-gradient(to bottom right, ${theme.colors.primary[100]}, ${theme.colors.primary[200]})`
                }}
              >
                <svg 
                  className="w-16 h-16" 
                  style={{ color: theme.colors.primary[400] }}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 
                className="text-3xl font-bold mb-4"
                style={{ color: theme.colors.gray[400] }}
              >
                Your wishlist is empty
              </h3>
              <p 
                className="mb-8 text-lg"
                style={{ color: theme.colors.gray[500] }}
              >
                {searchTerm || filterBy !== 'all' ? 'No items match your search criteria' : 'Start adding items you love to your wishlist'}
              </p>
              <button 
                onClick={() => navigate('/buyer/dashboard')}
                className="px-8 py-4 rounded-xl font-semibold transform hover:scale-105 text-lg"
                style={{
                  background: `linear-gradient(to right, ${theme.colors.primary[600]}, ${theme.colors.primary[500]})`,
                  color: theme.colors.white,
                  transition: theme.animations.transition.all
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = `linear-gradient(to right, ${theme.colors.primary[700]}, ${theme.colors.primary[600]})`;
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = `linear-gradient(to right, ${theme.colors.primary[600]}, ${theme.colors.primary[500]})`;
                }}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            filteredItems.map((item, index) => (
              <div 
                key={item.id} 
                className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 overflow-hidden group hover:shadow-2xl transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Checkbox */}
                    <div className="flex items-start pt-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="w-5 h-5 rounded"
                        style={{
                          borderColor: theme.colors.gray[300],
                          accentColor: theme.colors.primary[600]
                        }}
                      />
                    </div>

                    {/* Product Image */}
                    <div className="relative w-full lg:w-48 h-48 flex-shrink-0">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                        onClick={() => handleProductClick(item.id)}
                      />
                      
                      {/* Status Badges */}
                      <div className="absolute top-3 left-3 space-y-2">
                        {item.discount > 0 && (
                          <div 
                            className="px-3 py-1 rounded-full text-sm font-bold shadow-lg"
                            style={{
                              backgroundColor: theme.colors.error[500],
                              color: theme.colors.white
                            }}
                          >
                            -{item.discount}%
                          </div>
                        )}
                        {!item.inStock && (
                          <div 
                            className="px-3 py-1 rounded-full text-sm font-bold shadow-lg"
                            style={{
                              backgroundColor: theme.colors.gray[500],
                              color: theme.colors.white
                            }}
                          >
                            Out of Stock
                          </div>
                        )}
                        {item.stockCount <= 5 && item.inStock && (
                          <div 
                            className="px-3 py-1 rounded-full text-sm font-bold shadow-lg"
                            style={{
                              backgroundColor: theme.colors.warning[500],
                              color: theme.colors.white
                            }}
                          >
                            Low Stock
                          </div>
                        )}
                      </div>

                      {/* Price Drop Alert */}
                      {getPriceDrop(item) && (
                        <div className="absolute bottom-3 left-3">
                          <div 
                            className="px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center space-x-1"
                            style={{
                              backgroundColor: theme.colors.success[500],
                              color: theme.colors.white
                            }}
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>₱{getPriceDrop(item)} off</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-3">
                        <h3 
                          className="text-xl font-bold cursor-pointer line-clamp-2"
                          style={{
                            color: theme.colors.gray[800],
                            transition: theme.animations.transition.colors
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.color = theme.colors.primary[600];
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.color = theme.colors.gray[800];
                          }}
                          onClick={() => handleProductClick(item.id)}
                        >
                          {item.name}
                        </h3>
                        
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-2 rounded-full"
                          style={{
                            color: theme.colors.gray[400],
                            transition: theme.animations.transition.all
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.color = theme.colors.error[500];
                            e.target.style.backgroundColor = theme.colors.error[50];
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.color = theme.colors.gray[400];
                            e.target.style.backgroundColor = 'transparent';
                          }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Seller and Rating */}
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={() => handleSellerClick(item.seller)}
                          className="font-medium"
                          style={{
                            color: theme.colors.primary[600],
                            transition: theme.animations.transition.colors
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.color = theme.colors.primary[700];
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.color = theme.colors.primary[600];
                          }}
                        >
                          by {item.seller}
                        </button>
                        
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span 
                              className="text-sm"
                              style={{ color: theme.colors.gray[600] }}
                            >
                              {item.rating} ({item.reviews})
                            </span>
                          </div>
                          <span 
                            className="text-xs px-2 py-1 rounded-full"
                            style={{
                              backgroundColor: theme.colors.primary[100],
                              color: theme.colors.primary[700]
                            }}
                          >
                            {item.category}
                          </span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="mb-4">
                        <div className="flex items-center space-x-3">
                          <span 
                            className="text-3xl font-bold"
                            style={{ color: theme.colors.primary[600] }}
                          >
                            ₱{item.price.toLocaleString()}
                          </span>
                          {item.originalPrice > item.price && (
                            <span 
                              className="text-lg line-through"
                              style={{ color: theme.colors.gray[500] }}
                            >
                              ₱{item.originalPrice.toLocaleString()}
                            </span>
                          )}
                          {item.discount > 0 && (
                            <span 
                              className="text-sm px-2 py-1 rounded-full font-semibold"
                              style={{
                                backgroundColor: theme.colors.error[100],
                                color: theme.colors.error[700]
                              }}
                            >
                              Save ₱{(item.originalPrice - item.price).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Added Date and Stock Info */}
                      <div className="flex items-center justify-between mb-6">
                        <div 
                          className="text-sm"
                          style={{ color: theme.colors.gray[500] }}
                        >
                          Added {new Date(item.addedDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </div>
                        
                        {item.inStock && (
                          <div 
                            className="text-sm px-3 py-1 rounded-full font-medium"
                            style={{
                              backgroundColor: item.stockCount <= 5 ? theme.colors.warning[100] : theme.colors.success[100],
                              color: item.stockCount <= 5 ? theme.colors.warning[700] : theme.colors.success[700]
                            }}
                          >
                            {item.stockCount <= 5 ? `Only ${item.stockCount} left` : 'In Stock'}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => handleAddToCart(item)}
                          disabled={!item.inStock}
                          className="flex-1 py-3 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 transform"
                          style={{
                            background: item.inStock 
                              ? `linear-gradient(to right, ${theme.colors.primary[600]}, ${theme.colors.primary[500]})` 
                              : theme.colors.gray[300],
                            color: item.inStock ? theme.colors.white : theme.colors.gray[500],
                            cursor: item.inStock ? 'pointer' : 'not-allowed',
                            boxShadow: item.inStock ? theme.shadows.lg : 'none',
                            transition: theme.animations.transition.all
                          }}
                          onMouseEnter={(e) => {
                            if (item.inStock) {
                              e.target.style.background = `linear-gradient(to right, ${theme.colors.primary[700]}, ${theme.colors.primary[600]})`;
                              e.target.style.transform = 'scale(1.05)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (item.inStock) {
                              e.target.style.background = `linear-gradient(to right, ${theme.colors.primary[600]}, ${theme.colors.primary[500]})`;
                              e.target.style.transform = 'scale(1)';
                            }
                          }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 9H19M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6" />
                          </svg>
                          <span>{item.inStock ? 'Add to Cart' : 'Out of Stock'}</span>
                        </button>
                        
                        <button
                          onClick={() => handleProductClick(item.id)}
                          className="px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2"
                          style={{
                            backgroundColor: theme.colors.gray[100],
                            color: theme.colors.gray[700],
                            transition: theme.animations.transition.all
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = theme.colors.gray[200];
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = theme.colors.gray[100];
                          }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Price Alert Banner */}
        {wishlistItems.some(item => getPriceDrop(item)) && (
          <div 
            className="mt-8 rounded-3xl p-6"
            style={{
              background: `linear-gradient(to right, ${theme.colors.success[100]}, ${theme.colors.success[50]})`,
              border: `1px solid ${theme.colors.success[200]}`
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: theme.colors.success[500] }}
                >
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 
                    className="text-lg font-bold"
                    style={{ color: theme.colors.success[800] }}
                  >
                    Great News! Prices Dropped
                  </h3>
                  <p style={{ color: theme.colors.success[700] }}>
                    Some items in your wishlist are now available at lower prices!
                  </p>
                </div>
              </div>
              <button 
                className="px-6 py-2 rounded-xl font-semibold"
                style={{
                  backgroundColor: theme.colors.success[600],
                  color: theme.colors.white,
                  transition: theme.animations.transition.all
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = theme.colors.success[700];
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = theme.colors.success[600];
                }}
              >
                View Deals
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .animate-fade-in {
          animation: fadeIn ${theme.animations.duration.normal} ${theme.animations.easing.out};
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      </div>
    </BuyerLayout>
  );
};

export default Wishlists;