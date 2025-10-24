/**
 * My Purchase Component
 * 
 * Shows buyer's order history and current orders with real-time status updates.
 * 
 * Features:
 * - View all orders with filtering
 * - Track order status in real-time
 * - View order details
 * - Order history
 * - Payment status tracking
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  FiDollarSign,
  FiUser,
  FiMapPin,
  FiPhone,
  FiMail,
  FiShoppingBag,
  FiCreditCard,
  FiX
} from 'react-icons/fi';
import { useAuth } from '../../../../../../contexts/AuthContext';
import { useToast } from '../../../../../../components/Toast';
import orderService from '../../../../../../services/orderService';
import checkoutService from '../../../../../../services/checkoutService';
import { supabase } from '../../../../../../config/supabase';

const MyPurchase = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // State management
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);
  
  // Cancel order modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Check for order success message
  useEffect(() => {
    if (location.state?.orderSuccess) {
      // Temporarily disable toast to prevent infinite loop
      console.log('✅ [MyPurchase] Order placed successfully!', {
        orderId: location.state.orderId,
        paymentMethod: location.state.paymentMethod,
        transactionNumber: location.state.transactionNumber
      });
      
      // Refresh orders to show the new order
      console.log('🔄 [MyPurchase] Refreshing orders after new order creation...');
      loadOrders();
      
      // Clear the state to prevent showing the message again
      navigate(location.pathname, { replace: true });
    }
  }, [location.state?.orderSuccess, navigate, location.pathname]);

  // Load orders on component mount
  useEffect(() => {
    if (user?.id) {
      loadOrders();
    }
  }, [user?.id]);

  // Filter orders when filters change
  useEffect(() => {
    filterOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, statusFilter, paymentFilter, searchTerm]);

  // Load orders from API
  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 [MyPurchase] Loading orders for user:', { 
        userId: user?.id, 
        userEmail: user?.email,
        userType: user?.user_type,
        userRole: user?.role,
        fullUser: user
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
      
      console.log('🔍 [MyPurchase] ALL orders in buyer_orders table:', {
        count: allBuyerOrders?.length || 0,
        orders: allBuyerOrders,
        error: allBuyerOrdersError
      });
      
      console.log('🔍 [MyPurchase] ALL orders in orders table:', {
        count: allOrdersData?.length || 0,
        orders: allOrdersData,
        error: allOrdersError
      });
      
      if (!user?.id) {
        console.warn('⚠️ [MyPurchase] No user ID available');
        setLoading(false);
        return;
      }

      // Try to get orders from both tables to ensure we don't miss any
      const [buyerOrdersResult, ordersResult] = await Promise.all([
        orderService.getOrders(user.id, 'buyer'), // buyer_orders table
        checkoutService.getUserOrders(user.id, 'buyer') // orders table
      ]);
      
      console.log('🔍 [MyPurchase] Buyer orders result:', {
        success: buyerOrdersResult.success,
        orders: buyerOrdersResult.orders,
        count: buyerOrdersResult.orders?.length || 0,
        error: buyerOrdersResult.error
      });

      console.log('🔍 [MyPurchase] Orders result:', {
        success: ordersResult.success,
        orders: ordersResult.orders,
        count: ordersResult.orders?.length || 0,
        error: ordersResult.error
      });
      
      // Combine orders from both sources
      const allOrders = [
        ...(buyerOrdersResult.success ? buyerOrdersResult.orders || [] : []),
        ...(ordersResult.success ? ordersResult.orders || [] : [])
      ];
      
      console.log('🔍 [MyPurchase] Combined orders before deduplication:', {
        totalCount: allOrders.length,
        orders: allOrders
      });
      
      // Remove duplicates based on order_number
      const uniqueOrders = allOrders.filter((order, index, self) => 
        index === self.findIndex(o => o.order_number === order.order_number)
      );
      
      console.log('🔍 [MyPurchase] Final unique orders:', {
        uniqueCount: uniqueOrders.length,
        orders: uniqueOrders
      });
      
      const result = { success: true, orders: uniqueOrders };
      console.log('🔍 [MyPurchase] OrderService result:', result);

      if (result.success) {
        setOrders(result.orders || []);
        console.log('📦 [MyPurchase] Orders loaded successfully:', {
          count: result.orders?.length || 0,
          orders: result.orders
        });
        
        // Debug each order's items
        result.orders?.forEach((order, index) => {
          console.log(`🔍 [MyPurchase] Order ${index + 1} details:`, {
            orderNumber: order.order_number,
            orderId: order.id,
            itemsCount: order.order_items?.length || 0,
            items: order.order_items,
            hasItems: !!order.order_items,
            itemsArray: Array.isArray(order.order_items)
          });
        });
      } else {
        setError(result.error);
        console.error('❌ [MyPurchase] Failed to load orders:', result.error);
      }
    } catch (error) {
      console.error('❌ [MyPurchase] Load orders error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
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
        order.payment_method.toLowerCase().includes(term)
      );
    }

    setFilteredOrders(filtered);
  };

  // Refresh orders
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
    console.log('✅ Orders refreshed');
  };

  // View order details
  const handleViewDetails = (order) => {
    console.log('🔍 [MyPurchase] Viewing order details:', {
      orderId: order.id,
      orderNumber: order.order_number,
      itemsCount: order.order_items?.length || 0,
      items: order.order_items,
      fullOrder: order
    });
    navigate(`/buyer/purchase/order/${order.id}`, { state: { order } });
  };

  // Show cancel order modal
  const handleCancelOrder = (order) => {
    setOrderToCancel(order);
    setShowCancelModal(true);
  };

  // Confirm cancel order
  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;

    // Validate reason is provided
    if (!cancelReason.trim()) {
      showToast('Please provide a reason for cancellation', 'error');
      return;
    }

    try {
      console.log('🚫 [MyPurchase] Cancelling order:', orderToCancel.id, orderToCancel.order_number);
      
      const result = await orderService.cancelOrder(orderToCancel.id, cancelReason.trim());
      
      if (result.success) {
        console.log('✅ [MyPurchase] Order cancelled successfully');
        showToast('Order cancelled successfully', 'success');
        // Refresh orders to show updated status
        await loadOrders();
      } else {
        console.error('❌ [MyPurchase] Failed to cancel order:', result.error);
        showToast('Failed to cancel order. Please try again.', 'error');
      }
    } catch (error) {
      console.error('❌ [MyPurchase] Cancel order error:', error);
      showToast('Failed to cancel order. Please try again.', 'error');
    } finally {
      setShowCancelModal(false);
      setOrderToCancel(null);
      setCancelReason('');
    }
  };

  // Close cancel modal
  const closeCancelModal = () => {
    setShowCancelModal(false);
    setOrderToCancel(null);
    setCancelReason('');
  };

  // Get status icon and color
  const getStatusInfo = (status) => {
    const statusConfig = {
      'pending': { icon: FiClock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Pending' },
      'review': { icon: FiEye, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Review' },
      'delivered': { icon: FiTruck, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Delivered' },
      'completed': { icon: FiCheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Complete' },
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

  // Get payment method icon
  const getPaymentMethodIcon = (method) => {
    const methodConfig = {
      'cod': FiShoppingBag,
      'gcash': FiCreditCard,
      'maya': FiCreditCard,
      'grabpay': FiCreditCard,
      'online_banking': FiCreditCard,
      'qr_ph': FiCreditCard
    };
    return methodConfig[method] || FiCreditCard;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading your orders...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">My Purchases</h1>
              <p className="text-gray-600 mt-1">Track your orders and view order history</p>
              </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/buyer/cart')}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FiShoppingBag className="w-4 h-4" />
                <span>Continue Shopping</span>
              </button>
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
        </div>

        {/* Success Message */}
        {location.state?.orderSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg"
          >
            <div className="flex items-center">
              <FiCheckCircle className="w-5 h-5 mr-2" />
              <span className="font-semibold">Order placed successfully!</span>
            </div>
            {location.state.transactionNumber && (
              <p className="mt-1 text-sm">
                Transaction Number: <span className="font-mono">{location.state.transactionNumber}</span>
              </p>
            )}
          </motion.div>
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
                <option value="delivered">Delivered</option>
                <option value="completed">Complete</option>
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
              <p className="text-gray-600 mb-4">
                {orders.length === 0 
                  ? "You haven't placed any orders yet." 
                  : "No orders match your current filters."
                }
              </p>
              {orders.length === 0 && (
              <button 
                  onClick={() => navigate('/buyer/cart')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Shopping
              </button>
              )}
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
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
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
                    const PaymentIcon = getPaymentMethodIcon(order.payment_method);
                    const StatusIcon = statusInfo.icon;

                    return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              #{order.order_number}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.order_items?.length || 0} item(s)
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            {order.order_items && order.order_items.length > 0 ? (
                              order.order_items.slice(0, 2).map((item, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <div className="flex-shrink-0">
                                    {item.product_image ? (
                                      <img
                                        src={item.product_image}
                                        alt={item.product_name}
                                        className="w-8 h-8 object-cover rounded"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'flex';
                                        }}
                                      />
                                    ) : null}
                                    <div 
                                      className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center"
                                      style={{ display: item.product_image ? 'none' : 'flex' }}
                                    >
                                      <FiPackage className="w-4 h-4 text-gray-400" />
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {item.product_name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Qty: {item.quantity} × ₱{parseFloat(item.unit_price || 0).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-gray-500">No items</div>
                            )}
                            {order.order_items && order.order_items.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{order.order_items.length - 2} more item(s)
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <PaymentIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {order.payment_method.replace('_', ' ').toUpperCase()}
                      </div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentInfo.bg} ${paymentInfo.color}`}>
                                {paymentInfo.label}
                              </span>
                    </div>
                  </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ₱{parseFloat(order.total_amount || 0).toLocaleString()}
                          </div>
                          {order.delivery_fee > 0 && (
                            <div className="text-sm text-gray-500">
                              +₱{parseFloat(order.delivery_fee).toLocaleString()} delivery
                        </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewDetails(order)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="View Details"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                      {(order.status === 'pending' || order.status === 'review') && (
                        <button
                          onClick={() => handleCancelOrder(order)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Cancel Order"
                        >
                          <FiX className="w-4 h-4" />
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
      </div>

      {/* Cancel Order Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
            onClick={closeCancelModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <FiXCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Cancel Order
                  </h3>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-500">
                  Are you sure you want to cancel order{' '}
                  <span className="font-semibold text-gray-900">
                    #{orderToCancel?.order_number}
                  </span>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This action cannot be undone.
                </p>
                
                <div className="mt-4">
                  <label htmlFor="cancel-reason" className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for cancellation *
                  </label>
                  <textarea
                    id="cancel-reason"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Please provide a reason for cancelling this order..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={closeCancelModal}
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={confirmCancelOrder}
                >
                  Cancel Order
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyPurchase;