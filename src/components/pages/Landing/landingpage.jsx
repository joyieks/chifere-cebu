import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingCart, FiStar, FiSearch, FiArrowRight, FiUser, FiBell, FiChevronDown, FiPhone, FiLogOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Navigation from '../../Navigation';
import { useCart } from '../../../contexts/CartContext';
import { useToast } from '../../Toast';
import { useAuth } from '../../../contexts/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { user, logout } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCategories, setShowCategories] = useState(false);

  const categories = [
    { id: 'all', name: 'All Categories', icon: '🏪', color: 'blue' },
    { id: 'electronics', name: 'Electronics', icon: '📱', color: 'purple' },
    { id: 'fashion', name: 'Fashion', icon: '👕', color: 'pink' },
    { id: 'home', name: 'Home & Living', icon: '🏠', color: 'green' },
    { id: 'books', name: 'Books', icon: '📚', color: 'orange' },
    { id: 'sports', name: 'Sports', icon: '⚽', color: 'red' },
    { id: 'automotive', name: 'Automotive', icon: '🚗', color: 'gray' },
  ];

  const featuredProducts = [
    {
      id: 1,
      name: 'Canon EOS 2000D Camera',
      price: 21900,
      originalPrice: 25000,
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500',
      seller: 'Brilliant Channel',
      rating: 4.8,
      reviews: 124,
      discount: 12,
      category: 'electronics',
      condition: 'Like New',
      isBarter: false,
    },
    {
      id: 2,
      name: 'iPhone 12 Pro Max',
      price: 45000,
      originalPrice: 60000,
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500',
      seller: 'Tech Store',
      rating: 4.9,
      reviews: 89,
      discount: 25,
      category: 'electronics',
      condition: 'Excellent',
      isBarter: false,
    },
    {
      id: 3,
      name: 'Vintage Leather Jacket',
      price: 0,
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500',
      seller: 'Fashion Hub',
      rating: 4.7,
      reviews: 56,
      category: 'fashion',
      condition: 'Good',
      isBarter: true,
      barterFor: 'Designer Shoes',
    },
    {
      id: 4,
      name: 'Gaming Laptop',
      price: 35000,
      originalPrice: 45000,
      image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500',
      seller: 'Gaming World',
      rating: 4.6,
      reviews: 78,
      discount: 22,
      category: 'electronics',
      condition: 'Very Good',
      isBarter: false,
    },
    {
      id: 5,
      name: 'Samsung Galaxy Watch 4',
      price: 12990,
      originalPrice: 15000,
      image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500',
      seller: 'Gadget Central',
      rating: 4.4,
      reviews: 67,
      discount: 13,
      category: 'electronics',
      condition: 'Excellent',
      isBarter: false,
    },
    {
      id: 6,
      name: 'MacBook Pro 13" M2',
      price: 68990,
      originalPrice: 75000,
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
      seller: 'Apple Store PH',
      rating: 4.8,
      reviews: 98,
      discount: 8,
      category: 'electronics',
      condition: 'Like New',
      isBarter: false,
    },
    {
      id: 7,
      name: 'Antique Wooden Chair',
      price: 0,
      image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=500',
      seller: 'Vintage Finds',
      rating: 4.5,
      reviews: 23,
      category: 'furniture',
      condition: 'Good',
      isBarter: true,
      barterFor: 'Vintage Books or Records',
    },
    {
      id: 8,
      name: 'Nike Air Jordan 1 Retro',
      price: 8500,
      originalPrice: 12000,
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500',
      seller: 'Sneaker Head',
      rating: 4.7,
      reviews: 156,
      discount: 29,
      category: 'fashion',
      condition: 'Very Good',
      isBarter: false,
    },
    {
      id: 9,
      name: 'Guitar Acoustic Yamaha',
      price: 0,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
      seller: 'Music Store',
      rating: 4.6,
      reviews: 34,
      category: 'music',
      condition: 'Good',
      isBarter: true,
      barterFor: 'Electric Guitar or Piano',
    },
    {
      id: 10,
      name: 'Sony WH-1000XM4 Headphones',
      price: 15990,
      originalPrice: 18000,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      seller: 'Tech Store PH',
      rating: 4.7,
      reviews: 156,
      discount: 11,
      category: 'electronics',
      condition: 'Excellent',
      isBarter: false,
    },
    {
      id: 11,
      name: 'Vintage Camera Collection',
      price: 0,
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500',
      seller: 'Collector\'s Corner',
      rating: 4.8,
      reviews: 12,
      category: 'collectibles',
      condition: 'Good',
      isBarter: true,
      barterFor: 'Vintage Watches or Coins',
    },
    {
      id: 12,
      name: 'Adidas Ultraboost 21',
      price: 6500,
      originalPrice: 9500,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
      seller: 'Sports Hub',
      rating: 4.5,
      reviews: 89,
      discount: 32,
      category: 'fashion',
      condition: 'Very Good',
      isBarter: false,
    },
  ];



  const handleProductClick = (product) => {
    navigate('/login');
  };

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    navigate('/login');
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    navigate('/login');
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Use our unified Navigation component */}
      <Navigation showPromotionalBar={true} />



      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
                          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
                Welcome to <span style={{ color: '#3B82F6' }}>ChiFere</span><span style={{ color: '#10B981' }}> Cebu</span>
              </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 animate-slide-up">
              Discover amazing preloved items and barter opportunities
            </p>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -right-16 w-32 h-32 bg-white/10 rounded-full animate-float"></div>
          <div className="absolute top-32 -left-8 w-20 h-20 bg-white/10 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-16 right-32 w-24 h-24 bg-white/10 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Categories */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Browse Categories</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category, index) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`group px-6 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 animate-slide-up ${
                  selectedCategory === category.id
                    ? `bg-gradient-to-r from-${category.color}-600 to-${category.color}-700 text-white shadow-lg`
                    : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-md hover:shadow-lg'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="text-xl mr-3">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Products */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Featured Products</h2>
            <button 
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              View All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product, index) => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Product Image */}
                <div className="relative overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col space-y-2">
                    {product.discount && (
                      <span className="bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-semibold">
                        -{product.discount}%
                      </span>
                    )}
                    {product.isBarter && (
                      <span className="bg-orange-500 text-white px-2 py-1 rounded-lg text-sm font-semibold">
                        Barter
                      </span>
                    )}
                  </div>
                  
                  {/* Condition Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                      {product.condition}
                    </span>
                  </div>
                  
                  {/* Wishlist Button */}
                  <button 
                    onClick={() => navigate('/login')}
                    className="absolute top-3 right-3 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white"
                  >
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
                
                {/* Product Info */}
                <div className="p-6">
                  <h3 className="font-bold text-lg text-gray-800 mb-2 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
                    {product.name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-3">{product.seller}</p>
                  
                  {/* Rating */}
                  <div className="flex items-center mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 ml-2">({product.reviews})</span>
                  </div>
                  
                  {/* Price */}
                  <div className="mb-4">
                    {product.isBarter ? (
                      <div>
                        <p className="text-lg font-bold text-orange-600">Barter Only</p>
                        <p className="text-sm text-gray-600">For: {product.barterFor}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-2xl font-bold text-blue-600">₱{product.price.toLocaleString()}</p>
                        {product.originalPrice && (
                          <p className="text-sm text-gray-500 line-through">₱{product.originalPrice.toLocaleString()}</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Add to Cart Button */}
                  <button 
                    onClick={(e) => handleAddToCart(product, e)}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                    </svg>
                    <span>{product.isBarter ? 'Make Offer' : 'Add to Cart'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Why Choose Chifere?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-3xl">
                🛡️
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Secure Trading</h3>
              <p className="text-gray-600">Safe and secure transactions with buyer protection</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center text-3xl">
                🌱
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Eco-Friendly</h3>
              <p className="text-gray-600">Promote sustainability through reusing and bartering</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-3xl">
                💬
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Community</h3>
              <p className="text-gray-600">Connect with like-minded people in your area</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }
        
        .animate-slide-up {
          animation: slideUp 0.8s ease-out;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;