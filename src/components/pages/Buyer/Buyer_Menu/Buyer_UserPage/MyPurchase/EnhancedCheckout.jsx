/**
 * Enhanced Checkout Page Component
 *
 * This component provides a comprehensive checkout experience with:
 * - Dynamic address management
 * - Real-time payment fee calculation
 * - Better UI/UX design
 * - Proper error handling
 * - Mobile-responsive design
 *
 * @version 2.0.0 - Enhanced checkout with address management
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BuyerLayout from '../../Buyer_Layout/Buyer_layout';
import { theme } from '../../../../../../styles/designSystem';
import { useAuth } from '../../../../../../contexts/AuthContext';
import { useCart } from '../../../../../../contexts/CartContext';
import orderService from '../../../../../../services/orderService';
import paymentService from '../../../../../../services/paymentService';
import addressService from '../../../../../../services/addressService';
import { useToast } from '../../../../../../components/Toast';

const EnhancedCheckout = () => {
  const { user } = useAuth();
  const { clearCart } = useCart();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // State management
  const [payment, setPayment] = useState('cod');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFee, setSelectedFee] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type: 'home',
    name: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    barangay: '',
    city: '',
    province: '',
    zip_code: '',
    isDefault: false
  });

  // Get order data from cart navigation
  const cartData = location.state;
  const orderData = cartData ? {
    items: cartData.selectedItems || [],
    isBarter: cartData.isBarter || false,
    total: cartData.total || 0,
    deliveryFee: cartData.isBarter ? 0 : 50
  } : null;

  // Calculate totals
  const itemTotal = orderData?.items ? 
    orderData.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0) : 0;
  const grandTotal = orderData?.isBarter ? 0 : itemTotal + (orderData?.deliveryFee || 0);

  // Load user addresses
  useEffect(() => {
    const loadAddresses = async () => {
      if (!user) return;

      try {
        const result = await addressService.getUserAddresses(user.uid);
        if (result.success) {
          setAddresses(result.data);
          const defaultAddr = result.data.find(addr => addr.isDefault);
          if (defaultAddr) {
            setSelectedAddress(defaultAddr);
          }
        }
      } catch (error) {
        console.error('Error loading addresses:', error);
      }
    };

    loadAddresses();
  }, [user]);

  // Calculate payment fee when payment method changes
  useEffect(() => {
    if (payment && payment !== 'cod' && grandTotal > 0) {
      const feeInfo = paymentService.calculateFee(payment, grandTotal);
      setSelectedFee(feeInfo);
    } else {
      setSelectedFee(null);
    }
  }, [payment, grandTotal]);

  // Handle address selection
  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setShowAddressModal(false);
  };

  // Handle new address creation
  const handleCreateAddress = async (e) => {
    e.preventDefault();
    
    if (!user) {
      showToast('Please log in to add an address', 'error');
      return;
    }

    const validation = addressService.validateAddress(newAddress);
    if (!validation.isValid) {
      showToast(validation.errors[0], 'error');
      return;
    }

    try {
      const result = await addressService.createAddress(user.uid, newAddress);
      if (result.success) {
        setAddresses(prev => [...prev, result.data]);
        setSelectedAddress(result.data);
        setShowAddressModal(false);
        setNewAddress({
          type: 'home',
          name: '',
          phone: '',
          address_line_1: '',
          address_line_2: '',
          barangay: '',
          city: '',
          province: '',
          zip_code: '',
          isDefault: false
        });
        showToast('Address added successfully', 'success');
      } else {
        showToast(result.error, 'error');
      }
    } catch (error) {
      console.error('Error creating address:', error);
      showToast('Failed to create address', 'error');
    }
  };

  // Create order
  const createOrder = async (paymentId = null, paymentStatus = 'pending') => {
    if (!user) {
      setError('You must be logged in to place an order');
      return null;
    }

    if (!selectedAddress) {
      setError('Please select a delivery address');
      return null;
    }

    setLoading(true);
    setError('');

    try {
      const newOrderData = {
        buyerId: user.uid,
        sellerId: orderData?.items?.[0]?.sellerId || 'demo_seller',
        items: orderData?.items?.map(item => ({
          id: item.id || item.itemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity || item.qty || 1,
          image: item.image || '',
          sellerId: item.sellerId || 'demo_seller'
        })) || [],
        totalAmount: grandTotal,
        deliveryAddress: {
          name: selectedAddress.name,
          phone: selectedAddress.phone,
          address: addressService.formatAddress(selectedAddress),
          fullAddress: selectedAddress
        },
        paymentMethod: payment,
        paymentStatus: paymentStatus,
        paymentId: paymentId,
        deliveryFee: orderData?.deliveryFee || 0,
        paymentFee: selectedFee?.fee || 0,
        courierService: 'lalamove',
        buyerMessage: message,
        orderType: orderData?.isBarter ? 'barter' : 'purchase'
      };

      const result = await orderService.createOrder(newOrderData);

      if (result.success) {
        await clearCart();
        return result.orderId;
      } else {
        setError(result.error || 'Failed to create order');
        return null;
      }
    } catch (err) {
      console.error('Create order error:', err);
      setError(err.message || 'Failed to create order');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Handle order placement
  const handlePlaceOrder = async () => {
    if (!user) {
      setError('You must be logged in to place an order');
      return;
    }

    if (!selectedAddress) {
      setError('Please select a delivery address');
      return;
    }

    if (!orderData?.items || orderData.items.length === 0) {
      setError('No items to order');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (payment === 'cod') {
        const orderId = await createOrder(null, 'pending');
        if (orderId) {
          showToast('Order placed successfully!', 'success');
          navigate('/buyer/orders', {
            state: {
              orderSuccess: true,
              orderId: orderId,
              paymentMethod: 'cod'
            }
          });
        }
        return;
      }

      // For online payments
      const orderId = await createOrder(null, 'pending');
      if (!orderId) {
        setError('Failed to create order. Please try again.');
        return;
      }

      const paymentResult = await paymentService.createPaymentIntent({
        amount: grandTotal,
        currency: 'PHP',
        orderId: orderId,
        paymentMethod: payment,
        metadata: {
          buyerId: user.uid,
          itemCount: orderData.items.length
        }
      });

      if (!paymentResult.success) {
        setError(paymentResult.error || 'Failed to initialize payment');
        return;
      }

      if (paymentResult.data.requiresAction && paymentResult.data.nextActionUrl) {
        window.location.href = paymentResult.data.nextActionUrl;
      } else {
        showToast('Payment processed successfully!', 'success');
        navigate('/buyer/orders', {
          state: {
            orderSuccess: true,
            orderId: orderId,
            paymentMethod: payment,
            processing: true
          }
        });
      }
    } catch (err) {
      console.error('Place order error:', err);
      setError('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!orderData) {
    return (
      <BuyerLayout>
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background.accent }}>
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4" style={{ color: theme.colors.gray[800] }}>
              No items to checkout
            </h1>
            <p className="mb-6" style={{ color: theme.colors.gray[600] }}>
              Please add items to your cart first
            </p>
            <button
              onClick={() => navigate('/buyer/cart')}
              className="px-6 py-3 rounded-lg font-semibold text-white"
              style={{ backgroundColor: theme.colors.primary[600] }}
            >
              Go to Cart
            </button>
          </div>
        </div>
      </BuyerLayout>
    );
  }

  return (
    <BuyerLayout>
      <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.accent }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.primary[600]} 0%, ${theme.colors.secondary[500]} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {orderData.isBarter ? '🔄 Barter Checkout' : '🛒 Checkout'}
            </h1>
            <p style={{ color: theme.colors.gray[600] }} className="text-lg">
              {orderData.isBarter ? 'Complete your barter exchange' : 'Review your order and complete your purchase'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Address */}
              <div 
                className="overflow-hidden" 
                style={{
                  backgroundColor: theme.colors.white,
                  borderRadius: theme.borderRadius['2xl'],
                  boxShadow: theme.shadows.lg,
                  border: `1px solid ${theme.colors.gray[200]}`
                }}
              >
                <div className="p-6">
                  <div 
                    className="mb-4 flex items-center gap-3"
                    style={{
                      fontSize: theme.typography.fontSize.xl,
                      fontWeight: theme.typography.fontWeight.bold,
                      color: theme.colors.primary[600]
                    }}
                  >
                    <span>📍</span> Delivery Address
                  </div>

                  {selectedAddress ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg" style={{ backgroundColor: theme.colors.primary[50] }}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">
                                {addressService.getAddressTypes().find(t => t.value === selectedAddress.type)?.icon}
                              </span>
                              <span 
                                className="font-semibold"
                                style={{ color: theme.colors.gray[800] }}
                              >
                                {selectedAddress.name}
                              </span>
                              {selectedAddress.isDefault && (
                                <span 
                                  className="px-2 py-1 text-xs rounded-full"
                                  style={{
                                    backgroundColor: theme.colors.primary[100],
                                    color: theme.colors.primary[700]
                                  }}
                                >
                                  Default
                                </span>
                              )}
                            </div>
                            <p style={{ color: theme.colors.gray[600] }} className="mb-1">
                              {selectedAddress.phone}
                            </p>
                            <p style={{ color: theme.colors.gray[700] }}>
                              {addressService.formatAddress(selectedAddress)}
                            </p>
                          </div>
                          <button
                            onClick={() => setShowAddressModal(true)}
                            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
                            style={{
                              color: theme.colors.primary[600],
                              backgroundColor: 'transparent',
                              border: `1px solid ${theme.colors.primary[200]}`
                            }}
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📍</div>
                      <p style={{ color: theme.colors.gray[600] }} className="mb-4">
                        No delivery address selected
                      </p>
                      <button
                        onClick={() => setShowAddressModal(true)}
                        className="px-6 py-3 rounded-lg font-semibold text-white"
                        style={{ backgroundColor: theme.colors.primary[600] }}
                      >
                        Add Address
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div 
                className="overflow-hidden" 
                style={{
                  backgroundColor: theme.colors.white,
                  borderRadius: theme.borderRadius['2xl'],
                  boxShadow: theme.shadows.lg,
                  border: `1px solid ${theme.colors.gray[200]}`
                }}
              >
                <div className="p-6">
                  <h3 
                    className="text-xl font-bold mb-4"
                    style={{ color: theme.colors.gray[800] }}
                  >
                    Order Items
                  </h3>
                  <div className="space-y-4">
                    {orderData.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 rounded-lg" style={{ backgroundColor: theme.colors.gray[50] }}>
                        <img 
                          src={item.image || '/placeholder-product.jpg'} 
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold" style={{ color: theme.colors.gray[800] }}>
                            {item.name}
                          </h4>
                          <p style={{ color: theme.colors.gray[600] }}>
                            Quantity: {item.quantity || 1}
                          </p>
                        </div>
                        <div className="text-right">
                          <p 
                            className="font-bold text-lg"
                            style={{ color: theme.colors.primary[600] }}
                          >
                            {orderData.isBarter ? 'Barter Only' : `₱${(item.price * (item.quantity || 1)).toLocaleString()}`}
                          </p>
                          {orderData.isBarter && (
                            <p 
                              className="text-sm"
                              style={{ color: theme.colors.secondary[600] }}
                            >
                              Barter only
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              {!orderData.isBarter && (
                <div 
                  className="overflow-hidden" 
                  style={{
                    backgroundColor: theme.colors.white,
                    borderRadius: theme.borderRadius['2xl'],
                    boxShadow: theme.shadows.lg,
                    border: `1px solid ${theme.colors.gray[200]}`
                  }}
                >
                  <div className="p-6">
                    <h3 
                      className="text-xl font-bold mb-4"
                      style={{ color: theme.colors.gray[800] }}
                    >
                      Payment Method
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {paymentService.getAvailablePaymentMethods().map(pm => (
                        <label 
                          key={pm.key} 
                          className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            payment === pm.key ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment"
                            value={pm.key}
                            checked={payment === pm.key}
                            onChange={() => setPayment(pm.key)}
                            className="w-4 h-4"
                            style={{ accentColor: theme.colors.primary[600] }}
                          />
                          <span className="text-2xl">{pm.icon}</span>
                          <div className="flex-1">
                            <div 
                              className="font-semibold"
                              style={{ 
                                color: payment === pm.key ? theme.colors.primary[600] : theme.colors.gray[800] 
                              }}
                            >
                              {pm.label}
                            </div>
                            <div className="text-sm" style={{ color: theme.colors.gray[600] }}>
                              {pm.description}
                            </div>
                            <div className="text-xs font-medium" style={{ color: theme.colors.gray[500] }}>
                              {pm.fee}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* Payment Fee Breakdown */}
                    {selectedFee && selectedFee.fee > 0 && (
                      <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: theme.colors.primary[50], border: `1px solid ${theme.colors.primary[200]}` }}>
                        <div className="flex justify-between text-sm mb-1">
                          <span style={{ color: theme.colors.gray[700] }}>Payment Fee:</span>
                          <span style={{ color: theme.colors.gray[800], fontWeight: theme.typography.fontWeight.semibold }}>
                            ₱{selectedFee.fee.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span style={{ color: theme.colors.gray[600] }}>You'll receive:</span>
                          <span style={{ color: theme.colors.success[600], fontWeight: theme.typography.fontWeight.bold }}>
                            ₱{selectedFee.netAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Message for Seller */}
              <div 
                className="overflow-hidden" 
                style={{
                  backgroundColor: theme.colors.white,
                  borderRadius: theme.borderRadius['2xl'],
                  boxShadow: theme.shadows.lg,
                  border: `1px solid ${theme.colors.gray[200]}`
                }}
              >
                <div className="p-6">
                  <h3 
                    className="text-xl font-bold mb-4"
                    style={{ color: theme.colors.gray[800] }}
                  >
                    Message for Seller
                  </h3>
                  <textarea
                    className="w-full min-h-[100px] resize-none rounded-lg p-4 transition-all duration-200"
                    style={{
                      border: `1px solid ${theme.colors.gray[300]}`,
                      backgroundColor: theme.colors.gray[50],
                      color: theme.colors.gray[800]
                    }}
                    placeholder="Leave a message for the seller (optional)"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="space-y-6">
              <div 
                className="overflow-hidden sticky top-6"
                style={{
                  backgroundColor: theme.colors.white,
                  borderRadius: theme.borderRadius['2xl'],
                  boxShadow: theme.shadows.lg,
                  border: `1px solid ${theme.colors.gray[200]}`
                }}
              >
                <div className="p-6">
                  <h3 
                    className="text-xl font-bold mb-4"
                    style={{ color: theme.colors.gray[800] }}
                  >
                    Order Summary
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span style={{ color: theme.colors.gray[600] }}>Subtotal</span>
                      <span style={{ color: theme.colors.gray[800] }}>
                        {orderData.isBarter ? 'Barter Only' : `₱${itemTotal.toLocaleString()}`}
                      </span>
                    </div>
                    
                    {!orderData.isBarter && (
                      <>
                        <div className="flex justify-between">
                          <span style={{ color: theme.colors.gray[600] }}>Transaction Fee</span>
                          <span style={{ color: theme.colors.gray[800] }}>
                            ₱{(orderData.deliveryFee || 0).toLocaleString()}
                          </span>
                        </div>
                        
                        {selectedFee && selectedFee.fee > 0 && (
                          <div className="flex justify-between">
                            <span style={{ color: theme.colors.gray[600] }}>Payment Fee</span>
                            <span style={{ color: theme.colors.gray[800] }}>
                              ₱{selectedFee.fee.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    
                    <div 
                      className="flex justify-between pt-3 border-t-2"
                      style={{ borderColor: theme.colors.gray[200] }}
                    >
                      <span 
                        className="text-lg font-bold"
                        style={{ color: theme.colors.gray[800] }}
                      >
                        Total
                      </span>
                      <span 
                        className="text-lg font-bold"
                        style={{ color: theme.colors.primary[600] }}
                      >
                        {orderData.isBarter ? 'Barter Only' : `₱${grandTotal.toLocaleString()}`}
                      </span>
                    </div>
                    
                    {orderData.isBarter && (
                      <div 
                        className="text-center text-sm mt-2"
                        style={{ color: theme.colors.secondary[600] }}
                      >
                        Barter only
                      </div>
                    )}
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: theme.colors.error[50], border: `1px solid ${theme.colors.error[200]}` }}>
                      <p style={{ color: theme.colors.error[600] }} className="text-sm">
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Place Order Button */}
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading || !selectedAddress}
                    className="w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    style={{
                      backgroundColor: loading || !selectedAddress ? theme.colors.gray[400] : theme.colors.success[600],
                      color: theme.colors.white,
                      boxShadow: theme.shadows.lg
                    }}
                  >
                    {loading ? 'Processing...' : orderData.isBarter ? 'Complete Barter' : 'Place Order'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Address Modal */}
          {showAddressModal && (
            <AddressModal
              addresses={addresses}
              newAddress={newAddress}
              setNewAddress={setNewAddress}
              onSelect={handleAddressSelect}
              onCreate={handleCreateAddress}
              onClose={() => setShowAddressModal(false)}
            />
          )}
        </div>
      </div>
    </BuyerLayout>
  );
};

// Address Modal Component
const AddressModal = ({ addresses, newAddress, setNewAddress, onSelect, onCreate, onClose }) => {
  const [showNewForm, setShowNewForm] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: theme.shadows['2xl'] }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 
              className="text-2xl font-bold"
              style={{ color: theme.colors.gray[800] }}
            >
              Select Delivery Address
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
          </div>

          {!showNewForm ? (
            <div className="space-y-4">
              {addresses.map(address => (
                <div 
                  key={address.id}
                  onClick={() => onSelect(address)}
                  className="p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:border-primary-300"
                  style={{ 
                    borderColor: theme.colors.gray[200],
                    backgroundColor: theme.colors.gray[50]
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">
                          {addressService.getAddressTypes().find(t => t.value === address.type)?.icon}
                        </span>
                        <span className="font-semibold" style={{ color: theme.colors.gray[800] }}>
                          {address.name}
                        </span>
                        {address.isDefault && (
                          <span 
                            className="px-2 py-1 text-xs rounded-full"
                            style={{
                              backgroundColor: theme.colors.primary[100],
                              color: theme.colors.primary[700]
                            }}
                          >
                            Default
                          </span>
                        )}
                      </div>
                      <p style={{ color: theme.colors.gray[600] }} className="mb-1">
                        {address.phone}
                      </p>
                      <p style={{ color: theme.colors.gray[700] }}>
                        {addressService.formatAddress(address)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setShowNewForm(true)}
                className="w-full p-4 rounded-lg border-2 border-dashed transition-all duration-200 hover:border-primary-400 hover:bg-primary-50"
                style={{ 
                  borderColor: theme.colors.gray[300],
                  color: theme.colors.gray[600]
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">+</span>
                  <span>Add New Address</span>
                </div>
              </button>
            </div>
          ) : (
            <form onSubmit={onCreate} className="space-y-4">
              <h3 className="text-lg font-semibold" style={{ color: theme.colors.gray[800] }}>
                Add New Address
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.gray[700] }}>
                    Address Type
                  </label>
                  <select
                    value={newAddress.type}
                    onChange={e => setNewAddress({...newAddress, type: e.target.value})}
                    className="w-full p-3 rounded-lg border"
                    style={{ borderColor: theme.colors.gray[300] }}
                  >
                    {addressService.getAddressTypes().map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.gray[700] }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newAddress.name}
                    onChange={e => setNewAddress({...newAddress, name: e.target.value})}
                    className="w-full p-3 rounded-lg border"
                    style={{ borderColor: theme.colors.gray[300] }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.gray[700] }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={newAddress.phone}
                    onChange={e => setNewAddress({...newAddress, phone: e.target.value})}
                    className="w-full p-3 rounded-lg border"
                    style={{ borderColor: theme.colors.gray[300] }}
                    placeholder="+63 912 345 6789"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.gray[700] }}>
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    value={newAddress.zip_code}
                    onChange={e => setNewAddress({...newAddress, zip_code: e.target.value})}
                    className="w-full p-3 rounded-lg border"
                    style={{ borderColor: theme.colors.gray[300] }}
                    placeholder="6000"
                    maxLength="4"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.gray[700] }}>
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    value={newAddress.address_line_1}
                    onChange={e => setNewAddress({...newAddress, address_line_1: e.target.value})}
                    className="w-full p-3 rounded-lg border"
                    style={{ borderColor: theme.colors.gray[300] }}
                    placeholder="Street address, building name"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.gray[700] }}>
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={newAddress.address_line_2}
                    onChange={e => setNewAddress({...newAddress, address_line_2: e.target.value})}
                    className="w-full p-3 rounded-lg border"
                    style={{ borderColor: theme.colors.gray[300] }}
                    placeholder="Unit, floor, etc. (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.gray[700] }}>
                    Barangay
                  </label>
                  <input
                    type="text"
                    value={newAddress.barangay}
                    onChange={e => setNewAddress({...newAddress, barangay: e.target.value})}
                    className="w-full p-3 rounded-lg border"
                    style={{ borderColor: theme.colors.gray[300] }}
                    placeholder="Barangay name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.gray[700] }}>
                    City *
                  </label>
                  <input
                    type="text"
                    value={newAddress.city}
                    onChange={e => setNewAddress({...newAddress, city: e.target.value})}
                    className="w-full p-3 rounded-lg border"
                    style={{ borderColor: theme.colors.gray[300] }}
                    placeholder="Cebu City"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.gray[700] }}>
                    Province *
                  </label>
                  <select
                    value={newAddress.province}
                    onChange={e => setNewAddress({...newAddress, province: e.target.value})}
                    className="w-full p-3 rounded-lg border"
                    style={{ borderColor: theme.colors.gray[300] }}
                    required
                  >
                    <option value="">Select Province</option>
                    {addressService.getProvinces().map(province => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={newAddress.isDefault}
                  onChange={e => setNewAddress({...newAddress, isDefault: e.target.checked})}
                  className="w-4 h-4"
                  style={{ accentColor: theme.colors.primary[600] }}
                />
                <label htmlFor="isDefault" className="text-sm" style={{ color: theme.colors.gray[700] }}>
                  Set as default address
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="flex-1 py-3 rounded-lg font-semibold transition-colors duration-200"
                  style={{
                    color: theme.colors.gray[600],
                    backgroundColor: 'transparent',
                    border: `1px solid ${theme.colors.gray[300]}`
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-lg font-semibold text-white transition-colors duration-200"
                  style={{ backgroundColor: theme.colors.primary[600] }}
                >
                  Add Address
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedCheckout;
