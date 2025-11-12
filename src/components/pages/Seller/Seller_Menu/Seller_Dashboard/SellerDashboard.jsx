import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SellerLayout from '../Seller_Layout/SellerLayout';
import { theme } from '../../../../../styles/designSystem';
import { FiPackage, FiEye, FiTrendingUp, FiShoppingCart, FiMessageSquare, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../../../../../contexts/AuthContext';
import { supabase } from '../../../../../config/supabase';
import itemService from '../../../../../services/itemService';

// Peso Icon Component
const PesoIcon = ({ className, style }) => (
  <span className={className} style={style}>₱</span>
);

const SellerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalProducts: 0,
    totalViews: 0,
    activeOrders: 0,
    pendingOffers: 0,
    messages: 0
  });

  const [recentProducts, setRecentProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load dashboard data
  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user]);

  // Load all dashboard data
  const loadDashboardData = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Load products
      await loadProducts();

      // Load orders and calculate earnings
      await loadOrders();

      // Load additional stats (messages, offers, etc.)
      await loadAdditionalStats();
    } catch (err) {
      console.error('Load dashboard data error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Load products
  const loadProducts = async () => {
    try {
      console.log('🔄 [SellerDashboard] Loading products for seller:', user.id);
      const result = await itemService.getItemsBySeller(user.id, 'active');

      if (result.success) {
        const products = result.data;
        console.log('✅ [SellerDashboard] Products loaded:', products.length);

        // Calculate total views
        const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);

        // Get recent products (last 3)
        const recent = products.slice(0, 3);

        setRecentProducts(recent);

        setStats(prev => ({
          ...prev,
          totalProducts: products.length,
          totalViews: totalViews
        }));
      } else {
        console.error('❌ [SellerDashboard] Failed to load products:', result.error);
        setError(result.error || 'Failed to load products');
      }
    } catch (err) {
      console.error('❌ [SellerDashboard] Load products error:', err);
      setError('Failed to load products');
    }
  };

  // Load orders
  const loadOrders = async () => {
    try {
      console.log('🔄 [SellerDashboard] Loading orders for seller:', user.id);
      
      // Query both tables for seller's orders to ensure we don't miss any
      const [buyerOrdersResult, ordersResult, allOrdersResult] = await Promise.all([
        supabase
          .from('buyer_orders')
          .select('*')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('orders')
          .select('*')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
        // Also check for orders where seller_id might be null or different
        supabase
          .from('orders')
          .select('*')
          .is('seller_id', null)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      console.log('🔍 [SellerDashboard] Buyer orders result:', {
        data: buyerOrdersResult.data,
        error: buyerOrdersResult.error,
        count: buyerOrdersResult.data?.length || 0
      });

      console.log('🔍 [SellerDashboard] Orders result:', {
        data: ordersResult.data,
        error: ordersResult.error,
        count: ordersResult.data?.length || 0
      });

      console.log('🔍 [SellerDashboard] All orders result (null seller_id):', {
        data: allOrdersResult.data,
        error: allOrdersResult.error,
        count: allOrdersResult.data?.length || 0
      });

      // Combine orders from all sources
      const allOrders = [
        ...(buyerOrdersResult.data || []),
        ...(ordersResult.data || []),
        ...(allOrdersResult.data || [])
      ];
      
      console.log('🔍 [SellerDashboard] Combined orders before deduplication:', {
        totalCount: allOrders.length,
        orders: allOrders
      });
      
      // Remove duplicates based on order_number
      const uniqueOrders = allOrders.filter((order, index, self) => 
        index === self.findIndex(o => o.order_number === order.order_number)
      );
      
      console.log('🔍 [SellerDashboard] Final unique orders:', {
        uniqueCount: uniqueOrders.length,
        orders: uniqueOrders
      });
      
      const orders = uniqueOrders;
      const error = buyerOrdersResult.error || ordersResult.error || allOrdersResult.error;

      if (error) {
        console.error('❌ [SellerDashboard] Orders query error:', error);
        throw error;
      }

      console.log('✅ [SellerDashboard] Orders loaded:', orders?.length || 0);

      let totalEarnings = 0;
      let activeOrdersCount = 0;

      if (orders && orders.length > 0) {
        orders.forEach((order) => {
          // Calculate earnings from completed/delivered orders
          if (order.status === 'completed' || order.status === 'delivered') {
            totalEarnings += order.total_amount || 0;
          }

          // Count active orders (processing, shipped, pending)
          if (['processing', 'shipped', 'pending', 'confirmed'].includes(order.status)) {
            activeOrdersCount++;
          }
        });
      }

      setRecentOrders(orders?.slice(0, 3) || []);

      setStats(prev => ({
        ...prev,
        totalEarnings: totalEarnings,
        activeOrders: activeOrdersCount
      }));
    } catch (err) {
      console.error('❌ [SellerDashboard] Load orders error:', err);
      // If table doesn't exist yet or permission error, just set to 0
      setStats(prev => ({
        ...prev,
        totalEarnings: 0,
        activeOrders: 0
      }));
    }
  };

  // Load additional stats
  const loadAdditionalStats = async () => {
    try {
      console.log('🔄 [SellerDashboard] Loading additional stats for seller:', user.id);
      
      // Query pending offers from offers table
      const { data: offers, error: offersError } = await supabase
        .from('offers')
        .select('*')
        .eq('seller_id', user.id)
        .eq('status', 'pending');

      if (offersError) {
        console.error('❌ [SellerDashboard] Offers query error:', offersError);
      }

      const pendingOffers = offers?.length || 0;

      // Query unread messages from conversations table
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('seller_id', user.id);

      if (convError) {
        console.error('❌ [SellerDashboard] Conversations query error:', convError);
      }

      let unreadCount = 0;
      if (conversations && conversations.length > 0) {
        conversations.forEach((conv) => {
          // Check if there are unread messages for this seller
          if (conv.unread_count && typeof conv.unread_count === 'object') {
            unreadCount += conv.unread_count[user.id] || 0;
          }
        });
      }

      console.log('✅ [SellerDashboard] Additional stats loaded - Offers:', pendingOffers, 'Messages:', unreadCount);

      setStats(prev => ({
        ...prev,
        pendingOffers: pendingOffers,
        messages: unreadCount
      }));
    } catch (err) {
      console.error('❌ [SellerDashboard] Load additional stats error:', err);
      // If tables don't exist or permission error, just set to 0
      setStats(prev => ({
        ...prev,
        pendingOffers: 0,
        messages: 0
      }));
    }
  };

  const StatCard = ({ icon: Icon, title, value, color = 'blue', trend = null }) => (
    <div className="card-base p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">
            {typeof value === 'number' && title.includes('Earnings') ? `₱${value.toLocaleString()}` : value}
          </p>
          {trend && (
            <div className="flex items-center mt-2">
              <FiTrendingUp className={`w-4 h-4 mr-1 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`} />
              <span className={`text-sm ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            </div>
          )}
        </div>
        <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
             style={{ backgroundColor: theme.colors[color][100] }}>
          {typeof Icon === 'function' && Icon.name === 'PesoIcon' ? (
            <Icon className="text-2xl font-bold" style={{ color: theme.colors[color][500] }} />
          ) : (
            <Icon className="w-6 h-6" style={{ color: theme.colors[color][500] }} />
          )}
        </div>
      </div>
    </div>
  );

  const ProductCard = ({ product }) => {
    const handleProductClick = () => {
      console.log('🖱️ ProductCard clicked, navigating to /seller/products');
      console.log('Current user:', user);
      console.log('User role:', user?.role);
      console.log('User type:', user?.user_type);
      console.log('Full user object:', JSON.stringify(user, null, 2));
      navigate('/seller/products');
    };

    return (
      <div 
        className="card-base p-4 hover:shadow-lg transition-shadow duration-300 cursor-pointer"
        onClick={handleProductClick}
      >
      <div className="flex items-center space-x-4">
        <img
          src={product.primary_image || (product.images && product.images[0]) || '/placeholder-product.svg'}
          alt={product.name}
          className="w-16 h-16 rounded-lg object-cover"
          onError={(e) => {
            e.target.src = '/placeholder-product.svg';
          }}
        />
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800 mb-1">{product.name}</h4>
          <p className="text-sm text-gray-600 mb-2">
            {product.price === 0 || product.is_sell_only === false ? 'Barter Only' : `₱${product.price?.toLocaleString()}`}
          </p>
          <div className="flex items-center justify-between">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              product.status === 'active' ? 'bg-green-100 text-green-700' :
              product.status === 'sold' ? 'bg-blue-100 text-blue-700' :
              'bg-orange-100 text-orange-700'
            }`}>
              {product.status}
            </span>
            <div className="flex items-center text-sm text-gray-500">
              <FiEye className="w-4 h-4 mr-1" />
              {product.views || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  };

  const OrderCard = ({ order }) => {
    // Format date
    const orderDate = order.created_at
      ? new Date(order.created_at).toLocaleDateString()
      : 'Recently';

    return (
      <div className="card-base p-4 hover:shadow-lg transition-shadow duration-300">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-semibold text-gray-800">{order.order_number || order.id}</h4>
            <p className="text-sm text-gray-600">Order #{order.order_number || order.id}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
            order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
            order.status === 'barter' ? 'bg-orange-100 text-orange-700' :
            order.status === 'delivered' || order.status === 'completed' ? 'bg-green-100 text-green-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {order.status}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              {order.items && order.items.length > 0
                ? order.items[0].product_name || 'Order'
                : 'Order'}
            </p>
            <p className="font-semibold" style={{ color: theme.colors.primary[600] }}>
              {order.total_amount === 0 || order.order_type === 'barter'
                ? 'Barter'
                : `₱${(order.total_amount || 0).toLocaleString()}`}
            </p>
          </div>
          <p className="text-xs text-gray-500">{orderDate}</p>
        </div>
      </div>
    );
  };

  return (
    <SellerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <button
            onClick={loadDashboardData}
            className="btn-base btn-md btn-outline"
            disabled={loading}
          >
            <FiRefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <StatCard
            icon={PesoIcon}
            title="Total Earnings"
            value={stats.totalEarnings}
            color="primary"
          />
          <StatCard
            icon={FiPackage}
            title="Products Listed"
            value={stats.totalProducts}
            color="secondary"
          />
          <StatCard
            icon={FiEye}
            title="Total Views"
            value={stats.totalViews}
            color="info"
          />
          <StatCard
            icon={FiShoppingCart}
            title="Active Orders"
            value={stats.activeOrders}
            color="success"
          />
          <StatCard
            icon={FiTrendingUp}
            title="Pending Offers"
            value={stats.pendingOffers}
            color="warning"
          />
          <StatCard
            icon={FiMessageSquare}
            title="New Messages"
            value={stats.messages}
            color="error"
          />
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="card-base p-12 text-center">
            <FiRefreshCw className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-spin" />
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Products */}
            <div className="card-base p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Recent Products</h2>
                <button
                  onClick={() => {
                    console.log('🔄 [SellerDashboard] Navigating to products page...');
                    navigate('/seller/products');
                  }}
                  className="text-sm font-medium"
                  style={{ color: theme.colors.primary[500] }}
                >
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {recentProducts.length > 0 ? (
                  recentProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FiPackage className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 text-sm">No products yet</p>
                    <button
                      onClick={() => navigate('/seller/products')}
                      className="btn-base btn-sm btn-primary mt-4"
                    >
                      Add Product
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="card-base p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
                <button
                  onClick={() => window.location.href = '/seller/orders'}
                  className="text-sm font-medium"
                  style={{ color: theme.colors.primary[500] }}
                >
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FiShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 text-sm">No orders yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </SellerLayout>
  );
};

export default SellerDashboard;
