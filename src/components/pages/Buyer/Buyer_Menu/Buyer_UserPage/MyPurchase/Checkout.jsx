/**
 * Checkout Page Component
 *
 * This component follows the ChiFere design system established in /styles/designSystem.js
 *
 * Payment Integration:
 * - Generic payment processing
 * - Supports multiple payment methods
 * - Direct checkout for COD
 *
 * Design System Usage:
 * - Colors: Uses theme.colors tokens for consistent branding
 * - Typography: Applies theme.typography for font sizes and weights
 * - Spacing: Uses theme.spacing for consistent margins and padding
 * - Shadows: Applies theme.shadows for card elevation
 * - Border Radius: Uses theme.borderRadius for consistent corners
 * - Animations: Uses theme.animations for smooth transitions
 *
 * Key Features:
 * - Fully responsive design using Tailwind breakpoints
 * - Multiple payment methods
 * - Real-time fee calculation
 * - Payment method recommendations
 * - Interactive elements with hover states
 * - Proper focus states for accessibility
 *
 * @version 4.0.0 - Generic payment service (PayMongo removed)
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
import { supabase } from '../../../../../../config/supabase';
import AddressSelectionModal from './AddressSelectionModal';
import PaymentModal from '../../../../Shared/PaymentModal/PaymentModal';

// TODO: Firebase Implementation - Replace with real data from Firestore
// This demo data should be replaced with actual order data from the database
const demoOrder = {
  address: {
    name: 'Joan Joy Diocampo',
    phone: '(+63) 9981921194',
    address: '7th street Hagdanan, San Antonio Village Apas Cebu City, Apas, Cebu City, Visayas, Cebu, 6000',
    isDefault: true,
  },
  store: {
    name: 'Brilliant Channel',
    chat: true,
  },
  items: [
    {
      id: 'cam1',
      name: 'Canon EOS 2000D Camera With 18-55 DC III KIT ...',
      image: 'https://cdn.shopify.com/s/files/1/0275/3649/5399/products/Canon-EOS-2000D-18-55mm-III-Kit-DSLR-Camera-Black-1_600x.jpg',
      price: 21900,
      qty: 1,
    },
  ],
  voucher: 0,
  deliveryFee: 50,
};

// Get available payment methods from service
const paymentMethods = paymentService.getAvailablePaymentMethods();


const CheckoutForm = () => {
  const { user } = useAuth();
  const { cart, clearCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [payment, setPayment] = useState('card'); // Default to card payment
  const [message, setMessage] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFee, setSelectedFee] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Add error boundary for theme
  if (!theme || !theme.colors) {
    console.error('Theme not loaded properly');
    return (
      <BuyerLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-red-600">Theme Error</h1>
            <p className="text-gray-600">Please refresh the page to reload the theme.</p>
          </div>
        </div>
      </BuyerLayout>
    );
  }

  // Load default address when component mounts
  useEffect(() => {
    const loadDefaultAddress = async () => {
      if (user) {
        try {
          const result = await addressService.getAddresses(user.uid, 'buyer');
          console.log('🏠 [Checkout] Address service result:', result);
          if (result.success && result.data.length > 0) {
            const defaultAddress = result.data.find(addr => addr.isDefault) || result.data[0];
            console.log('🏠 [Checkout] Selected address data:', defaultAddress);
            setSelectedAddress(defaultAddress);
          }
        } catch (error) {
          console.error('Error loading addresses:', error);
        }
      }
    };
    loadDefaultAddress();
  }, [user]);

  // Get order data from cart navigation or use real cart data
  const cartData = location.state;
  
  // Debug: Log cart data
  console.log('🛒 [Checkout] Cart data:', cart);
  console.log('🛒 [Checkout] Location state:', cartData);
  
  const orderData = cartData ? {
    items: cartData.selectedItems,
    isBarter: cartData.isBarter,
    total: cartData.total,
    deliveryFee: cartData.isBarter ? 0 : 50
  } : {
    // Use real cart data if available, otherwise use demo data
    items: cart && cart.length > 0 ? cart.map(item => {
      console.log('🛒 [Checkout] Mapping cart item:', item);
      return {
        id: item.id,
        name: item.name,
        image: item.image,
        price: parseFloat(item.price) || 0,
        qty: parseInt(item.quantity) || 1
      };
    }) : demoOrder.items, // Fallback to demo data if cart is empty
    isBarter: false,
    total: cart && cart.length > 0 ? cart.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return sum + (price * quantity);
    }, 0) : demoOrder.items.reduce((sum, item) => sum + (item.price * item.qty), 0),
    deliveryFee: 50
  };
  
  console.log('🛒 [Checkout] Final order data:', orderData);

  const itemTotal = orderData.items ? orderData.items.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.qty || item.quantity) || 1;
    console.log('🛒 [Checkout] Calculating item total:', { price, quantity, total: price * quantity });
    return sum + (price * quantity);
  }, 0) : 0;
  const grandTotal = orderData.isBarter ? 0 : itemTotal + orderData.deliveryFee;

  // Calculate fee when payment method changes
  useEffect(() => {
    if (payment && payment !== 'cod') {
      const feeInfo = paymentService.calculateFee(payment, grandTotal);
      setSelectedFee(feeInfo);
    } else {
      setSelectedFee(null);
    }
  }, [payment, grandTotal]);

  /**
   * Create order in Firestore
   */
  const createOrder = async (paymentId = null, paymentStatus = 'pending') => {
    if (!user) {
      setError('You must be logged in to place an order');
      return null;
    }

    setLoading(true);
    setError('');

    try {
      // Prepare order data
      console.log('🛒 [Checkout] User data for order:', {
        user: user,
        userId: user?.id,
        userUid: user?.uid,
        userEmail: user?.email
      });
      
      // 🔧 FIX: Get seller_id from products if not available in cart items
      const itemsWithSellerId = await Promise.all(
        orderData.items.map(async (item) => {
          let sellerId = item.sellerId || item.seller_id;
          
          // If no sellerId, fetch from ALL product tables
          if (!sellerId) {
            try {
              // Try products table first
              let { data: product, error } = await supabase
                .from('products')
                .select('seller_id')
                .eq('id', item.id || item.itemId)
                .single();
              
              // If not found, try seller_add_item_preloved
              if (error || !product?.seller_id) {
                console.log('🔍 [Checkout] Product not found in products table, trying seller_add_item_preloved');
                const { data: prelovedProduct, error: prelovedError } = await supabase
                  .from('seller_add_item_preloved')
                  .select('seller_id')
                  .eq('id', item.id || item.itemId)
                  .single();
                
                if (!prelovedError && prelovedProduct?.seller_id) {
                  product = prelovedProduct;
                  error = null;
                }
              }
              
              // If still not found, try seller_add_barter_item
              if (error || !product?.seller_id) {
                console.log('🔍 [Checkout] Product not found in preloved table, trying seller_add_barter_item');
                const { data: barterProduct, error: barterError } = await supabase
                  .from('seller_add_barter_item')
                  .select('seller_id')
                  .eq('id', item.id || item.itemId)
                  .single();
                
                if (!barterError && barterProduct?.seller_id) {
                  product = barterProduct;
                  error = null;
                }
              }
              
              if (!error && product?.seller_id) {
                sellerId = product.seller_id;
                console.log('🔍 [Checkout] Got seller_id from product:', sellerId);
              } else {
                console.warn('⚠️ [Checkout] Could not find seller_id for product:', item.id, 'in any table');
              }
            } catch (error) {
              console.warn('⚠️ [Checkout] Could not fetch seller_id for product:', item.id, error);
            }
          }
          
          return {
            id: item.id || item.itemId,
            product_id: item.id || item.itemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity || item.qty || 1,
            qty: item.quantity || item.qty || 1,
            image: item.image || '',
            sellerId: sellerId,
            seller_id: sellerId
          };
        })
      );
      
      const newOrderData = {
        buyerId: user.id || user.uid, // Use user.id first, fallback to user.uid
        items: itemsWithSellerId,
        deliveryAddress: selectedAddress ? {
          name: selectedAddress.recipient_name,
          phone: selectedAddress.phone_number,
          address: `${selectedAddress.street_address}, ${selectedAddress.barangay ? selectedAddress.barangay + ', ' : ''}${selectedAddress.city}, ${selectedAddress.province}, ${selectedAddress.zip_code}`
        } : {
          name: demoOrder.address.name,
          phone: demoOrder.address.phone,
          address: demoOrder.address.address
        },
        paymentMethod: payment,
        paymentStatus: paymentStatus,
        paymentId: paymentId,
        deliveryFee: orderData.deliveryFee,
        courierService: 'lalamove', // Default courier
        buyerMessage: message
      };

      // Create order in database
      console.log('🛒 [Checkout] Creating order with data:', newOrderData);
      console.log('🛒 [Checkout] Order items data:', newOrderData.items);
      console.log('🛒 [Checkout] Buyer ID:', newOrderData.buyerId);
      console.log('🛒 [Checkout] Payment method:', newOrderData.paymentMethod);
      
      const result = await orderService.createOrder(newOrderData);
      console.log('🛒 [Checkout] Order creation result:', result);
      console.log('🛒 [Checkout] Order ID created:', result.orderId);

      if (result.success) {
        console.log('✅ [Checkout] Order created successfully with ID:', result.orderId);
        // Clear cart after successful order
        await clearCart();
        return result.orderId;
      } else {
        console.error('❌ [Checkout] Order creation failed:', result.error);
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

  /**
   * Handle payment and order placement
   */
  const handlePlaceOrder = async () => {
    if (!user) {
      setError('You must be logged in to place an order');
      return;
    }

    // For COD, create order directly
    if (payment === 'cod') {
      console.log('💰 [Checkout] Creating COD order...');
      setLoading(true);
      setError('');

      try {
        const orderId = await createOrder(null, 'pending');
        console.log('💰 [Checkout] COD order creation result:', orderId);

        if (orderId) {
          console.log('✅ [Checkout] COD order created successfully, clearing cart and navigating...');
          await clearCart();
          navigate('/buyer/purchase', {
            state: {
              orderSuccess: true,
              orderId: orderId,
              paymentMethod: 'cod'
            }
          });
        } else {
          console.error('❌ [Checkout] COD order creation failed');
        }
      } catch (error) {
        console.error('❌ [Checkout] COD order error:', error);
        setError('Failed to place order. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // For online payments, show payment modal
    setShowPaymentModal(true);
  };

  // Handle successful payment
  const handlePaymentSuccess = async (paymentData) => {
    console.log('💳 [Checkout] Payment successful, creating order:', paymentData);
    setLoading(true);
    setError('');

    try {
      // Create order with payment confirmation
      console.log('💳 [Checkout] Creating order with payment data...');
      const orderId = await createOrder(paymentData.transactionId, 'paid');
      console.log('💳 [Checkout] Order creation result:', orderId);

      if (orderId) {
        console.log('✅ [Checkout] Order created successfully, clearing cart and navigating...');
        await clearCart();
        setShowPaymentModal(false);
        navigate('/buyer/purchase', {
          state: {
            orderSuccess: true,
            orderId: orderId,
            paymentMethod: paymentData.paymentMethod,
            transactionNumber: paymentData.transactionId
          }
        });
      } else {
        console.error('❌ [Checkout] Order creation failed after payment');
      }
    } catch (error) {
      console.error('❌ [Checkout] Payment success error:', error);
      setError('Failed to create order after payment. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  // Handle payment error
  const handlePaymentError = (errorMessage) => {
    setError(errorMessage);
    setShowPaymentModal(false);
  };

  return (
    <BuyerLayout>
      <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.accent }}>
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
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
            Checkout
          </h1>
          <p style={{ color: theme.colors.gray[600] }} className="text-lg">
            Review your order and complete your purchase
          </p>
        </div>

        {/* Delivery Address */}
        <div 
          className="mb-6 overflow-hidden" 
          style={{
            backgroundColor: theme.colors.white,
            borderRadius: theme.borderRadius['2xl'],
            boxShadow: theme.shadows.lg,
            border: `1px solid ${theme.colors.gray[200]}`,
            padding: theme.spacing[6]
          }}
        >
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
          <div 
            className="p-4 rounded-xl border-2 border-dashed transition-all duration-200 hover:border-solid cursor-pointer group"
            style={{
              borderColor: selectedAddress ? theme.colors.primary[300] : theme.colors.gray[300],
              backgroundColor: selectedAddress ? theme.colors.primary[50] : theme.colors.gray[50]
            }}
            onClick={() => setShowAddressModal(true)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1" style={{ color: theme.colors.gray[800] }}>
                  {selectedAddress ? (selectedAddress.name || selectedAddress.recipient_name || 'Unknown') : 'Select Delivery Address'}
                </h3>
                {selectedAddress ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        (selectedAddress.type || 'home') === 'home' ? 'bg-green-100 text-green-700' :
                        (selectedAddress.type || 'home') === 'work' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {(selectedAddress.type || 'home').charAt(0).toUpperCase() + (selectedAddress.type || 'home').slice(1)}
                      </span>
                      {selectedAddress.isDefault && (
                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-semibold">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-1">{selectedAddress.phone || selectedAddress.phone_number || 'No phone'}</p>
                    <p className="text-gray-700">
                      {`${selectedAddress.address || selectedAddress.street_address || selectedAddress.address_line_1 || 'No address'}, ${selectedAddress.barangay ? selectedAddress.barangay + ', ' : ''}${selectedAddress.city || 'No city'}, ${selectedAddress.province || 'No province'}, ${selectedAddress.postal_code || selectedAddress.zip_code || 'No postal code'}`}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500">Click to choose your delivery address</p>
                )}
              </div>
              <div className="ml-4">
                <svg 
                  className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" 
                  style={{ color: theme.colors.primary[600] }}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        {/* Products Ordered */}
        <div 
          className="mb-6 overflow-hidden" 
          style={{
            backgroundColor: theme.colors.white,
            borderRadius: theme.borderRadius['2xl'],
            boxShadow: theme.shadows.lg,
            border: `1px solid ${theme.colors.gray[200]}`,
            padding: theme.spacing[6]
          }}
        >
          <div 
            className="mb-6"
            style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.gray[800]
            }}
          >
            Products Ordered
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span 
              style={{ 
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.gray[800]
              }}
            >
              {cartData ? 'Selected Store' : demoOrder.store.name}
            </span>
            {(!cartData || demoOrder.store.chat) && (
              <button 
                className="text-sm cursor-pointer transition-colors duration-200 hover:opacity-75"
                style={{ color: theme.colors.success[600] }}
              >
                💬 chat now
              </button>
            )}
          </div>
          {/* Product Details Header */}
          <div 
            className="flex items-center gap-4 pb-2 mb-4" 
            style={{ 
              borderBottom: `1px solid ${theme.colors.gray[200]}`,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.gray[600]
            }}
          >
            <div className="w-20"></div> {/* Image space */}
            <div className="flex-1 min-w-0">Product</div>
            <div className="w-24 text-right">Price</div>
            <div className="w-16 text-center">Qty</div>
            <div className="w-28 text-right">Total</div>
          </div>
          
          {/* Product Details */}
          {orderData.items && orderData.items.length > 0 ? (
            <div 
              className="flex flex-col sm:flex-row items-center gap-4 pb-4" 
              style={{ 
                borderBottom: `1px solid ${theme.colors.gray[200]}`,
                marginBottom: theme.spacing[4]
              }}
            >
              <img 
                src={orderData.items[0].image} 
                alt={orderData.items[0].name} 
                className="w-20 h-20 object-contain"
                style={{ borderRadius: theme.borderRadius.lg }}
              />
              <div className="flex-1 min-w-0">
                <div 
                  style={{ 
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.gray[800]
                  }}
                >
                  {orderData.items[0].name}
                </div>
              </div>
              <div 
                className="w-24 text-right"
                style={{ 
                  color: theme.colors.gray[600],
                  fontWeight: theme.typography.fontWeight.medium
                }}
              >
                ₱{(parseFloat(orderData.items[0].price) || 0).toLocaleString()}
              </div>
              <div 
                className="w-16 text-center"
                style={{ 
                  color: theme.colors.gray[600],
                  fontWeight: theme.typography.fontWeight.medium
                }}
              >
                {parseInt(orderData.items[0].qty || orderData.items[0].quantity) || 1}
              </div>
              <div 
                className="w-28 text-right"
                style={{ 
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.primary[600]
                }}
              >
                ₱{((parseFloat(orderData.items[0].price) || 0) * (parseInt(orderData.items[0].qty || orderData.items[0].quantity) || 1)).toLocaleString()}
              </div>
            </div>
          ) : (
            <div 
              className="text-center py-8"
              style={{ color: theme.colors.gray[500] }}
            >
              No items in cart
            </div>
          )}
        </div>
        {/* Payment Method */}
        <div 
          className="mb-6 overflow-hidden" 
          style={{
            backgroundColor: theme.colors.white,
            borderRadius: theme.borderRadius['2xl'],
            boxShadow: theme.shadows.lg,
            border: `1px solid ${theme.colors.gray[200]}`,
            padding: theme.spacing[6]
          }}
        >
          <div 
            className="mb-4"
            style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.gray[800]
            }}
          >
            Payment Method
          </div>
          <div className="space-y-3">
            {paymentMethods.map(pm => (
              <label key={pm.key} className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <input
                  type="radio"
                  name="payment"
                  value={pm.key}
                  checked={payment === pm.key}
                  onChange={() => setPayment(pm.key)}
                  className="w-4 h-4"
                  style={{ accentColor: theme.colors.primary[600] }}
                />
                <span className="text-xl">{pm.icon}</span>
                <div className="flex-1">
                  <div
                    className="transition-colors duration-200 group-hover:opacity-75"
                    style={{
                      color: payment === pm.key ? theme.colors.primary[600] : theme.colors.gray[800],
                      fontWeight: payment === pm.key ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.normal
                    }}
                  >
                    {pm.label}
                  </div>
                  <div className="text-xs" style={{ color: theme.colors.gray[500] }}>
                    {pm.description}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold" style={{ color: payment === pm.key ? theme.colors.primary[600] : theme.colors.gray[600] }}>
                    {pm.fee}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Show payment fee breakdown if applicable */}
          {selectedFee && (
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
        {/* Message for Seller */}
        <div 
          className="mb-6 overflow-hidden" 
          style={{
            backgroundColor: theme.colors.white,
            borderRadius: theme.borderRadius['2xl'],
            boxShadow: theme.shadows.lg,
            border: `1px solid ${theme.colors.gray[200]}`,
            padding: theme.spacing[6]
          }}
        >
          <div 
            className="mb-4"
            style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.gray[800]
            }}
          >
            Message for Seller
          </div>
          <textarea
            className="w-full min-h-[80px] resize-none transition-all duration-200"
            style={{
              border: `1px solid ${theme.colors.gray[300]}`,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing[3],
              fontSize: theme.typography.fontSize.base,
              backgroundColor: theme.colors.gray[50],
              color: theme.colors.gray[800]
            }}
            placeholder="Leave a message for the seller (optional)"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onFocus={(e) => {
              e.target.style.borderColor = theme.colors.primary[500];
              e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primary[100]}`;
              e.target.style.backgroundColor = theme.colors.white;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = theme.colors.gray[300];
              e.target.style.boxShadow = 'none';
              e.target.style.backgroundColor = theme.colors.gray[50];
            }}
          />
        </div>
        {/* Order Summary */}
        <div 
          className="mb-6 overflow-hidden" 
          style={{
            backgroundColor: theme.colors.white,
            borderRadius: theme.borderRadius['2xl'],
            boxShadow: theme.shadows.lg,
            border: `1px solid ${theme.colors.gray[200]}`,
            padding: theme.spacing[6]
          }}
        >
          <div 
            className="mb-4"
            style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.gray[800]
            }}
          >
            Order Summary
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span style={{ color: theme.colors.gray[600] }}>Item Total</span>
              <span style={{ color: theme.colors.gray[800] }}>₱{itemTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: theme.colors.gray[600] }}>Transaction Fee</span>
              <span style={{ color: theme.colors.gray[800] }}>₱{orderData.deliveryFee.toLocaleString()}</span>
            </div>
            <div 
              className="flex justify-between items-center pt-3"
              style={{ 
                borderTop: `1px solid ${theme.colors.gray[200]}`,
                marginTop: theme.spacing[3]
              }}
            >
              <span 
                style={{ 
                  fontSize: theme.typography.fontSize.xl,
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.gray[800]
                }}
              >
                Total
              </span>
              <span 
                style={{ 
                  fontSize: theme.typography.fontSize.xl,
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.primary[600]
                }}
              >
                ₱{grandTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Barter Notice for Barter Items */}
        {orderData.isBarter && (
          <div 
            className="mb-6 p-6 text-center"
            style={{
              backgroundColor: theme.colors.secondary[50],
              borderRadius: theme.borderRadius['2xl'],
              border: `2px solid ${theme.colors.secondary[200]}`
            }}
          >
            <div className="text-4xl mb-2">🔄</div>
            <div 
              style={{
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.secondary[700],
                marginBottom: theme.spacing[2]
              }}
            >
              Barter Exchange
            </div>
            <p style={{ color: theme.colors.secondary[600] }}>
              This is a barter transaction. No payment required - you'll exchange items directly with the seller.
            </p>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-600 text-lg mr-2">❌</span>
              <div>
                <h3 className="text-red-800 font-semibold">Error</h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Place Order Button */}
        <div className="flex justify-end">
          <button
            disabled={loading}
            className="transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              padding: `${theme.spacing[4]} ${theme.spacing[8]}`,
              backgroundColor: loading ? theme.colors.gray[400] : theme.colors.success[600],
              color: theme.colors.white,
              borderRadius: theme.borderRadius.full,
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = theme.colors.success[700];
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = theme.colors.success[600];
              }
            }}
            onClick={handlePlaceOrder}
          >
            {loading ? 'Processing...' : 'Place Order'}
          </button>
        </div>

        {/* Payment Status Messages */}
        {paymentStatus === 'success' && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-green-600 text-lg mr-2">✅</span>
              <div>
                <h3 className="text-green-800 font-semibold">Payment Successful!</h3>
                <p className="text-green-600 text-sm">Your order has been processed successfully.</p>
              </div>
            </div>
          </div>
        )}

        {paymentStatus === 'error' && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-600 text-lg mr-2">❌</span>
              <div>
                <h3 className="text-red-800 font-semibold">Payment Failed</h3>
                <p className="text-red-600 text-sm">Please check your card details and try again.</p>
              </div>
            </div>
          </div>
        )}

        {/* Address Selection Modal */}
        <AddressSelectionModal
          isOpen={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          onSelectAddress={setSelectedAddress}
          selectedAddressId={selectedAddress?.id}
        />

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          paymentMethod={payment}
          amount={grandTotal}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
        </div>
      </div>
    </BuyerLayout>
  );
};

export default CheckoutForm;
