import React, { useState, useEffect } from 'react';
import Navigation from '../../../../Navigation';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../../../contexts/AuthContext';
import itemService from '../../../../../services/itemService';
import { theme } from '../../../../../styles/designSystem';
import { 
  FiHome, 
  FiPackage, 
  FiShoppingCart, 
  FiBarChart2, 
  FiMessageSquare, 
  FiSettings, 
  FiUser,
  FiTrendingUp,
  FiPlus
} from 'react-icons/fi';

/**
 * SellerLayout - Unified layout component for seller pages
 * 
 * This component provides a consistent layout for seller-specific pages
 * using the unified Navigation component for role switching and logout.
 * Now matches the buyer layout pattern for consistency.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string} props.backgroundColor - Background color for the main content
 */
const SellerLayout = ({ 
  children, 
  backgroundColor = theme.colors.background.secondary 
}) => {
  const location = useLocation();
  const { user } = useAuth();
  const [productCount, setProductCount] = useState(0);

  // Fetch actual product count
  useEffect(() => {
    const fetchProductCount = async () => {
      if (!user?.id) return;
      
      try {
        const result = await itemService.getItemsBySeller(user.id, 'active');
        if (result.success) {
          setProductCount(result.data?.length || 0);
        }
      } catch (error) {
        console.error('Error fetching product count:', error);
      }
    };

    fetchProductCount();
  }, [user]);

  // All seller menu items for header recognition
  const sellerMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome, path: '/seller/dashboard' },
    { id: 'products', label: 'Products', icon: FiPackage, path: '/seller/products', badge: productCount },
    { id: 'orders', label: 'Orders', icon: FiShoppingCart, path: '/seller/orders', badge: 7 },
    { id: 'analytics', label: 'Analytics', icon: FiBarChart2, path: '/seller/analytics' },
    { id: 'messages', label: 'Messages', icon: FiMessageSquare, path: '/seller/messages', badge: 3 },
    { id: 'profile', label: 'Profile', icon: FiUser, path: '/seller/profile' },
    { id: 'settings', label: 'Settings', icon: FiSettings, path: '/seller/settings' }
  ];


  const currentPage = sellerMenuItems.find(item => item.path === location.pathname);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor }}>
      {/* Unified Navigation with role switching and logout */}
      <Navigation showPromotionalBar={false} />

      {/* Seller-specific Header Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" 
                   style={{ backgroundColor: theme.colors.primary[100] }}>
                {currentPage?.icon && (
                  <currentPage.icon className="w-5 h-5" style={{ color: theme.colors.primary[600] }} />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {currentPage?.label || 'Seller Portal'}
                </h1>
                <p className="text-sm text-gray-600">Manage your ChiFere store</p>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Main Content Area */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default SellerLayout;