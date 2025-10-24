/**
 * Order Status Modal Component
 * 
 * Modal for updating order status with confirmation and notes.
 * 
 * Features:
 * - Status transition validation
 * - Confirmation dialog
 * - Optional notes
 * - Real-time status updates
 * 
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, 
  FiClock, 
  FiPackage, 
  FiTruck, 
  FiCheckCircle, 
  FiXCircle,
  FiAlertTriangle,
  FiMessageSquare
} from 'react-icons/fi';

const OrderStatusModal = ({ order, isOpen, onClose, onConfirm }) => {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  // Get next possible statuses for this order
  const getNextStatuses = (currentStatus) => {
    const statusFlow = {
      'pending': [
        { value: 'review', label: 'Under Review', icon: FiClock, description: 'Review and confirm the order' },
        { value: 'cancelled', label: 'Cancel Order', icon: FiXCircle, description: 'Cancel this order' }
      ],
      'review': [
        { value: 'delivered', label: 'Delivered', icon: FiTruck, description: 'Mark as delivered to customer' },
        { value: 'cancelled', label: 'Cancel Order', icon: FiXCircle, description: 'Cancel this order' }
      ],
      'delivered': [
        { value: 'completed', label: 'Completed', icon: FiCheckCircle, description: 'Mark order as completed' }
      ],
      'completed': [],
      'cancelled': []
    };
    return statusFlow[currentStatus] || [];
  };

  // Get current status info
  const getCurrentStatusInfo = (status) => {
    const statusConfig = {
      'pending': { icon: FiClock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Pending' },
      'review': { icon: FiClock, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Under Review' },
      'delivered': { icon: FiTruck, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Delivered' },
      'completed': { icon: FiCheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Completed' },
      'cancelled': { icon: FiXCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Cancelled' }
    };
    return statusConfig[status] || statusConfig['pending'];
  };

  const nextStatuses = getNextStatuses(order.status);
  const currentStatusInfo = getCurrentStatusInfo(order.status);
  const CurrentStatusIcon = currentStatusInfo.icon;

  // Handle status selection
  const handleStatusSelect = (status) => {
    setSelectedStatus(status);
  };

  // Handle confirmation
  const handleConfirm = async () => {
    if (!selectedStatus) return;

    setIsConfirming(true);
    try {
      await onConfirm(selectedStatus, notes.trim() || null);
    } finally {
      setIsConfirming(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!isConfirming) {
      setSelectedStatus('');
      setNotes('');
      onClose();
    }
  };

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
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Update Order Status</h2>
              <p className="text-sm text-gray-600 mt-1">
                Order #{order.order_number}
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isConfirming}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Current Status */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Current Status</h3>
              <div className={`inline-flex items-center px-3 py-2 rounded-lg ${currentStatusInfo.bg}`}>
                <CurrentStatusIcon className={`w-5 h-5 mr-2 ${currentStatusInfo.color}`} />
                <span className={`font-medium ${currentStatusInfo.color}`}>
                  {currentStatusInfo.label}
                </span>
              </div>
            </div>

            {/* Next Status Options */}
            {nextStatuses.length > 0 ? (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Update to:</h3>
                <div className="space-y-3">
                  {nextStatuses.map((status) => {
                    const StatusIcon = status.icon;
                    const isSelected = selectedStatus === status.value;
                    const isCancelled = status.value === 'cancelled';

                    return (
                      <button
                        key={status.value}
                        onClick={() => handleStatusSelect(status.value)}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? isCancelled
                              ? 'border-red-300 bg-red-50'
                              : 'border-blue-300 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center">
                          <StatusIcon className={`w-5 h-5 mr-3 ${
                            isSelected
                              ? isCancelled
                                ? 'text-red-600'
                                : 'text-blue-600'
                              : 'text-gray-500'
                          }`} />
                          <div>
                            <div className={`font-medium ${
                              isSelected
                                ? isCancelled
                                  ? 'text-red-900'
                                  : 'text-blue-900'
                                : 'text-gray-900'
                            }`}>
                              {status.label}
                            </div>
                            <div className={`text-sm ${
                              isSelected
                                ? isCancelled
                                  ? 'text-red-700'
                                  : 'text-blue-700'
                                : 'text-gray-600'
                            }`}>
                              {status.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <FiCheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm text-gray-700">
                    This order is already completed and cannot be updated further.
                  </span>
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedStatus && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiMessageSquare className="inline w-4 h-4 mr-1" />
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this status update..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            )}

            {/* Warning for cancellation */}
            {selectedStatus === 'cancelled' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <FiAlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800">Cancel Order</h4>
                    <p className="text-sm text-red-700 mt-1">
                      This action will cancel the order. The customer will be notified and any payments will be refunded if applicable.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Order Summary</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="font-medium">{order.user_profiles?.display_name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-medium">₱{parseFloat(order.total_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Status:</span>
                  <span className={`font-medium ${
                    order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span className="font-medium">{order.order_items?.length || 0} item(s)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              disabled={isConfirming}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedStatus || isConfirming}
              className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2 ${
                selectedStatus === 'cancelled'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isConfirming ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>
                  {selectedStatus === 'cancelled' ? 'Cancel Order' : 'Update Status'}
                </span>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OrderStatusModal;
