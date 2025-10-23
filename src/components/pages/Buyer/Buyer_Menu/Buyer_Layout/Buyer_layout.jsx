import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiBell, FiMessageCircle, FiPackage, FiPhone, FiUser, FiLogOut, FiSettings, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../../../../../contexts/AuthContext';
import { useCart } from '../../../../../contexts/CartContext';
import { useMessages } from '../../../../../contexts/MessageContext';
import { useToast } from '../../../../Toast';
import SearchAutocomplete from '../../../../SearchAutocomplete';
import theme from '../../../../../styles/designSystem';

/**
 * BuyerLayout - Complete layout with built-in navigation for buyer pages
 */
const BuyerLayout = ({ 
  children, 
  showPromotionalBar = true, 
  backgroundColor = theme.colors.background.accent 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  const { unreadCount } = useMessages();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logged out successfully', 'success');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      showToast('Logout failed. Please try again.', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor }}>
      {/* Promotional Bar */}
      {showPromotionalBar && (
        <div style={{ backgroundColor: '#1e3a8a' }} className="text-white py-2 px-6">
          <div className="container mx-auto flex justify-between items-center text-sm">
            <div className="flex items-center space-x-2">
              <FiPhone size={14} />
              <span>University of Cebu Banilad</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Get 50% Off on Selected Items</span>
              <Link to="/buyer/dashboard" className="underline hover:no-underline">Shop Now</Link>
            </div>
            <div className="flex items-center space-x-4">
              <select className="bg-transparent border-none text-white text-sm focus:outline-none">
                <option value="en">Eng</option>
              </select>
              <select className="bg-transparent border-none text-white text-sm focus:outline-none">
                <option value="cebu">Cebu</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/buyer/dashboard" className="flex items-center space-x-2 flex-shrink-0">
              <img src="/chiflogo.png" alt="Chifere Cebu" className="h-8 w-8" />
              <span className="text-xl font-bold whitespace-nowrap">
                <span style={{ color: '#3B82F6' }}>ChiFere</span>
                <span style={{ color: '#10B981' }}> Cebu</span>
              </span>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <SearchAutocomplete className="w-full" />
            </div>

            {/* Navigation Items - Desktop */}
            <div className="hidden md:flex items-center space-x-6">
              {/* Notifications */}
              <Link
                to="/buyer/notifications"
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <FiBell className="w-5 h-5" />
                <span className="text-sm font-medium">Notifications</span>
              </Link>

              {/* Cart */}
              <Link
                to="/buyer/cart"
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors relative"
              >
                <FiShoppingCart className="w-5 h-5" />
                <span className="text-sm font-medium">Cart</span>
                {getCartCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getCartCount()}
                  </span>
                )}
              </Link>

              {/* Orders/Purchases */}
              <Link
                to="/buyer/purchase"
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <FiPackage className="w-5 h-5" />
                <span className="text-sm font-medium">Purchases</span>
              </Link>

              {/* Messages */}
              <Link
                to="/buyer/messages"
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors relative"
              >
                <FiMessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Messages</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* User Profile Dropdown */}
              {user && (
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors">
                    <img
                      src={user.avatar || '/default-avatar.png'}
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-sm font-medium">{user.name}</span>
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link
                      to="/buyer/account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiUser className="inline mr-2" />
                      My Account
                    </Link>
                    <Link
                      to="/buyer/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiSettings className="inline mr-2" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiLogOut className="inline mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-blue-600"
              >
                {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <SearchAutocomplete className="w-full mb-4" />
              
              <div className="space-y-2">
                <Link
                  to="/buyer/notifications"
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiBell className="w-5 h-5" />
                  <span>Notifications</span>
                </Link>
                
                <Link
                  to="/buyer/cart"
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiShoppingCart className="w-5 h-5" />
                  <span>Cart</span>
                  {getCartCount() > 0 && (
                    <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                      {getCartCount()}
                    </span>
                  )}
                </Link>
                
                <Link
                  to="/buyer/purchase"
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiPackage className="w-5 h-5" />
                  <span>Purchases</span>
                </Link>
                
                <Link
                  to="/buyer/messages"
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiMessageCircle className="w-5 h-5" />
                  <span>Messages</span>
                  {unreadCount > 0 && (
                    <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                
                <Link
                  to="/buyer/account"
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiUser className="w-5 h-5" />
                  <span>My Account</span>
                </Link>
                
                <Link
                  to="/buyer/settings"
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiSettings className="w-5 h-5" />
                  <span>Settings</span>
                </Link>
                
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md w-full"
                >
                  <FiLogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default BuyerLayout;
