/**
 * Order Details Modal Component
 * 
 * Modal for viewing detailed order information including items, customer details, and status history.
 * 
 * Features:
 * - Complete order information
 * - Customer details
 * - Order items with images
 * - Status history timeline
 * - Payment information
 * - Shipping details
 * 
 * @version 1.0.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, 
  FiClock, 
  FiPackage, 
  FiTruck, 
  FiCheckCircle, 
  FiXCircle,
  FiUser,
  FiMapPin,
  FiPhone,
  FiMail,
  FiDollarSign,
  FiCalendar,
  FiCreditCard,
  FiMessageSquare
} from 'react-icons/fi';

const OrderDetailsModal = ({ order, isOpen, onClose }) => {
  // Get status info
  const getStatusInfo = (status) => {
    const statusConfig = {
      'pending': { icon: FiClock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Pending' },
      'review': { icon: FiClock, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Under Review' },
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

  const statusInfo = getStatusInfo(order.status);
  const paymentInfo = getPaymentStatusInfo(order.payment_status);
  const StatusIcon = statusInfo.icon;

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
  const statusHistory = order.order_status_history?.sort((a, b) => 
    new Date(a.changed_at) - new Date(b.changed_at)
  ) || [];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
              <p className="text-sm text-gray-600 mt-1">
                Order #{order.order_number}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Order Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Status</h3>
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${statusInfo.bg}`}>
                      <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
                    </div>
                    <div>
                      <div className={`font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </div>
                      <div className="text-sm text-gray-600">
                        Updated {formatDate(order.status_updated_at)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
                  <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <FiUser className="w-5 h-5 text-gray-500" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {order.user_profiles?.display_name || order.buyer_addresses?.name || 'Unknown Customer'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {order.user_profiles?.email || 'No email provided'}
                          </div>
                        </div>
                      </div>
                    
                    {(order.shipping_contact?.phone || order.user_profiles?.phone || order.buyer_addresses?.phone) && (
                      <div className="flex items-center space-x-3">
                        <FiPhone className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-900">{order.shipping_contact?.phone || order.user_profiles?.phone || order.buyer_addresses?.phone}</span>
                      </div>
                    )}
                    
                    {order.shipping_contact?.email && (
                      <div className="flex items-center space-x-3">
                        <FiMail className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-900">{order.shipping_contact.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Shipping Address</h3>
                  <div className="flex items-start space-x-3">
                    <FiMapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div className="text-gray-900">
                      {(order.shipping_contact?.name || order.buyer_addresses?.name) && (
                        <div className="font-medium">{order.shipping_contact?.name || order.buyer_addresses?.name}</div>
                      )}
                      {(order.shipping_address?.street || order.buyer_addresses?.address_line_1) && (
                        <div>{order.shipping_address?.street || order.buyer_addresses?.address_line_1}</div>
                      )}
                      {(order.shipping_address?.street2 || order.buyer_addresses?.address_line_2) && (
                        <div>{order.shipping_address?.street2 || order.buyer_addresses?.address_line_2}</div>
                      )}
                      {order.shipping_address?.barangay && (
                        <div>{order.shipping_address.barangay}</div>
                      )}
                      {((order.shipping_address?.city && order.shipping_address?.province) || (order.buyer_addresses?.city && order.buyer_addresses?.province)) && (
                        <div>{order.shipping_address?.city || order.buyer_addresses?.city}, {order.shipping_address?.province || order.buyer_addresses?.province}</div>
                      )}
                      {(order.shipping_address?.postal_code || order.buyer_addresses?.postal_code) && (
                        <div>{order.shipping_address?.postal_code || order.buyer_addresses?.postal_code}</div>
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
                      {!order.shipping_address?.street && !order.shipping_address?.city && !order.buyer_addresses?.address_line_1 && !order.buyer_addresses?.city && (
                        <div className="text-gray-500 italic">No shipping address provided</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Information</h3>
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
                        <span className="font-medium text-gray-900">{order.payment_reference}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Order Items */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {(order.order_items || order.buyer_order_items || []).map((item, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg">
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
                            {item.product_type?.charAt(0).toUpperCase() + item.product_type?.slice(1) || 'Product'}
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
                    {(!order.order_items?.length && !order.buyer_order_items?.length) && (
                      <div className="text-center py-4 text-gray-500">
                        No items found for this order
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h3>
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

                {/* Order Notes */}
                {(order.buyer_notes || order.seller_notes) && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
                    <div className="space-y-3">
                      {order.buyer_notes && (
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Customer Notes:</div>
                          <div className="text-sm text-gray-600 bg-white p-3 rounded-lg">
                            {order.buyer_notes}
                          </div>
                        </div>
                      )}
                      {order.seller_notes && (
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Seller Notes:</div>
                          <div className="text-sm text-gray-600 bg-white p-3 rounded-lg">
                            {order.seller_notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Status History */}
                {statusHistory.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Status History</h3>
                    <div className="space-y-3">
                      {statusHistory.map((history, index) => {
                        const historyStatusInfo = getStatusInfo(history.status);
                        const HistoryIcon = historyStatusInfo.icon;
                        
                        return (
                          <div key={index} className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${historyStatusInfo.bg}`}>
                              <HistoryIcon className={`w-4 h-4 ${historyStatusInfo.color}`} />
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
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OrderDetailsModal;
