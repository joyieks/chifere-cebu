import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../../../contexts/AuthContext';
import orderService from '../../../../../../services/orderService';
import authService from '../../../../../../services/authService';

const MyPurchase = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Load user's orders from Firestore
  useEffect(() => {
    if (!user) {
      setLoading(false);
      setOrders([]); // No orders for guest users
      return;
    }

    setLoading(true);

    // Listen to real-time order updates
    const unsubscribe = orderService.listenToUserOrders(user.uid, 'buyer', async (result) => {
      if (result.success) {
        // Get unique seller IDs to fetch seller names
        const sellerIds = new Set();
        result.data.forEach(order => {
          if (order.sellerId) sellerIds.add(order.sellerId);
          order.items?.forEach(item => {
            if (item.sellerId) sellerIds.add(item.sellerId);
          });
        });

        // Fetch seller profiles
        const sellerProfiles = {};
        await Promise.all(
          Array.from(sellerIds).map(async (sellerId) => {
            try {
              const profileResult = await authService.getUserProfile(sellerId);
              if (profileResult.success) {
                sellerProfiles[sellerId] = profileResult.data.displayName ||
                  profileResult.data.businessName ||
                  'Seller';
              }
            } catch (err) {
              console.error(`Failed to fetch seller profile for ${sellerId}:`, err);
              sellerProfiles[sellerId] = 'Seller';
            }
          })
        );

        // Transform Firestore orders to component format
        const transformedOrders = result.data.map(order => ({
          id: order.id,
          status: formatStatus(order.status),
          orderDate: order.createdAt ? formatDate(order.createdAt) : 'N/A',
          deliveredDate: order.deliveredAt ? formatDate(order.deliveredAt) : null,
          totalAmount: order.totalAmount || order.total || 0,
          items: order.items.map(item => ({
            id: item.itemId || item.id,
            name: item.name || item.itemName,
            image: item.image || item.imageUrl || '/placeholder.png',
            price: item.price,
            quantity: item.quantity,
            seller: sellerProfiles[item.sellerId || order.sellerId] || 'Seller'
          })),
          shippingAddress: formatAddress(order.shippingAddress || order.deliveryAddress),
          estimatedDelivery: order.estimatedDelivery ? formatDate(order.estimatedDelivery) : null,
          trackingNumber: order.trackingNumber,
          paymentMethod: order.paymentMethod
        }));

        setOrders(transformedOrders);
      } else {
        console.error('Failed to load orders:', result.error);
        // Show empty state instead of fallback data
        setOrders([]);
      }
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Helper function to format Firestore timestamp
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';

    // Handle Firestore timestamp
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }

    // Handle regular date string/object
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format status for display
  const formatStatus = (status) => {
    const statusMap = {
      'pending': 'Processing',
      'confirmed': 'Processing',
      'processing': 'Processing',
      'shipped': 'In Transit',
      'delivered': 'Delivered',
      'completed': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || 'Processing';
  };

  // Format address object to string
  const formatAddress = (address) => {
    if (!address) return 'No address provided';
    if (typeof address === 'string') return address;

    const { address: street, name, phone } = address;
    return street || `${name}, ${phone}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'In Transit': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Processing': return '⏳';
      case 'In Transit': return '🚚';
      case 'Delivered': return '✅';
      case 'Cancelled': return '❌';
      default: return '📦';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === 'all' || order.status.toLowerCase().replace(' ', '') === activeTab;
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const orderCounts = {
    all: orders.length,
    processing: orders.filter(o => o.status === 'Processing').length,
    intransit: orders.filter(o => o.status === 'In Transit').length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    cancelled: orders.filter(o => o.status === 'Cancelled').length,
  };

  const handleTrackOrder = (orderId) => {
    navigate(`/buyer/track-order/${orderId}`);
  };

  const handleReorder = (order) => {
    // Add reorder logic here
    console.log('Reordering:', order);
  };

  const handleContactSeller = (seller) => {
    // Add contact seller logic here
    console.log('Contacting seller:', seller);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            My Purchases
          </h1>
          <p className="text-gray-600 text-lg">Track and manage your orders</p>
        </div>

        {/* Search and Stats */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20">
            <div className="flex flex-col lg:flex-row gap-6 items-center">
              {/* Search */}
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by order ID or product name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                />
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4">
                <div className="bg-blue-100 px-4 py-2 rounded-full">
                  <span className="text-blue-700 font-semibold">Total Orders: {orders.length}</span>
                </div>
                <div className="bg-green-100 px-4 py-2 rounded-full">
                  <span className="text-green-700 font-semibold">Delivered: {orderCounts.delivered}</span>
                </div>
                <div className="bg-yellow-100 px-4 py-2 rounded-full">
                  <span className="text-yellow-700 font-semibold">In Progress: {orderCounts.processing + orderCounts.intransit}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-2 shadow-lg border border-white/20 flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All Orders', count: orderCounts.all },
                { key: 'processing', label: 'Processing', count: orderCounts.processing },
                { key: 'intransit', label: 'In Transit', count: orderCounts.intransit },
                { key: 'delivered', label: 'Delivered', count: orderCounts.delivered },
                { key: 'cancelled', label: 'Cancelled', count: orderCounts.cancelled }
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 ${
                    activeTab === key
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                  onClick={() => setActiveTab(key)}
                >
                  <span>{label}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    activeTab === key ? 'bg-white/20' : 'bg-gray-200'
                  }`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading your orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-400 mb-2">No orders found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? 'No orders match your search criteria' : 'You haven\'t made any purchases yet'}
              </p>
              <button 
                onClick={() => navigate('/buyer/dashboard')}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold transform hover:scale-105 transition-all duration-200"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            filteredOrders.map((order, index) => (
              <div 
                key={order.id} 
                className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 overflow-hidden group hover:shadow-2xl transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Order Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-bold text-gray-800">Order ID: {order.id}</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold border flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                        <span>{getStatusIcon(order.status)}</span>
                        <span>{order.status}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4M5 9v10a2 2 0 002 2h10a2 2 0 002-2V9m-4 4v2m-4-2v2" />
                        </svg>
                        <span>Ordered: {order.orderDate}</span>
                      </div>
                      {order.deliveredDate && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Delivered: {order.deliveredDate}</span>
                        </div>
                      )}
                      {order.estimatedDelivery && order.status !== 'Delivered' && (
                        <div className="flex items-center space-x-1 text-blue-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Expected: {order.estimatedDelivery}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="space-y-4">
                    {order.items.map((item, itemIndex) => (
                      <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-20 h-20 object-cover rounded-lg shadow-md group-hover:scale-105 transition-transform duration-200" 
                        />
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 mb-1 truncate">{item.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">Sold by: {item.seller}</p>
                          <div className="flex items-center space-x-4">
                            <span className="text-lg font-bold text-blue-600">₱{item.price.toLocaleString()}</span>
                            <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => handleContactSeller(item.seller)}
                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all duration-200 font-medium text-sm border border-blue-200 hover:border-blue-300"
                          >
                            Contact Seller
                          </button>
                          {order.status === 'Delivered' && (
                            <button
                              onClick={() => handleReorder(order)}
                              className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all duration-200 font-medium text-sm border border-green-200 hover:border-green-300"
                            >
                              Buy Again
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-sm text-gray-600">Delivery Address:</span>
                        </div>
                        <p className="text-sm text-gray-700 max-w-md">{order.shippingAddress}</p>
                      </div>

                      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total Amount:</p>
                          <p className="text-2xl font-bold text-blue-600">₱{order.totalAmount.toLocaleString()}</p>
                        </div>

                        <div className="flex space-x-3">
                          {(order.status === 'Processing' || order.status === 'In Transit') && (
                            <button
                              onClick={() => handleTrackOrder(order.id)}
                              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>Track Order</span>
                            </button>
                          )}
                          
                          <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold flex items-center space-x-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>View Details</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MyPurchase;
