import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../../../../contexts/AuthContext';
import orderService from '../../../../../../services/orderService';
import deliveryService from '../../../../../../services/deliveryService';
import BuyerLayout from '../../Buyer_Layout/Buyer_layout';

const TrackOrder = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch order and delivery data from Firebase
  useEffect(() => {
    if (!orderId || !user) {
      setLoading(false);
      return;
    }

    const fetchOrderData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch order details
        const orderResult = await orderService.getOrderById(orderId);

        if (orderResult.success) {
          setOrder(orderResult.data);

          // Fetch delivery information if delivery ID exists
          if (orderResult.data.deliveryId) {
            const deliveryResult = await deliveryService.getDeliveryById(orderResult.data.deliveryId);
            if (deliveryResult.success) {
              setDelivery(deliveryResult.data);
            }
          }
        } else {
          setError(orderResult.error || 'Failed to load order');
        }
      } catch (err) {
        console.error('Error fetching order data:', err);
        setError('An error occurred while loading the order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();

    // Set up real-time listener for order updates
    const unsubscribe = orderService.listenToOrder(orderId, (result) => {
      if (result.success) {
        setOrder(result.data);

        // Update delivery info if it changed
        if (result.data.deliveryId) {
          deliveryService.getDeliveryById(result.data.deliveryId).then(deliveryResult => {
            if (deliveryResult.success) {
              setDelivery(deliveryResult.data);
            }
          });
        }
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [orderId, user]);

  const steps = [
    { key: 'confirmed', label: 'Order Confirmed', icon: '✅' },
    { key: 'packed', label: 'Item Packed', icon: '📦' },
    { key: 'shipped', label: 'Shipped', icon: '🚚' },
    { key: 'transit', label: 'In Transit', icon: '🛣️' },
    { key: 'delivery', label: 'Out for Delivery', icon: '🏃‍♂️' },
    { key: 'delivered', label: 'Delivered', icon: '🎉' }
  ];

  const getCurrentStep = () => {
    if (!order) return 0;

    switch (order.status) {
      case 'pending':
      case 'confirmed': return 0;
      case 'processing':
      case 'packed': return 1;
      case 'shipped': return 2;
      case 'in_transit': return 3;
      case 'out_for_delivery': return 4;
      case 'delivered':
      case 'completed': return 5;
      default: return 0;
    }
  };

  const currentStep = getCurrentStep();

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Build delivery timeline from order and delivery data
  const getDeliveryTimeline = () => {
    if (!order) return [];

    const timeline = [];
    const now = new Date();

    // Order placed
    if (order.createdAt) {
      timeline.push({
        time: formatDate(order.createdAt),
        status: 'Order Placed',
        desc: 'Your order has been confirmed and is being prepared.',
        completed: true
      });
    }

    // Payment confirmed
    if (order.paymentStatus === 'completed' || order.paymentStatus === 'succeeded') {
      timeline.push({
        time: order.paidAt ? formatDate(order.paidAt) : formatDate(order.createdAt),
        status: 'Payment Confirmed',
        desc: `Payment received via ${order.paymentMethod || 'online payment'}. Order is now being processed.`,
        completed: true
      });
    }

    // Add delivery tracking events if available
    if (delivery && delivery.trackingEvents && delivery.trackingEvents.length > 0) {
      delivery.trackingEvents.forEach(event => {
        timeline.push({
          time: formatDate(event.timestamp),
          status: event.status,
          desc: event.description || event.location || '',
          completed: true
        });
      });
    } else {
      // Default progression based on order status
      const statusMap = [
        { key: 'processing', label: 'Item Packed', desc: 'Your item has been carefully packed and ready for shipment.' },
        { key: 'shipped', label: 'Shipped', desc: `Package has been picked up by ${delivery?.courier || 'courier'}.` },
        { key: 'in_transit', label: 'In Transit', desc: 'Package is on the way to destination facility.' },
        { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Package is out for delivery to your address.' }
      ];

      statusMap.forEach(status => {
        const isCompleted = getCurrentStep() > statusMap.indexOf(status);
        const isCurrentStatus = order.status === status.key;

        timeline.push({
          time: isCompleted || isCurrentStatus ? formatDate(order.updatedAt) : `Expected: ${formatDate(order.estimatedDelivery)}`,
          status: status.label,
          desc: status.desc,
          completed: isCompleted || isCurrentStatus
        });
      });
    }

    // Delivered status
    if (order.status === 'delivered' || order.status === 'completed') {
      timeline.push({
        time: formatDate(order.deliveredAt || order.updatedAt),
        status: 'Delivered',
        desc: 'Package has been delivered successfully.',
        completed: true
      });
    } else {
      timeline.push({
        time: `Expected: ${formatDate(order.estimatedDelivery)}`,
        status: 'Delivered',
        desc: 'Package will be delivered to your address.',
        completed: false
      });
    }

    return timeline;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-blue-600 bg-blue-100';
      case 'packed': return 'text-purple-600 bg-purple-100';
      case 'shipped': return 'text-orange-600 bg-orange-100';
      case 'in_transit': return 'text-yellow-600 bg-yellow-100';
      case 'out_for_delivery': return 'text-green-600 bg-green-100';
      case 'delivered': return 'text-emerald-600 bg-emerald-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Loading state
  if (loading) {
    return (
      <BuyerLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-400 mb-2">Loading order details...</h3>
            <p className="text-gray-500">Please wait while we fetch your order information</p>
          </div>
        </div>
      </BuyerLayout>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <BuyerLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <svg className="w-16 h-16 mx-auto text-red-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-red-400 mb-2">Order Not Found</h3>
            <p className="text-gray-500 mb-6">{error || 'The order you are looking for does not exist or you do not have permission to view it.'}</p>
            <button
              onClick={() => navigate('/buyer/my-purchase')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-all duration-200"
            >
              Back to My Orders
            </button>
          </div>
        </div>
      </BuyerLayout>
    );
  }

  const deliveryTimeline = getDeliveryTimeline();

  return (
    <BuyerLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Orders
              </button>

              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-800">Track Your Order</h1>
                <p className="text-gray-600 mt-1">Monitor your order status and delivery progress</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Order Summary Card */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8 mb-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <div className="flex items-center space-x-4 mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">Order #{order.id}</h2>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                  <div>
                    <span className="text-gray-500 block">Order Date</span>
                    <span className="font-semibold text-gray-800">{formatDate(order.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Expected Delivery</span>
                    <span className="font-semibold text-gray-800">{formatDate(order.estimatedDelivery)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Payment Method</span>
                    <span className="font-semibold text-gray-800">{order.paymentMethod || 'Online Payment'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Order Total</span>
                    <span className="font-semibold text-blue-600 text-lg">₱{(order.totalAmount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-all duration-200 flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Contact Seller</span>
                </button>
                <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition-all duration-200">
                  Need Help?
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Progress Tracker */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-8">Order Progress</h3>
                
                {/* Progress Steps */}
                <div className="relative mb-12">
                  <div className="flex items-center justify-between">
                    {steps.map((step, idx) => (
                      <div key={step.key} className="flex flex-col items-center relative z-10">
                        <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center mb-3 text-2xl font-bold transition-all duration-500 ${
                          idx <= currentStep 
                            ? 'border-blue-500 bg-blue-500 text-white shadow-lg scale-110' 
                            : 'border-gray-300 bg-white text-gray-400'
                        }`}>
                          {idx <= currentStep ? step.icon : idx + 1}
                        </div>
                        <div className={`text-center transition-all duration-300 ${
                          idx <= currentStep ? 'text-blue-600 font-semibold' : 'text-gray-400'
                        }`}>
                          <div className="text-sm font-medium">{step.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Progress Line */}
                  <div className="absolute top-8 left-8 right-8 h-1 bg-gray-200 -z-10">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-out"
                      style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Tracking Timeline */}
                <div>
                  <h4 className="text-xl font-bold text-gray-800 mb-6">Tracking History</h4>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {deliveryTimeline.map((event, idx) => (
                      <div key={idx} className={`flex items-start space-x-4 p-4 rounded-xl transition-all duration-200 ${
                        event.completed
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}>
                        <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                          event.completed ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-semibold ${
                              event.completed ? 'text-green-800' : 'text-gray-600'
                            }`}>
                              {event.status}
                            </span>
                            <span className="text-sm text-gray-500 font-mono">
                              {event.time}
                            </span>
                          </div>
                          <p className={`text-sm ${
                            event.completed ? 'text-green-700' : 'text-gray-600'
                          }`}>
                            {event.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Details Sidebar */}
            <div className="space-y-6">
              {/* Product Information */}
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Order Items</h4>
                <div className="space-y-4">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                        <img
                          src={item.imageUrl || item.image || '/placeholder.png'}
                          alt={item.name || item.itemName}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-gray-800 text-sm line-clamp-2">{item.name || item.itemName}</h5>
                          {item.condition && (
                            <p className="text-xs text-gray-500 mt-1">Condition: {item.condition}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-600">Qty: {item.quantity || item.qty || 1}</span>
                            <span className="font-bold text-blue-600">₱{(item.price || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No items found</p>
                  )}
                </div>

                <div className="border-t border-gray-200 mt-4 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800">Seller:</span>
                    <span className="text-blue-600 font-medium">{order.sellerName || 'Seller'}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Delivery Information</h4>

                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-500 block">Delivery Address</span>
                    <div className="font-medium text-gray-800 mt-1">
                      {order.shippingAddress ? (
                        <>
                          <div>{order.shippingAddress.name || 'Recipient'}</div>
                          {order.shippingAddress.phone && (
                            <div className="text-sm text-gray-600">{order.shippingAddress.phone}</div>
                          )}
                          <div className="text-sm text-gray-600 mt-2">
                            {order.shippingAddress.street && <div>{order.shippingAddress.street}</div>}
                            {order.shippingAddress.barangay && <div>{order.shippingAddress.barangay}</div>}
                            {order.shippingAddress.city && order.shippingAddress.province && (
                              <div>{order.shippingAddress.city}, {order.shippingAddress.province}</div>
                            )}
                            {order.shippingAddress.zipCode && <div>{order.shippingAddress.zipCode}</div>}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">No address provided</div>
                      )}
                    </div>
                  </div>

                  {(delivery?.courier || delivery?.courierService) && (
                    <div className="border-t border-gray-200 pt-4">
                      <span className="text-sm text-gray-500 block">Courier Service</span>
                      <div className="font-medium text-gray-800 mt-1">{delivery.courier || delivery.courierService}</div>
                    </div>
                  )}

                  {(delivery?.trackingNumber || delivery?.trackingId) && (
                    <div className="border-t border-gray-200 pt-4">
                      <span className="text-sm text-gray-500 block">Tracking Number</span>
                      <div className="font-mono text-sm bg-gray-100 p-2 rounded-lg mt-1">
                        {delivery.trackingNumber || delivery.trackingId}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h4>
                
                <div className="space-y-3">
                  {(order.status === 'delivered' || order.status === 'completed') && (
                    <>
                      <button className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold transition-all duration-200">
                        {order.orderType === 'barter' ? 'Barter Again' : 'Buy Again'}
                      </button>
                      <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-all duration-200">
                        Rate & Review
                      </button>
                    </>
                  )}

                  <button className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition-all duration-200">
                    Report Issue
                  </button>

                  <button className="w-full px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 font-semibold transition-all duration-200">
                    Download Receipt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </BuyerLayout>
  );
};

export default TrackOrder;
