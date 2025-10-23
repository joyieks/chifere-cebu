/**
 * Payment Service
 *
 * Handles all payment-related operations with PayMongo.
 * Provides a clean interface for creating payment intents and managing payment status.
 *
 * PayMongo is a Philippines-based payment gateway supporting:
 * - Cards (Visa, Mastercard) - 3.5% + ₱15
 * - GCash - 2.5%
 * - Maya/PayMaya - 2.2%
 * - GrabPay - 2.0%
 * - Online Banking - ₱15 flat
 * - QR Ph - 1.5%
 *
 * Features:
 * - Create payment intents
 * - Handle payment confirmations
 * - Get payment status
 * - Error handling and logging
 *
 * @version 3.0.0 - Removed Firebase dependencies
 */

class PaymentService {
  /**
   * Create a payment intent for an order (Mock implementation)
   * @param {Object} paymentData - Payment details
   * @param {number} paymentData.amount - Amount in PHP (not centavos)
   * @param {string} paymentData.currency - Currency code (default: 'PHP')
   * @param {string} paymentData.orderId - Optional: Order ID
   * @param {string|string[]} paymentData.paymentMethod - Payment method(s) to allow
   * @param {Object} paymentData.metadata - Optional: Additional metadata
   * @returns {Promise<Object>} - Result with clientKey and paymentIntentId
   */
  async createPaymentIntent(paymentData) {
    try {
      const {
        amount,
        currency = 'PHP',
        orderId = null,
        paymentMethod = 'card',
        metadata = {}
      } = paymentData;

      // Validate input
      if (!amount || amount <= 0) {
        return {
          success: false,
          error: 'Invalid amount. Amount must be greater than 0.'
        };
      }

      // Mock payment intent creation
      const paymentIntentId = `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const clientKey = `pk_mock_${Math.random().toString(36).substr(2, 20)}`;

      // Store payment intent in localStorage for demo
      const paymentIntents = JSON.parse(localStorage.getItem('payment_intents') || '{}');
      paymentIntents[paymentIntentId] = {
        id: paymentIntentId,
        amount: amount * 100, // Convert to centavos
        currency,
        orderId,
        paymentMethod,
        metadata,
        status: 'requires_payment_method',
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('payment_intents', JSON.stringify(paymentIntents));

      return {
        success: true,
        clientKey,
        paymentIntentId,
        amount: amount * 100, // Return in centavos
        currency,
        message: 'Payment intent created successfully'
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return {
        success: false,
        error: 'Failed to create payment intent'
      };
    }
  }

  /**
   * Confirm a payment intent (Mock implementation)
   * @param {string} paymentIntentId - Payment intent ID
   * @param {Object} confirmationData - Payment confirmation data
   * @returns {Promise<Object>} - Payment confirmation result
   */
  async confirmPayment(paymentIntentId, confirmationData) {
    try {
      const paymentIntents = JSON.parse(localStorage.getItem('payment_intents') || '{}');
      const paymentIntent = paymentIntents[paymentIntentId];

      if (!paymentIntent) {
        return {
          success: false,
          error: 'Payment intent not found'
        };
      }

      // Mock payment confirmation
      paymentIntent.status = 'succeeded';
      paymentIntent.confirmedAt = new Date().toISOString();
      paymentIntent.confirmationData = confirmationData;
      
      paymentIntents[paymentIntentId] = paymentIntent;
      localStorage.setItem('payment_intents', JSON.stringify(paymentIntents));

      return {
        success: true,
        status: 'succeeded',
        message: 'Payment confirmed successfully'
      };
    } catch (error) {
      console.error('Error confirming payment:', error);
      return {
        success: false,
        error: 'Failed to confirm payment'
      };
    }
  }

  /**
   * Get payment intent status (Mock implementation)
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} - Payment status
   */
  async getPaymentStatus(paymentIntentId) {
    try {
      const paymentIntents = JSON.parse(localStorage.getItem('payment_intents') || '{}');
      const paymentIntent = paymentIntents[paymentIntentId];

      if (!paymentIntent) {
        return {
          success: false,
          error: 'Payment intent not found'
        };
      }

      return {
        success: true,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        createdAt: paymentIntent.createdAt,
        confirmedAt: paymentIntent.confirmedAt
      };
    } catch (error) {
      console.error('Error getting payment status:', error);
      return {
        success: false,
        error: 'Failed to get payment status'
      };
    }
  }

  /**
   * Cancel a payment intent (Mock implementation)
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} - Cancellation result
   */
  async cancelPayment(paymentIntentId) {
    try {
      const paymentIntents = JSON.parse(localStorage.getItem('payment_intents') || '{}');
      const paymentIntent = paymentIntents[paymentIntentId];

      if (!paymentIntent) {
        return {
          success: false,
          error: 'Payment intent not found'
        };
      }

      if (paymentIntent.status === 'succeeded') {
        return {
          success: false,
          error: 'Cannot cancel a successful payment'
        };
      }

      paymentIntent.status = 'canceled';
      paymentIntent.canceledAt = new Date().toISOString();
      
      paymentIntents[paymentIntentId] = paymentIntent;
      localStorage.setItem('payment_intents', JSON.stringify(paymentIntents));

      return {
        success: true,
        message: 'Payment canceled successfully'
      };
    } catch (error) {
      console.error('Error canceling payment:', error);
      return {
        success: false,
        error: 'Failed to cancel payment'
      };
    }
  }

  /**
   * Calculate payment fee for a given method and amount
   * @param {string} paymentMethod - Payment method
   * @param {number} amount - Amount in PHP
   * @returns {Object} - Fee calculation result
   */
  calculateFee(paymentMethod, amount) {
    const feeRates = {
      'card': { rate: 0.035, fixed: 15, min: 0 },
      'gcash': { rate: 0.025, fixed: 0, min: 0 },
      'maya': { rate: 0.022, fixed: 0, min: 0 },
      'grabpay': { rate: 0.020, fixed: 0, min: 0 },
      'online_banking': { rate: 0, fixed: 15, min: 0 },
      'qr_ph': { rate: 0.015, fixed: 0, min: 0 },
      'cod': { rate: 0, fixed: 0, min: 0 }
    };

    const config = feeRates[paymentMethod] || { rate: 0, fixed: 0, min: 0 };
    
    if (paymentMethod === 'cod') {
      return {
        fee: 0,
        netAmount: amount,
        feeRate: 0,
        feeType: 'none'
      };
    }

    const percentageFee = amount * config.rate;
    const totalFee = Math.max(percentageFee + config.fixed, config.min);
    const netAmount = amount - totalFee;

    return {
      fee: Math.round(totalFee * 100) / 100, // Round to 2 decimal places
      netAmount: Math.round(netAmount * 100) / 100,
      feeRate: config.rate,
      feeType: config.fixed > 0 ? 'percentage_plus_fixed' : 'percentage'
    };
  }

  /**
   * Get available payment methods (Static method)
   * @returns {Array} - Available payment methods
   */
  getAvailablePaymentMethods() {
    return [
      {
        key: 'cod',
        label: 'Cash on Delivery',
        icon: '💰',
        description: 'Pay when your order arrives',
        fee: 'No fee'
      },
      {
        key: 'card',
        label: 'Credit/Debit Card',
        icon: '💳',
        description: 'Visa, Mastercard accepted',
        fee: '3.5% + ₱15'
      },
      {
        key: 'gcash',
        label: 'GCash',
        icon: '📱',
        description: 'Pay with your GCash wallet',
        fee: '2.5%'
      },
      {
        key: 'maya',
        label: 'Maya/PayMaya',
        icon: '💙',
        description: 'Pay with Maya wallet',
        fee: '2.2%'
      },
      {
        key: 'grabpay',
        label: 'GrabPay',
        icon: '🚗',
        description: 'Pay with GrabPay wallet',
        fee: '2.0%'
      },
      {
        key: 'online_banking',
        label: 'Online Banking',
        icon: '🏦',
        description: 'Direct bank transfer',
        fee: '₱15 flat'
      },
      {
        key: 'qr_ph',
        label: 'QR Ph',
        icon: '📱',
        description: 'Scan QR code to pay',
        fee: '1.5%'
      }
    ];
  }

  /**
   * Get payment methods (Mock implementation)
   * @returns {Promise<Object>} - Available payment methods
   */
  async getPaymentMethods() {
    try {
      const paymentMethods = [
        {
          id: 'card',
          name: 'Credit/Debit Card',
          type: 'card',
          fee: '3.5% + ₱15',
          icon: '💳',
          enabled: true
        },
        {
          id: 'gcash',
          name: 'GCash',
          type: 'ewallet',
          fee: '2.5%',
          icon: '📱',
          enabled: true
        },
        {
          id: 'maya',
          name: 'Maya/PayMaya',
          type: 'ewallet',
          fee: '2.2%',
          icon: '💙',
          enabled: true
        },
        {
          id: 'grabpay',
          name: 'GrabPay',
          type: 'ewallet',
          fee: '2.0%',
          icon: '🚗',
          enabled: true
        },
        {
          id: 'online_banking',
          name: 'Online Banking',
          type: 'bank',
          fee: '₱15 flat',
          icon: '🏦',
          enabled: true
        },
        {
          id: 'qr_ph',
          name: 'QR Ph',
          type: 'qr',
          fee: '1.5%',
          icon: '📱',
          enabled: true
        }
      ];

      return {
        success: true,
        paymentMethods
      };
    } catch (error) {
      console.error('Error getting payment methods:', error);
      return {
        success: false,
        error: 'Failed to get payment methods'
      };
    }
  }
}

export default new PaymentService();