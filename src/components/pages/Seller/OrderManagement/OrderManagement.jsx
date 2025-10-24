/**
 * Order Management Component
 * 
 * Allows sellers to manage their orders with status updates and real-time tracking.
 * 
 * Features:
 * - View all orders with filtering
 * - Update order status with confirmation
 * - Track payment status
 * - Real-time notifications
 * - Order statistics dashboard
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPackage, 
  FiClock, 
  FiTruck, 
  FiCheckCircle, 
  FiXCircle,
  FiFilter,
  FiSearch,
  FiRefreshCw,
  FiEye,
  FiEdit,
  FiDollarSign,
  FiUser,
  FiMapPin,
  FiPhone,
  FiMail
} from 'react-icons/fi';
import { useAuth } from '../../../../contexts/AuthContext';
import { useToast } from '../../../../components/Toast';
import orderService from '../../../../services/orderService';
import { supabase } from '../../../../config/supabase';
import notificationService from '../../../../services/notificationService';
import OrderStatusModal from './OrderStatusModal';
import OrderDetailsModal from './OrderDetailsModal';

const OrderManagement = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // State management
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  // Refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Load orders and stats on component mount
  useEffect(() => {
    if (user?.id) {
      loadOrders();
      loadStats();
    }
  }, [user?.id]);

  // Filter orders when filters change
  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, paymentFilter, searchTerm]);

  // Load orders from API
  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 [OrderManagement] Loading orders for seller:', { 
        userId: user.id, 
        userEmail: user.email,
        userType: user.user_type,
        sellerStatus: user.seller_status,
        fullUser: user
      });
      
      // Debug: Check what addresses exist in buyer_addresses table
      const { data: allAddresses, error: allAddressesError } = await supabase
        .from('buyer_addresses')
        .select('*')
        .limit(10);
      
      console.log('🔍 [OrderManagement] All addresses in buyer_addresses table:', {
        count: allAddresses?.length || 0,
        addresses: allAddresses,
        error: allAddressesError
      });
      
      // First, let's see what orders exist in the database at all
      const { data: allBuyerOrders, error: allBuyerOrdersError } = await supabase
        .from('buyer_orders')
        .select('*')
        .limit(10);
      
      const { data: allOrdersData, error: allOrdersError } = await supabase
        .from('orders')
        .select('*')
        .limit(10);
      
      console.log('🔍 [OrderManagement] ALL orders in buyer_orders table:', {
        count: allBuyerOrders?.length || 0,
        orders: allBuyerOrders,
        error: allBuyerOrdersError
      });
      
      console.log('🔍 [OrderManagement] ALL orders in orders table:', {
        count: allOrdersData?.length || 0,
        orders: allOrdersData,
        error: allOrdersError
      });
      
      // Show what seller_ids exist in the orders
      if (allOrdersData && allOrdersData.length > 0) {
        const sellerIds = [...new Set(allOrdersData.map(order => order.seller_id))];
        console.log('🔍 [OrderManagement] Seller IDs found in orders table:', sellerIds);
      }
      
      if (allBuyerOrders && allBuyerOrders.length > 0) {
        const sellerIds = [...new Set(allBuyerOrders.map(order => order.seller_id))];
        console.log('🔍 [OrderManagement] Seller IDs found in buyer_orders table:', sellerIds);
      }
      
      // Query both tables for seller's orders to ensure we don't miss any
      console.log('🔍 [OrderManagement] Looking for orders with seller_id:', user.id);
      
      const [buyerOrdersResult, ordersResult, allOrdersResult] = await Promise.all([
        supabase
          .from('buyer_orders')
          .select(`
            *,
            buyer_order_items (
              id,
              product_id,
              product_name,
              product_image,
              product_type,
              quantity,
              unit_price,
              total_price
            )
          `)
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('orders')
          .select(`
            *,
            order_items (
              id,
              product_id,
              product_name,
              product_image,
              product_type,
              quantity,
              unit_price,
              total_price
            )
          `)
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false }),
        // Also check for orders where seller_id might be null or different
        supabase
          .from('orders')
          .select(`
            *,
            order_items (
              id,
              product_id,
              product_name,
              product_image,
              product_type,
              quantity,
              unit_price,
              total_price
            )
          `)
          .is('seller_id', null)
          .order('created_at', { ascending: false })
      ]);

      console.log('🔍 [OrderManagement] Buyer orders result:', {
        data: buyerOrdersResult.data,
        error: buyerOrdersResult.error,
        count: buyerOrdersResult.data?.length || 0
      });

      console.log('🔍 [OrderManagement] Orders result:', {
        data: ordersResult.data,
        error: ordersResult.error,
        count: ordersResult.data?.length || 0
      });

      console.log('🔍 [OrderManagement] All orders result (null seller_id):', {
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
      
      console.log('🔍 [OrderManagement] Combined orders before deduplication:', {
        totalCount: allOrders.length,
        orders: allOrders
      });
      
      // Remove duplicates based on order_number
      const uniqueOrders = allOrders.filter((order, index, self) => 
        index === self.findIndex(o => o.order_number === order.order_number)
      );
      
      console.log('🔍 [OrderManagement] Final unique orders:', {
        uniqueCount: uniqueOrders.length,
        orders: uniqueOrders
      });
      
      // Fetch customer information and shipping addresses for each order
      const ordersWithCustomerInfo = await Promise.all(
        uniqueOrders.map(async (order) => {
          try {
            // Try to fetch customer data from user_profiles
            const { data: customerData, error: customerError } = await supabase
              .from('user_profiles')
              .select('id, display_name, email, phone')
              .eq('id', order.buyer_id)
              .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no data found
            
            // Try to fetch shipping address from buyer_addresses (get all addresses and use the first one)
            const { data: addressDataArray, error: addressError } = await supabase
              .from('buyer_addresses')
              .select('id, name, address_line_1, address_line_2, city, province, postal_code, phone')
              .eq('user_id', order.buyer_id)
              .limit(1); // Get only the first address
            
            const addressData = addressDataArray && addressDataArray.length > 0 ? addressDataArray[0] : null;
            
            if (customerError) {
              console.warn('⚠️ [OrderManagement] Customer fetch error for order:', order.order_number, customerError);
            }
            
            if (addressError) {
              console.warn('⚠️ [OrderManagement] Address fetch error for order:', order.order_number, addressError);
            }
            
            console.log('🔍 [OrderManagement] Customer data for order', order.order_number, ':', {
              customerData,
              addressData,
              addressDataArray,
              buyer_id: order.buyer_id
            });
            
            return {
              ...order,
              user_profiles: customerData || null,
              buyer_addresses: addressData || null
            };
          } catch (error) {
            console.warn('⚠️ [OrderManagement] Customer fetch error for order:', order.order_number, error);
            return {
              ...order,
              user_profiles: null,
              buyer_addresses: null
            };
          }
        })
      );
      
      setOrders(ordersWithCustomerInfo);
      console.log('📦 [OrderManagement] Orders loaded with customer info:', ordersWithCustomerInfo.length);
      
    } catch (error) {
      console.error('❌ [OrderManagement] Load orders error:', error);
      setError(error.message);
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load seller statistics
  const loadStats = async () => {
    try {
      const result = await orderService.getSellerOrderStats(user.id);
      
      if (result.success) {
        setStats(result.data);
        console.log('📊 [OrderManagement] Stats loaded:', result.data);
      }
    } catch (error) {
      console.error('❌ [OrderManagement] Load stats error:', error);
    }
  };

  // Filter orders based on current filters
  const filterOrders = () => {
    let filtered = [...orders];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order => order.payment_status === paymentFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.order_number.toLowerCase().includes(term) ||
        order.user_profiles?.display_name?.toLowerCase().includes(term) ||
        order.order_items?.some(item => 
          item.product_name.toLowerCase().includes(term)
        )
      );
    }

    setFilteredOrders(filtered);
  };

  // Refresh orders
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    await loadStats();
    setRefreshing(false);
    showToast('Orders refreshed', 'success');
  };

  // Open status update modal
  const handleStatusUpdate = (order) => {
    setSelectedOrder(order);
    setIsStatusModalOpen(true);
  };

  // Open order details modal
  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  // Handle status update from modal
  const handleStatusUpdateConfirm = async (newStatus, notes) => {
    try {
      const result = await orderService.updateOrderStatus(
        selectedOrder.id,
        newStatus,
        user.id,
        notes
      );

      if (result.success) {
        // Send notification to buyer
        await notificationService.notifyOrderStatusUpdate(
          selectedOrder.buyer_id,
          selectedOrder.order_number,
          newStatus,
          user.email || 'Seller'
        );

        showToast(`Order status updated to ${newStatus}`, 'success');
        await loadOrders();
        await loadStats();
        setIsStatusModalOpen(false);
        setSelectedOrder(null);
      } else {
        showToast(result.error, 'error');
      }
    } catch (error) {
      console.error('❌ [OrderManagement] Status update error:', error);
      showToast('Failed to update order status', 'error');
    }
  };

  // Get status icon and color
  const getStatusInfo = (status) => {
    const statusConfig = {
      'pending': { icon: FiClock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Pending' },
      'review': { icon: FiClock, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Review' },
      'delivered': { icon: FiTruck, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Delivered' },
      'completed': { icon: FiCheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Completed' },
      'cancelled': { icon: FiXCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Cancelled' }
    };
    return statusConfig[status] || statusConfig['pending'];
  };

  // Get payment status info
  const getPaymentStatusInfo = (status) => {
    const paymentConfig = {
      'pending': { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Pending' },
      'paid': { color: 'text-green-600', bg: 'bg-green-100', label: 'Paid' },
      'failed': { color: 'text-red-600', bg: 'bg-red-100', label: 'Failed' },
      'refunded': { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Refunded' }
    };
    return paymentConfig[status] || paymentConfig['pending'];
  };

  // Get next possible statuses
  const getNextStatuses = (currentStatus) => {
    const statusFlow = {
      'pending': ['review', 'cancelled'],
      'review': ['delivered', 'cancelled'],
      'delivered': ['completed'],
      'completed': [],
      'cancelled': []
    };
    return statusFlow[currentStatus] || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Orders</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadOrders}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
              <p className="text-gray-600 mt-1">Manage your orders and track their status</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FiPackage className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FiDollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₱{stats.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <FiClock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FiTruck className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Delivery</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.deliveredOrders}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="review">Review</option>
                <option value="processing">Processing</option>
                <option value="deliver">Deliver</option>
                <option value="delivered">Delivered</option>
                <option value="received">Received</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Payments</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <FiPackage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">
                {orders.length === 0 
                  ? "You don't have any orders yet." 
                  : "No orders match your current filters."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    const statusInfo = getStatusInfo(order.status);
                    const paymentInfo = getPaymentStatusInfo(order.payment_status);
                    const nextStatuses = getNextStatuses(order.status);
                    const StatusIcon = statusInfo.icon;

                    return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              #{order.order_number}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.payment_method.replace('_', ' ').toUpperCase()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <FiUser className="w-5 h-5 text-gray-500" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {order.user_profiles?.display_name || order.buyer_addresses?.name || 'Unknown Customer'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {order.user_profiles?.phone || order.buyer_addresses?.phone || order.shipping_contact?.phone || 'No phone'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {(order.order_items?.length || order.buyer_order_items?.length || 0)} item(s)
                          </div>
                          <div className="text-sm text-gray-500">
                            {(order.order_items?.[0]?.product_name || order.buyer_order_items?.[0]?.product_name) || 'No items'}
                            {((order.order_items?.length || order.buyer_order_items?.length || 0) > 1) && ` +${(order.order_items?.length || order.buyer_order_items?.length || 0) - 1} more`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ₱{parseFloat(order.total_amount).toLocaleString()}
                          </div>
                          {order.shipping_fee > 0 && (
                            <div className="text-sm text-gray-500">
                              +₱{parseFloat(order.shipping_fee).toLocaleString()} shipping
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentInfo.bg} ${paymentInfo.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentInfo.bg} ${paymentInfo.color}`}>
                            {paymentInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewDetails(order)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="View Details"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            {nextStatuses.length > 0 && (
                              <button
                                onClick={() => handleStatusUpdate(order)}
                                className="text-green-600 hover:text-green-900 p-1"
                                title="Update Status"
                              >
                                <FiEdit className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modals */}
        <AnimatePresence>
          {isStatusModalOpen && selectedOrder && (
            <OrderStatusModal
              order={selectedOrder}
              isOpen={isStatusModalOpen}
              onClose={() => {
                setIsStatusModalOpen(false);
                setSelectedOrder(null);
              }}
              onConfirm={handleStatusUpdateConfirm}
            />
          )}

          {isDetailsModalOpen && selectedOrder && (
            <OrderDetailsModal
              order={selectedOrder}
              isOpen={isDetailsModalOpen}
              onClose={() => {
                setIsDetailsModalOpen(false);
                setSelectedOrder(null);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OrderManagement;
