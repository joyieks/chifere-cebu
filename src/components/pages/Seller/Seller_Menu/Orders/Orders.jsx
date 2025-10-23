import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../../contexts/AuthContext';
import orderService from '../../../../../services/orderService';
import SellerLayout from '../Seller_Layout/SellerLayout';
import { theme } from '../../../../../styles/designSystem';
import {
  FiPackage,
  FiClock,
  FiTruck,
  FiCheck,
  FiX,
  FiEye,
  FiFilter,
  FiSearch,
  FiDownload
} from 'react-icons/fi';

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch seller orders from Firebase
  useEffect(() => {
    if (!user) {
      setLoading(false);
      setOrders([]);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = orderService.listenToUserOrders(user.uid, 'seller', (result) => {
      if (result.success) {
        // Transform Firebase orders to component format
        const transformedOrders = result.data.map(order => ({
          id: order.id,
          buyerName: order.buyerName || 'Unknown Buyer',
          buyerEmail: order.buyerEmail || '',
          productName: order.items && order.items.length > 0
            ? order.items[0].name || order.items[0].itemName
            : 'Product',
          productImage: order.items && order.items.length > 0
            ? order.items[0].imageUrl || order.items[0].image || '/placeholder-product.svg'
            : '/placeholder-product.svg',
          quantity: order.items && order.items.length > 0
            ? order.items.reduce((sum, item) => sum + (item.quantity || 1), 0)
            : 1,
          amount: order.totalAmount || 0,
          status: order.status || 'pending',
          orderDate: order.createdAt ? (order.createdAt.toDate ? order.createdAt.toDate().toISOString() : order.createdAt) : new Date().toISOString(),
          shippingAddress: formatAddress(order.shippingAddress),
          paymentMethod: order.paymentMethod || 'Online Payment',
          trackingNumber: order.trackingNumber || '',
          notes: order.notes || order.buyerNotes || '',
          barterItem: order.orderType === 'barter' && order.barterDetails
            ? order.barterDetails.offeredItemName || 'Barter Item'
            : '',
          orderType: order.orderType || 'purchase',
          // Keep original order data for updates
          _originalData: order
        }));

        setOrders(transformedOrders);
        setLoading(false);
      } else {
        console.error('Failed to load seller orders:', result.error);
        setError(result.error);
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Helper function to format address
  const formatAddress = (address) => {
    if (!address) return 'No address provided';

    if (typeof address === 'string') return address;

    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.barangay) parts.push(address.barangay);
    if (address.city) parts.push(address.city);
    if (address.province) parts.push(address.province);
    if (address.zipCode) parts.push(address.zipCode);

    return parts.length > 0 ? parts.join(', ') : 'No address provided';
  };

  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-700', icon: FiClock },
    processing: { color: 'bg-blue-100 text-blue-700', icon: FiPackage },
    shipped: { color: 'bg-purple-100 text-purple-700', icon: FiTruck },
    completed: { color: 'bg-green-100 text-green-700', icon: FiCheck },
    cancelled: { color: 'bg-red-100 text-red-700', icon: FiX }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const result = await orderService.updateOrderStatus(orderId, newStatus);

      if (!result.success) {
        console.error('Failed to update order status:', result.error);
        alert(`Failed to update order status: ${result.error}`);
      }
      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('An error occurred while updating the order status');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.productName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const OrderCard = ({ order }) => {
    const StatusIcon = statusConfig[order.status]?.icon || FiPackage;
    
    return (
      <div className="card-base p-6 hover:shadow-lg transition-shadow duration-300">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{order.id}</h3>
            <p className="text-sm text-gray-600">
              {new Date(order.orderDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${statusConfig[order.status]?.color}`}>
              <StatusIcon className="w-4 h-4" />
              <span className="capitalize">{order.status}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Details */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Order Details</h4>
            <div className="flex items-center space-x-4 mb-3">
              <img
                src={order.productImage}
                alt={order.productName}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <p className="font-medium text-gray-800">{order.productName}</p>
                <p className="text-sm text-gray-600">Quantity: {order.quantity}</p>
                <p className="font-semibold" style={{ color: theme.colors.primary[600] }}>
                  {order.amount === 0 ? `Barter: ${order.barterItem}` : `₱${order.amount.toLocaleString()}`}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Payment:</span> {order.paymentMethod}
            </p>
            {order.trackingNumber && (
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Tracking:</span> {order.trackingNumber}
              </p>
            )}
            {order.notes && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Notes:</span> {order.notes}
              </p>
            )}
          </div>

          {/* Buyer Details */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Buyer Information</h4>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium text-gray-700">Name:</span> {order.buyerName}
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Email:</span> {order.buyerEmail}
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Address:</span> {order.shippingAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <button className="btn-base btn-sm btn-outline">
              <FiEye className="w-4 h-4 mr-2" />
              View Details
            </button>
            <button className="btn-base btn-sm btn-outline">
              <FiDownload className="w-4 h-4 mr-2" />
              Invoice
            </button>
          </div>
          
          {order.status === 'pending' && (
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => updateOrderStatus(order.id, 'processing')}
                className="btn-base btn-sm btn-primary"
              >
                Accept Order
              </button>
              <button 
                onClick={() => updateOrderStatus(order.id, 'cancelled')}
                className="btn-base btn-sm bg-red-500 text-white hover:bg-red-600"
              >
                Cancel
              </button>
            </div>
          )}
          
          {order.status === 'processing' && (
            <button 
              onClick={() => updateOrderStatus(order.id, 'shipped')}
              className="btn-base btn-sm btn-primary"
            >
              Mark as Shipped
            </button>
          )}
          
          {order.status === 'shipped' && (
            <button 
              onClick={() => updateOrderStatus(order.id, 'completed')}
              className="btn-base btn-sm btn-success"
              style={{ backgroundColor: theme.colors.success[500] }}
            >
              Mark as Completed
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <SellerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Orders</h1>
              <p className="text-gray-600">Manage your customer orders</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Object.keys(statusConfig).map(status => (
              <div key={status} className="card-base p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1 capitalize">{status} Orders</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {orders.filter(order => order.status === status).length}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${statusConfig[status]?.color.replace('text-', 'text-').replace('bg-', 'bg-').replace('-700', '-100').replace('-100', '-100')}`}>
                    {React.createElement(statusConfig[status]?.icon, { className: `w-6 h-6 ${statusConfig[status]?.color.split(' ')[1]}` })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="card-base p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search orders, buyers, or products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-base pl-10 pr-4"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input-base min-w-[160px]"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <button className="btn-base btn-md btn-outline">
                  <FiFilter className="w-5 h-5 mr-2" />
                  More Filters
                </button>
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-6">
            {!loading && (
              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  Showing {filteredOrders.length} of {orders.length} orders
                </p>
              </div>
            )}

            {loading ? (
              <div className="card-base p-12 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-400 mb-2">Loading orders...</h3>
                <p className="text-gray-600">Please wait while we fetch your orders</p>
              </div>
            ) : error ? (
              <div className="card-base p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <FiX className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-red-400 mb-2">Failed to load orders</h3>
                <p className="text-gray-600">{error}</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="card-base p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <FiPackage className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No orders found</h3>
                <p className="text-gray-600">
                  {orders.length === 0
                    ? 'You have no orders yet. Orders will appear here when customers purchase from you.'
                    : 'Try adjusting your search or filter criteria'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>
        </div>
    </SellerLayout>
  );
};

export default Orders;