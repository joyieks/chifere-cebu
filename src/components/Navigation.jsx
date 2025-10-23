import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiShoppingCart, FiHeart, FiUser, FiLogOut, FiMenu, FiX, FiBell, FiPhone, FiMessageCircle, FiSettings, FiPackage, FiHome, FiBarChart2 } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useMessages } from '../contexts/MessageContext';
import { useToast } from './Toast';
import theme from '../styles/designSystem';
import SearchAutocomplete from './SearchAutocomplete';

const Navigation = ({ showPromotionalBar = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, switchRole } = useAuth();
  const { cart } = useCart();
  const { unreadCount } = useMessages();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

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

  const handleRoleSwitch = async (newRole) => {
    const result = await switchRole(newRole);

    if (result.success) {
      showToast(`Switched to ${newRole} mode`, 'success');
      const dashboardPath = newRole === 'seller' ? '/seller/dashboard' : '/buyer/dashboard';
      navigate(dashboardPath);
    } else {
      // Handle KYC verification errors
      if (result.error === 'kyc_not_verified') {
        showToast(result.message, 'error');

        // Redirect to KYC submission page based on status
        if (result.kycStatus === 'none' || result.kycStatus === 'rejected') {
          setTimeout(() => {
            navigate('/seller/settings?tab=verification');
          }, 2000);
        }
      } else if (result.error === 'no_seller_account') {
        showToast(result.message, 'warning');
        setTimeout(() => {
          navigate('/signup?role=seller');
        }, 2000);
      } else if (result.error === 'no_buyer_account') {
        showToast(result.message, 'warning');
        setTimeout(() => {
          navigate('/signup?role=buyer');
        }, 2000);
      } else {
        showToast(result.message || 'Failed to switch roles', 'error');
      }
    }
  };

  const handleSuggestionSelected = (suggestion) => {
    // Custom handling for suggestion selection if needed
    // The SearchAutocomplete component already handles navigation by default
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-full">
      {/* Promotional Bar */}
      {showPromotionalBar && (
        <div style={{ backgroundColor: theme.colors.primary[800] }} className="text-white py-2 px-6">
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
              <select 
                className="bg-transparent border-none text-white text-sm focus:outline-none"
                style={{ backgroundColor: 'transparent' }}
              >
                <option value="en">Eng</option>
              </select>
              <select 
                className="bg-transparent border-none text-white text-sm focus:outline-none"
                style={{ backgroundColor: 'transparent' }}
              >
                <option value="cebu">Cebu</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="bg-white shadow-md sticky top-0" style={{ zIndex: theme.zIndex.sticky }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4" style={{ height: theme.components.navigation.height }}>
          {/* Logo */}
          <Link 
            to={user ? (user.role === 'buyer' ? '/buyer/dashboard' : '/seller/dashboard') : '/'} 
            className="flex items-center space-x-2 flex-shrink-0"
          >
            <img src="/chiflogo.png" alt="Chifere Cebu" className="h-8 w-8" />
            <span className="text-xl font-bold whitespace-nowrap">
              <span style={{ color: '#3B82F6' }}>ChiFere</span>
              <span style={{ color: '#10B981' }}> Cebu</span>
            </span>
          </Link>

          {/* Search Bar - Only show for buyers */}
          {(!user || user.role === 'buyer') && (
            <div className="hidden lg:flex flex-1 max-w-2xl">
              <SearchAutocomplete 
                onSuggestionSelected={handleSuggestionSelected}
                className="w-full"
              />
            </div>
          )}

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4 ml-auto">
            {user ? (
              <>
                {user.role === 'buyer' && (
                  <>
                    {/* BUYER NAVIGATION - ALL 4 ITEMS */}
                    <Link
                      to="/buyer/notifications"
                      className="text-gray-700 hover:text-blue-600 flex items-center gap-2"
                    >
                      <FiBell className="w-5 h-5" />
                      <span className="text-sm font-medium">Notifications</span>
                    </Link>

                    <Link
                      to="/buyer/cart"
                      className="text-gray-700 hover:text-blue-600 relative flex items-center gap-2"
                    >
                      <FiShoppingCart className="w-5 h-5" />
                      <span className="text-sm font-medium">Cart</span>
                      {/* Cart count badge */}
                      {user?.role === 'buyer' && cart?.length > 0 && (
                        <span 
                          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold"
                        >
                          {cart.length}
                        </span>
                      )}
                    </Link>

                    <Link
                      to="/buyer/purchase"
                      className="text-gray-700 hover:text-blue-600 flex items-center gap-2"
                    >
                      <FiPackage className="w-5 h-5" />
                      <span className="text-sm font-medium">Purchases</span>
                    </Link>

                    <Link
                      to="/buyer/messages"
                      className="text-gray-700 hover:text-blue-600 relative flex items-center gap-2"
                    >
                      <FiMessageCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Messages</span>
                      {/* Unread message count badge */}
                      {unreadCount > 0 && (
                        <span 
                          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold"
                        >
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}
                
                {user.role === 'seller' && (
                  <>
                    {/* Seller Navigation */}
                    <Link
                      to="/seller/dashboard"
                      className="text-gray-700 hover:text-blue-600 flex items-center gap-2"
                    >
                      <FiHome className="w-5 h-5" />
                      <span className="text-sm">Dashboard</span>
                    </Link>

                    <Link
                      to="/seller/products"
                      className="text-gray-700 hover:text-blue-600 flex items-center gap-2"
                    >
                      <FiPackage className="w-5 h-5" />
                      <span className="text-sm">Products</span>
                    </Link>

                    <Link
                      to="/seller/orders"
                      className="text-gray-700 hover:text-blue-600 flex items-center gap-2"
                    >
                      <FiShoppingCart className="w-5 h-5" />
                      <span className="text-sm">Orders</span>
                    </Link>

                    <Link
                      to="/seller/analytics"
                      className="text-gray-700 hover:text-blue-600 flex items-center gap-2"
                    >
                      <FiBarChart2 className="w-5 h-5" />
                      <span className="text-sm">Analytics</span>
                    </Link>

                    <Link
                      to="/seller/messages"
                      className="text-gray-700 hover:text-blue-600 flex items-center gap-2"
                    >
                      <FiMessageCircle className="w-5 h-5" />
                      <span className="text-sm">Messages</span>
                    </Link>
                  </>
                )}
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="hidden lg:block">{user.name}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    {/* Role Status */}
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-500">Current Mode</p>
                      <p className="text-sm font-medium text-gray-800 capitalize">
                        {user.role} Mode
                      </p>
                    </div>

                    {/* Account Links */}
                    <Link
                      to={user.role === 'buyer' ? '/buyer/account' : '/seller/profile'}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiUser className="inline mr-2 w-4 h-4" />
                      My Account
                    </Link>
                    
                    {user.role === 'buyer' && (
                      <Link
                        to="/buyer/purchase"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        My Purchases
                      </Link>
                    )}

                    <Link
                      to={user.role === 'buyer' ? '/buyer/settings' : '/seller/settings'}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiSettings className="inline mr-2 w-4 h-4" />
                      Settings
                    </Link>

                    {/* Role Switching */}
                    {user.canSwitchRoles && (
                      <>
                        <div className="border-t border-gray-100 my-1"></div>
                        <div className="px-4 py-2">
                          <p className="text-xs text-gray-500 mb-2">Switch Mode</p>
                          {user.role === 'buyer' ? (
                            <button
                              onClick={() => handleRoleSwitch('seller')}
                              className="w-full text-left px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <FiShoppingCart className="inline mr-2 w-4 h-4" />
                              Seller Mode
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRoleSwitch('buyer')}
                              className="w-full text-left px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <FiUser className="inline mr-2 w-4 h-4" />
                              Buyer Mode
                            </button>
                          )}
                        </div>
                      </>
                    )}

                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiLogOut className="inline mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>


      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-white border-t border-gray-200"
        >
          {/* Mobile Search Bar - Only show for buyers */}
          {(!user || user.role === 'buyer') && (
            <div className="px-4 py-4 border-b border-gray-200">
              <SearchAutocomplete 
                onSuggestionSelected={handleSuggestionSelected}
                className="w-full"
              />
            </div>
          )}
          
          <div className="px-4 py-2 space-y-1">
            {user ? (
              <>
                {user.role === 'buyer' ? (
                  <>
                    <Link
                      to="/buyer/notifications"
                      className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FiBell className="inline mr-2 w-4 h-4" />
                      Notifications
                    </Link>
                    <Link
                      to="/buyer/cart"
                      className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md relative"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FiShoppingCart className="inline mr-2 w-4 h-4" />
                      Cart
                      {cart?.length > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                          {cart.length}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/buyer/purchase"
                      className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FiPackage className="inline mr-2 w-4 h-4" />
                      My Purchases
                    </Link>
                    <Link
                      to="/buyer/messages"
                      className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md relative"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FiMessageCircle className="inline mr-2 w-4 h-4" />
                      Messages
                      {unreadCount > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/buyer/account"
                      className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FiUser className="inline mr-2 w-4 h-4" />
                      My Account
                    </Link>
                    <Link
                      to="/buyer/settings"
                      className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FiSettings className="inline mr-2 w-4 h-4" />
                      Settings
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/seller/dashboard"
                      className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FiHome className="inline mr-2 w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link
                      to="/seller/products"
                      className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FiPackage className="inline mr-2 w-4 h-4" />
                      Products
                    </Link>
                    <Link
                      to="/seller/orders"
                      className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FiShoppingCart className="inline mr-2 w-4 h-4" />
                      Orders
                    </Link>
                    <Link
                      to="/seller/analytics"
                      className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FiBarChart2 className="inline mr-2 w-4 h-4" />
                      Analytics
                    </Link>
                    <Link
                      to="/seller/messages"
                      className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FiMessageCircle className="inline mr-2 w-4 h-4" />
                      Messages
                    </Link>
                    <Link
                      to="/seller/analytics"
                      className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Analytics
                    </Link>
                    <Link
                      to="/seller/settings"
                      className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Settings
                    </Link>
                  </>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </motion.div>
      )}
      </nav>
    </div>
  );
};

export default Navigation; 
