/**
 * Order Tracking Component
 * 
 * Real-time order tracking with status updates and notifications.
 * 
 * Features:
 * - Real-time status updates
 * - Order timeline
 * - Push notifications
 * - Status change confirmations
 * - Order history
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiClock, 
  FiPackage, 
  FiTruck, 
  FiCheckCircle, 
  FiXCircle,
  FiRefreshCw,
  FiBell,
  FiBellOff,
  FiMapPin,
  FiPhone,
  FiMail,
  FiUser,
  FiCalendar,
  FiAlertCircle
} from 'react-icons/fi';
import { useAuth } from '../../../../contexts/AuthContext';
import { useToast } from '../../../../components/Toast';
import checkoutService from '../../../../services/checkoutService';
import { supabase } from '../../../../config/supabase';

const OrderTracking = ({ orderId, onStatusUpdate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // State management
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Real-time subscription
  const subscriptionRef = useRef(null);

  // Load order data
  const loadOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await checkoutService.getOrderById(orderId, user.id);
      
      if (result.success) {
        setOrder(result.data);
        console.log('📦 [OrderTracking] Order loaded:', result.data);
      } else {
        setError(result.error);
        showToast('Failed to load order details', 'error');
      }
    } catch (error) {
      console.error('❌ [OrderTracking] Load order error:', error);
      setError(error.message);
      showToast('Failed to load order details', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Refresh order data
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrder();
    setRefreshing(false);
    showToast('Order updated', 'success');
  };

  // Setup real-time subscription
  const setupRealtimeSubscription = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    // Subscribe to order changes
    subscriptionRef.current = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          console.log('🔄 [OrderTracking] Real-time order update:', payload);
          setOrder(prevOrder => ({
            ...prevOrder,
            ...payload.new
          }));
          
          // Show notification if status changed
          if (payload.old.status !== payload.new.status && notificationsEnabled) {
            const statusMessages = {
              'review': 'Your order is under review',
              'processing': 'Your order is being processed',
              'deliver': 'Your order is out for delivery',
              'received': 'Your order has been delivered',
              'cancelled': 'Your order has been cancelled'
            };
            
            showToast(
              `Order #${order.order_number}: ${statusMessages[payload.new.status] || 'Status updated'}`,
              'info'
            );
          }
          
          // Call parent callback
          if (onStatusUpdate) {
            onStatusUpdate(payload.new);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_status_history',
          filter: `order_id=eq.${orderId}`
        },
        (payload) => {
          console.log('🔄 [OrderTracking] New status history:', payload);
          // Refresh order to get updated status history
          loadOrder();
        }
      )
      .subscribe();
  };

  // Load order and setup subscription on mount
  useEffect(() => {
    if (orderId && user?.id) {
      loadOrder();
      setupRealtimeSubscription();
    }

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [orderId, user?.id]);

  // Get status info
  const getStatusInfo = (status) => {
    const statusConfig = {
      'review': { 
        icon: FiClock, 
        color: 'text-yellow-600', 
        bg: 'bg-yellow-100', 
        label: 'Under Review',
        description: 'Your order is being reviewed by the seller'
      },
      'processing': { 
        icon: FiPackage, 
        color: 'text-blue-600', 
        bg: 'bg-blue-100', 
        label: 'Processing',
        description: 'Your order is being prepared for shipment'
      },
      'deliver': { 
        icon: FiTruck, 
        color: 'text-purple-600', 
        bg: 'bg-purple-100', 
        label: 'Out for Delivery',
        description: 'Your order is on its way to you'
      },
      'received': { 
        icon: FiCheckCircle, 
        color: 'text-green-600', 
        bg: 'bg-green-100', 
        label: 'Delivered',
        description: 'Your order has been successfully delivered'
      },
      'cancelled': { 
        icon: FiXCircle, 
        color: 'text-red-600', 
        bg: 'bg-red-100', 
        label: 'Cancelled',
        description: 'Your order has been cancelled'
      }
    };
    return statusConfig[status] || statusConfig['review'];
  };

  // Get payment status info
  const getPaymentStatusInfo = (status, orderStatus) => {
    // If order is completed/received, always show as paid in green
    if (orderStatus === 'completed' || orderStatus === 'received') {
      return { color: 'text-green-600', bg: 'bg-green-100', label: 'Paid' };
    }
    
    const paymentConfig = {
      'pending': { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Pending' },
      'paid': { color: 'text-green-600', bg: 'bg-green-100', label: 'Paid' },
      'failed': { color: 'text-red-600', bg: 'bg-red-100', label: 'Failed' },
      'refunded': { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Refunded' }
    };
    return paymentConfig[status] || paymentConfig['pending'];
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status history in chronological order
  const statusHistory = order?.order_status_history?.sort((a, b) => 
    new Date(a.changed_at) - new Date(b.changed_at)
  ) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Order</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadOrder}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-400 text-6xl mb-4">📦</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
        <p className="text-gray-600">The order you're looking for doesn't exist or you don't have access to it.</p>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  // If order is completed, show payment as paid in green
  const paymentInfo = getPaymentStatusInfo(order.payment_status, order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Tracking</h1>
          <p className="text-gray-600">Order #{order.order_number}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              notificationsEnabled 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-gray-100 text-gray-600'
            }`}
            title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
          >
            {notificationsEnabled ? <FiBell className="w-5 h-5" /> : <FiBellOff className="w-5 h-5" />}
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            title="Refresh order"
          >
            <FiRefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h2>
            <div className="flex items-center space-x-4">
              <div className={`p-4 rounded-lg ${statusInfo.bg}`}>
                <StatusIcon className={`w-8 h-8 ${statusInfo.color}`} />
              </div>
              <div>
                <div className={`text-xl font-bold ${statusInfo.color}`}>
                  {statusInfo.label}
                </div>
                <div className="text-gray-600">
                  {statusInfo.description}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Last updated: {formatDate(order.status_updated_at)}
                </div>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h2>
            <div className="space-y-4">
              {statusHistory.map((history, index) => {
                const historyStatusInfo = getStatusInfo(history.status);
                const HistoryIcon = historyStatusInfo.icon;
                const isLast = index === statusHistory.length - 1;
                
                return (
                  <div key={index} className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${historyStatusInfo.bg} ${isLast ? 'ring-2 ring-blue-500' : ''}`}>
                      <HistoryIcon className={`w-5 h-5 ${historyStatusInfo.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {historyStatusInfo.label}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDate(history.changed_at)}
                      </div>
                      {history.notes && (
                        <div className="text-sm text-gray-500 mt-1">
                          {history.notes}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-3">
              {order.order_items?.map((item, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                    {item.product_image ? (
                      <img 
                        src={item.product_image} 
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiPackage className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {item.product_name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {item.product_type.charAt(0).toUpperCase() + item.product_type.slice(1)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Qty: {item.quantity} × ₱{parseFloat(item.unit_price).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      ₱{parseFloat(item.total_price).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900">₱{parseFloat(order.subtotal).toLocaleString()}</span>
              </div>
              {order.shipping_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="text-gray-900">₱{parseFloat(order.shipping_fee).toLocaleString()}</span>
                </div>
              )}
              {order.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span className="text-gray-900">₱{parseFloat(order.tax_amount).toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">Total:</span>
                  <span className="font-bold text-gray-900">₱{parseFloat(order.total_amount).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Method:</span>
                <span className="font-medium text-gray-900">
                  {order.payment_method.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentInfo.bg} ${paymentInfo.color}`}>
                  {paymentInfo.label}
                </span>
              </div>
              {order.payment_reference && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Reference:</span>
                  <span className="font-medium text-gray-900 text-sm">{order.payment_reference}</span>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <FiUser className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <div className="font-medium text-gray-900">{order.shipping_contact?.name}</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <FiMapPin className="w-4 h-4 text-gray-500 mt-1" />
                <div className="text-sm text-gray-600">
                  {order.shipping_address?.street}<br />
                  {order.shipping_address?.city}, {order.shipping_address?.province}<br />
                  {order.shipping_address?.postal_code}
                </div>
              </div>
              
              {order.shipping_contact?.phone && (
                <div className="flex items-center space-x-2">
                  <FiPhone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{order.shipping_contact.phone}</span>
                </div>
              )}
              
              {order.shipping_contact?.email && (
                <div className="flex items-center space-x-2">
                  <FiMail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{order.shipping_contact.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Date:</span>
                <span className="text-gray-900">{formatDate(order.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Number:</span>
                <span className="text-gray-900 font-mono">#{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Items:</span>
                <span className="text-gray-900">{order.order_items?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
