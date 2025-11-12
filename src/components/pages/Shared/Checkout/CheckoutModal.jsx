/**
 * Checkout Modal Component
 * 
 * Modal for processing checkout with cart items, shipping information, and payment method selection.
 * 
 * Features:
 * - Cart items review
 * - Shipping address form
 * - Payment method selection
 * - Order summary
 * - Order creation and processing
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, 
  FiPackage, 
  FiMapPin, 
  FiPhone, 
  FiMail, 
  FiUser,
  FiCreditCard,
  FiShoppingCart,
  FiCheck,
  FiAlertCircle
} from 'react-icons/fi';

import { useAuth } from '../../../../contexts/AuthContext';
import { useToast } from '../../../../components/Toast';
import checkoutService from '../../../../services/checkoutService';

// Peso Icon Component
const PesoIcon = ({ className, style }) => (
  <span className={className} style={style}>₱</span>
);

const CheckoutModal = ({ isOpen, onClose, cartItems, onOrderSuccess }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // Form states
  const [formData, setFormData] = useState({
    // Shipping information
    name: '',
    phone: '',
    email: '',
    street: '',
    city: '',
    province: '',
    postalCode: '',
    
    // Payment method
    paymentMethod: 'cash_on_delivery',
    
    // Order details
    shippingFee: 50,
    notes: ''
  });
  
  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFee = formData.shippingFee;
  const taxAmount = subtotal * 0.12; // 12% tax
  const totalAmount = subtotal + shippingFee + taxAmount;

  // Load user data on mount
  useEffect(() => {
    if (user && isOpen) {
      setFormData(prev => ({
        ...prev,
        name: user.display_name || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
    }
  }, [user, isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        phone: '',
        email: '',
        street: '',
        city: '',
        province: '',
        postalCode: '',
        paymentMethod: 'cash_on_delivery',
        shippingFee: 50,
        notes: ''
      });
      setCurrentStep(1);
      setErrors({});
    }
  }, [isOpen]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.street.trim()) newErrors.street = 'Street address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.province.trim()) newErrors.province = 'Province is required';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (basic)
    if (formData.phone && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (currentStep === 1 && validateForm()) {
      setCurrentStep(2);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    if (!user) {
      showToast('Please log in to place an order', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Group items by seller
      const ordersBySeller = {};
      
      cartItems.forEach(item => {
        const sellerId = item.seller_id;
        if (!ordersBySeller[sellerId]) {
          ordersBySeller[sellerId] = {
            sellerId,
            sellerName: item.seller_name,
            items: []
          };
        }
        ordersBySeller[sellerId].items.push(item);
      });

      // Create orders for each seller
      const orderPromises = Object.values(ordersBySeller).map(sellerOrder => {
        const orderData = {
          buyerId: user.id,
          sellerId: sellerOrder.sellerId,
          items: sellerOrder.items.map(item => ({
            productId: item.product_id,
            productType: item.product_type || 'product',
            productName: item.name,
            productImage: item.image_url || item.image,
            productPrice: item.price,
            quantity: item.quantity,
            unitPrice: item.price,
            productSpecs: {
              condition: item.condition,
              brand: item.brand,
              category: item.category
            }
          })),
          shippingAddress: {
            street: formData.street,
            city: formData.city,
            province: formData.province,
            postal_code: formData.postalCode
          },
          shippingContact: {
            name: formData.name,
            phone: formData.phone,
            email: formData.email
          },
          paymentMethod: formData.paymentMethod,
          shippingFee: formData.shippingFee,
          taxAmount: taxAmount,
          buyerNotes: formData.notes
        };

        return checkoutService.createOrder(orderData);
      });

      const results = await Promise.all(orderPromises);
      
      // Check if all orders were created successfully
      const failedOrders = results.filter(result => !result.success);
      
      if (failedOrders.length > 0) {
        console.error('Some orders failed:', failedOrders);
        showToast('Some orders failed to process. Please try again.', 'error');
        return;
      }

      // All orders created successfully
      showToast('Orders placed successfully!', 'success');
      
      // Call success callback
      if (onOrderSuccess) {
        onOrderSuccess(results.map(result => result.data));
      }
      
      // Close modal
      onClose();

    } catch (error) {
      console.error('❌ [CheckoutModal] Order creation error:', error);
      showToast('Failed to place order. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
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
              <h2 className="text-xl font-bold text-gray-900">Checkout</h2>
              <p className="text-sm text-gray-600 mt-1">
                Step {currentStep} of 2 - {currentStep === 1 ? 'Shipping Information' : 'Order Review'}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {currentStep === 1 ? (
              /* Step 1: Shipping Information */
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <FiUser className="inline w-4 h-4 mr-1" />
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.name ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your full name"
                      />
                      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <FiPhone className="inline w-4 h-4 mr-1" />
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.phone ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your phone number"
                      />
                      {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <FiMail className="inline w-4 h-4 mr-1" />
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your email address"
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>

                    {/* Street Address */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <FiMapPin className="inline w-4 h-4 mr-1" />
                        Street Address *
                      </label>
                      <input
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.street ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your street address"
                      />
                      {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.city ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your city"
                      />
                      {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                    </div>

                    {/* Province */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Province *</label>
                      <input
                        type="text"
                        name="province"
                        value={formData.province}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.province ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your province"
                      />
                      {errors.province && <p className="text-red-500 text-sm mt-1">{errors.province}</p>}
                    </div>

                    {/* Postal Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.postalCode ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your postal code"
                      />
                      {errors.postalCode && <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>}
                    </div>

                    {/* Transaction Fee */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <span className="inline mr-1 font-semibold">₱</span>
                        Transaction Fee (₱)
                      </label>
                      <input
                        type="number"
                        name="shippingFee"
                        value={formData.shippingFee}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="50.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { value: 'cash_on_delivery', label: 'Cash on Delivery', icon: PesoIcon },
                      { value: 'gcash', label: 'GCash', icon: FiCreditCard },
                      { value: 'paypal', label: 'PayPal', icon: FiCreditCard },
                      { value: 'bank_transfer', label: 'Bank Transfer', icon: FiCreditCard }
                    ].map((method) => {
                      const Icon = method.icon;
                      return (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.value }))}
                          className={`p-4 border-2 rounded-lg text-left transition-all ${
                            formData.paymentMethod === method.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center">
                            {typeof Icon === 'function' && Icon.name === 'PesoIcon' ? (
                              <Icon className={`text-lg font-bold mr-3 ${
                                formData.paymentMethod === method.value ? 'text-blue-600' : 'text-gray-500'
                              }`} />
                            ) : (
                              <Icon className={`w-5 h-5 mr-3 ${
                                formData.paymentMethod === method.value ? 'text-blue-600' : 'text-gray-500'
                              }`} />
                            )}
                            <span className={`font-medium ${
                              formData.paymentMethod === method.value ? 'text-blue-900' : 'text-gray-900'
                            }`}>
                              {method.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Any special instructions for your order..."
                  />
                </div>
              </div>
            ) : (
              /* Step 2: Order Review */
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Review</h3>
                  
                  {/* Cart Items */}
                  <div className="space-y-3 mb-6">
                    {cartItems.map((item, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                          {item.image_url || item.image ? (
                            <img 
                              src={item.image_url || item.image} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FiPackage className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{item.name}</div>
                          <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                          <div className="text-sm text-gray-600">From: {item.seller_name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">
                            ₱{(item.price * item.quantity).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Shipping Information Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Shipping Information</h4>
                    <div className="text-sm text-gray-600">
                      <div>{formData.name}</div>
                      <div>{formData.street}</div>
                      <div>{formData.city}, {formData.province} {formData.postalCode}</div>
                      <div>{formData.phone}</div>
                      <div>{formData.email}</div>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Order Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="text-gray-900">₱{subtotal.toLocaleString()}</span>
                      </div>
                      {shippingFee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Transaction Fee:</span>
                          <span className="text-gray-900">₱{shippingFee.toLocaleString()}</span>
                        </div>
                      )}
                      {taxAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax (12%):</span>
                          <span className="text-gray-900">₱{taxAmount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-900">Total:</span>
                          <span className="font-bold text-gray-900">₱{totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <button
              onClick={currentStep === 1 ? onClose : handlePrevious}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {currentStep === 1 ? 'Cancel' : 'Previous'}
            </button>
            
            <div className="flex space-x-3">
              {currentStep === 1 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <span>Next</span>
                  <FiCheck className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <FiShoppingCart className="w-4 h-4" />
                      <span>Place Order</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CheckoutModal;
