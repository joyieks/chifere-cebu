/**
 * Order Details Component
 * 
 * Shows detailed information about a specific order including:
 * - Order information
 * - Items ordered
 * - Payment details
 * - Delivery address
 * - Status timeline
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiPackage, 
  FiClock, 
  FiTruck, 
  FiCheckCircle, 
  FiXCircle,
  FiArrowLeft,
  FiDollarSign,
  FiUser,
  FiMapPin,
  FiPhone,
  FiMail,
  FiCreditCard,
  FiShoppingBag,
  FiCalendar,
  FiStar,
  FiMessageSquare
} from 'react-icons/fi';
import { useAuth } from '../../../../../../contexts/AuthContext';
import { useToast } from '../../../../../../components/Toast';
import orderService from '../../../../../../services/orderService';
import reviewService from '../../../../../../services/reviewService';
import ReviewModal from '../../../../../../components/common/ReviewModal';
import { supabase } from '../../../../../../config/supabase';

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Load order details
  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
    } else if (location.state?.order) {
      console.log('🔍 [OrderDetails] Order received from state:', {
        orderId: location.state.order.id,
        orderNumber: location.state.order.order_number,
        itemsCount: location.state.order.order_items?.length || 0,
        items: location.state.order.order_items,
        fullOrder: location.state.order
      });
      setOrder(location.state.order);
      setLoading(false);
    }
  }, [orderId, location.state]);

  // Load reviews for order items
  useEffect(() => {
    if (order && order.order_items && order.order_items.length > 0) {
      loadReviews();
    }
  }, [order]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await orderService.getOrderById(orderId);
      
      if (result.success) {
        setOrder(result.order);
      } else {
        setError(result.error);
        showToast('Failed to load order details', 'error');
      }
    } catch (error) {
      console.error('❌ [OrderDetails] Load order details error:', error);
      setError(error.message);
      showToast('Failed to load order details', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load reviews for order items
  const loadReviews = async () => {
    if (!order || !order.order_items || !user) return;

    try {
      const reviewPromises = order.order_items.map(async (item) => {
        // Check if user has already reviewed this specific product in this specific order
        const { data: existingReview, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('buyer_id', user.id)
          .eq('product_id', item.product_id)
          .eq('order_id', order.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.warn('❌ [OrderDetails] Error checking existing review:', error);
        }

        return {
          productId: item.product_id,
          review: existingReview || null
        };
      });

      const reviewResults = await Promise.all(reviewPromises);
      const reviewsMap = {};
      
      reviewResults.forEach(({ productId, review }) => {
        reviewsMap[productId] = review;
      });

      setReviews(reviewsMap);
      console.log('🔍 [OrderDetails] Loaded reviews for order items:', reviewsMap);
    } catch (error) {
      console.error('❌ [OrderDetails] Load reviews error:', error);
    }
  };

  // Handle review button click
  const handleReviewClick = (item) => {
    setSelectedItem(item);
    setShowReviewModal(true);
  };

  // Handle review submission
  const handleReviewSubmitted = (reviewData) => {
    if (selectedItem) {
      setReviews(prev => ({
        ...prev,
        [selectedItem.product_id]: reviewData
      }));
    }
    setShowReviewModal(false);
    setSelectedItem(null);
  };

  // Check if order is completed and can be reviewed
  const canReview = (order) => {
    return order && order.status === 'completed';
  };

  // Debug order data when it changes
  useEffect(() => {
    if (order) {
      console.log('🔍 [OrderDetails] Order data:', order);
      console.log('🔍 [OrderDetails] shipping_address:', order.shipping_address);
      console.log('🔍 [OrderDetails] shipping_contact:', order.shipping_contact);
      console.log('🔍 [OrderDetails] delivery_address:', order.delivery_address);
    }
  }, [order]);

  // Get status icon and color
  const getStatusInfo = (status) => {
    const statusConfig = {
      'pending': { icon: FiClock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Pending' },
      'review': { icon: FiClock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Review' },
      'processing': { icon: FiPackage, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Processing' },
      'deliver': { icon: FiTruck, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Deliver' },
      'delivered': { icon: FiTruck, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Delivered' },
      'received': { icon: FiCheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Received' },
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

  // Get status timeline
  const getStatusTimeline = (order) => {
    const timeline = [
      { status: 'pending', label: 'Pending', date: order.created_at },
      { status: 'review', label: 'Under Review', date: order.updated_at },
      { status: 'delivered', label: 'Delivered', date: order.delivered_at },
      { status: 'completed', label: 'Completed', date: order.delivered_at }
    ];

    return timeline;
  };

  // Handle marking order as received
  const handleMarkAsReceived = async () => {
    try {
      const result = await orderService.markOrderAsReceived(order.id, user.id);
      if (result.success) {
        showToast('Order marked as received!', 'success');
        // Reload order details
        loadOrderDetails();
      } else {
        showToast('Failed to mark order as received', 'error');
      }
    } catch (error) {
      console.error('Error marking order as received:', error);
      showToast('Failed to mark order as received', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The order you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/buyer/purchase')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const paymentInfo = getPaymentStatusInfo(order.payment_status);
  const PaymentIcon = getPaymentMethodIcon(order.payment_method);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/buyer/purchase')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
                <p className="text-gray-600 mt-1">Order #{order.order_number}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                <StatusIcon className="w-4 h-4 mr-2" />
                {statusInfo.label}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {(() => {
                  console.log('🔍 [OrderDetails] Rendering order items:', {
                    hasOrderItems: !!order.order_items,
                    itemsLength: order.order_items?.length || 0,
                    items: order.order_items,
                    itemsType: typeof order.order_items,
                    itemsIsArray: Array.isArray(order.order_items)
                  });
                  return null;
                })()}
                {order.order_items && order.order_items.length > 0 ? (
                  order.order_items.map((item, index) => {
                    const userReview = reviews[item.product_id];
                    const hasReviewed = !!userReview;
                    
                    return (
                      <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                        <div className="flex-shrink-0">
                          {item.product_image ? (
                            <img
                              src={item.product_image}
                              alt={item.product_name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                              <FiPackage className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.product_name}</h3>
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                          <p className="text-sm text-gray-500">Price: ₱{parseFloat(item.unit_price || 0).toLocaleString()}</p>
                          
                          {/* Review Status */}
                          {canReview(order) && (
                            <div className="mt-2">
                              {hasReviewed ? (
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center space-x-1">
                                    {Array.from({ length: 5 }, (_, i) => (
                                      <FiStar
                                        key={i}
                                        className={`w-4 h-4 ${
                                          i < userReview.rating 
                                            ? 'text-yellow-400 fill-current' 
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm text-green-600 font-medium">
                                    ✓ Reviewed
                                  </span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleReviewClick(item)}
                                  className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                >
                                  <FiMessageSquare className="w-4 h-4" />
                                  <span>Write a Review</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ₱{parseFloat(item.total_price || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FiPackage className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No items found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Address</h2>
              <div className="flex items-start space-x-3">
                <FiMapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                <div className="text-gray-900">
                  {order.shipping_contact?.name && (
                    <div className="font-medium">{order.shipping_contact.name}</div>
                  )}
                  {order.shipping_address?.street && (
                    <div>{order.shipping_address.street}</div>
                  )}
                  {order.shipping_address?.street2 && (
                    <div>{order.shipping_address.street2}</div>
                  )}
                  {order.shipping_address?.barangay && (
                    <div>{order.shipping_address.barangay}</div>
                  )}
                  {order.shipping_address?.city && order.shipping_address?.province && (
                    <div>{order.shipping_address.city}, {order.shipping_address.province}</div>
                  )}
                  {order.shipping_address?.postal_code && (
                    <div>{order.shipping_address.postal_code}</div>
                  )}
                  {order.shipping_address?.country && (
                    <div>{order.shipping_address.country}</div>
                  )}
                  {order.shipping_address?.type && (
                    <div className="text-sm text-gray-500 mt-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {order.shipping_address.type}
                      </span>
                    </div>
                  )}
                  {/* Fallback to delivery_address if no structured address */}
                  {!order.shipping_address?.street && !order.shipping_address?.city && order.delivery_address && (
                    <>
                      {order.delivery_address.name && (
                        <div className="font-medium">{order.delivery_address.name}</div>
                      )}
                      {order.delivery_address.address && (
                        <div>{order.delivery_address.address.replace(/undefined/g, '').replace(/null/g, '').replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '').trim()}</div>
                      )}
                      {order.delivery_address.phone && (
                        <div className="text-gray-600 flex items-center mt-1">
                          <FiPhone className="w-4 h-4 mr-1" />
                          {order.delivery_address.phone}
                        </div>
                      )}
                      <div className="text-sm text-gray-500 mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          home
                        </span>
                      </div>
                    </>
                  )}
                  
                  {!order.shipping_address?.street && !order.shipping_address?.city && !order.delivery_address?.address && (
                    <div className="text-gray-500 italic">No shipping address provided</div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Timeline</h2>
              <div className="space-y-4">
                {getStatusTimeline(order).map((timeline, index) => {
                  const isActive = order.status === timeline.status || 
                    (timeline.status === 'pending' && ['review', 'delivered', 'completed'].includes(order.status)) ||
                    (timeline.status === 'review' && ['delivered', 'completed'].includes(order.status)) ||
                    (timeline.status === 'delivered' && order.status === 'completed');
                  
                  return (
                    <div key={index} className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                      <div className="flex-1">
                        <p className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                          {timeline.label}
                        </p>
                        {timeline.date && (
                          <p className="text-sm text-gray-500">
                            {new Date(timeline.date).toLocaleString()}
                          </p>
                        )}
                      </div>
                      {/* Show Received button for delivered orders */}
                      {timeline.status === 'delivered' && order.status === 'delivered' && (
                        <button
                          onClick={handleMarkAsReceived}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Mark as Received
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₱{parseFloat(order.subtotal || 0).toLocaleString()}</span>
                </div>
                {order.delivery_fee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium">₱{parseFloat(order.delivery_fee).toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-semibold text-gray-900">₱{parseFloat(order.total_amount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Information</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <PaymentIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {order.payment_method.replace('_', ' ').toUpperCase()}
                    </p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${paymentInfo.bg} ${paymentInfo.color}`}>
                      {paymentInfo.label}
                    </span>
                  </div>
                </div>
                {order.payment_reference && (
                  <div>
                    <p className="text-sm text-gray-600">Transaction Reference</p>
                    <p className="font-mono text-sm text-gray-900">{order.payment_reference}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Information</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <FiCalendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Order Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FiPackage className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Order Number</p>
                    <p className="font-mono text-sm text-gray-900">#{order.order_number}</p>
                  </div>
                </div>
                {order.notes && (
                  <div>
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="text-sm text-gray-900">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedItem && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          orderItem={selectedItem}
          orderId={order.id}
          sellerId={order.seller_id}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
};

export default OrderDetails;
