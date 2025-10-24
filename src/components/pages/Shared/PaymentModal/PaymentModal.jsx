/**
 * Payment Modal Component
 * 
 * Handles online payment processing with different validation rules:
 * - Bank Cards: 16-digit card number + 6-digit passcode
 * - E-wallets: Phone number + 4-digit passcode
 * 
 * Features:
 * - Dynamic form based on payment method
 * - Real-time validation
 * - Payment processing simulation
 * - Success/error handling
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, 
  FiCreditCard, 
  FiPhone, 
  FiLock, 
  FiCheckCircle,
  FiAlertCircle,
  FiLoader
} from 'react-icons/fi';

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  paymentMethod, 
  amount, 
  onPaymentSuccess,
  onPaymentError 
}) => {
  const [formData, setFormData] = useState({
    cardNumber: '',
    phoneNumber: '',
    passcode: ''
  });
  
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1); // 1: Number, 2: Loading, 3: Passcode, 4: Processing, 5: Success
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        cardNumber: '',
        phoneNumber: '',
        passcode: ''
      });
      setErrors({});
      setCurrentStep(1);
      setIsLoading(false);
      setCountdown(5);
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px';
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, [isOpen]);

  // Countdown timer for success modal
  useEffect(() => {
    if (currentStep === 5 && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (currentStep === 5 && countdown === 0) {
      onClose();
    }
  }, [currentStep, countdown, onClose]);

  // Get payment method info
  const getPaymentMethodInfo = () => {
    const methods = {
      'gcash': { 
        name: 'GCash', 
        icon: '📱', 
        type: 'ewallet',
        placeholder: '09XX XXX XXXX',
        description: 'Enter your GCash mobile number'
      },
      'maya': { 
        name: 'Maya/PayMaya', 
        icon: '💙', 
        type: 'ewallet',
        placeholder: '09XX XXX XXXX',
        description: 'Enter your Maya mobile number'
      },
      'grabpay': { 
        name: 'GrabPay', 
        icon: '🚗', 
        type: 'ewallet',
        placeholder: '09XX XXX XXXX',
        description: 'Enter your GrabPay mobile number'
      },
      'online_banking': { 
        name: 'Online Banking', 
        icon: '🏦', 
        type: 'bank',
        placeholder: '1234 5678 9012 3456',
        description: 'Enter your 16-digit card number'
      },
      'qr_ph': { 
        name: 'QR Ph', 
        icon: '📱', 
        type: 'ewallet',
        placeholder: '09XX XXX XXXX',
        description: 'Enter your QR Ph mobile number'
      }
    };
    return methods[paymentMethod] || methods['gcash'];
  };

  const paymentInfo = getPaymentMethodInfo();
  const isEWallet = paymentInfo.type === 'ewallet';
  const isBank = paymentInfo.type === 'bank';

  // Validation functions
  const validateCardNumber = (cardNumber) => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (!cleaned) return 'Card number is required';
    if (!/^\d{16}$/.test(cleaned)) return 'Card number must be 16 digits';
    return null;
  };

  const validatePhoneNumber = (phoneNumber) => {
    const cleaned = phoneNumber.replace(/\s/g, '');
    if (!cleaned) return 'Phone number is required';
    if (!/^09\d{9}$/.test(cleaned)) return 'Phone number must start with 09 and be 11 digits';
    return null;
  };

  const validatePasscode = (passcode, isBank) => {
    if (!passcode) return 'Passcode is required';
    const expectedLength = isBank ? 6 : 4;
    if (passcode.length !== expectedLength) {
      return `Passcode must be ${expectedLength} digits`;
    }
    if (!/^\d+$/.test(passcode)) return 'Passcode must contain only numbers';
    return null;
  };

  // Step progression functions
  const handleNumberSubmit = async () => {
    const field = isBank ? 'cardNumber' : 'phoneNumber';
    const value = isBank ? formData.cardNumber : formData.phoneNumber;
    
    let error = null;
    if (isBank) {
      error = validateCardNumber(value);
    } else {
      error = validatePhoneNumber(value);
    }
    
    if (error) {
      setErrors({ [field]: error });
      return;
    }
    
    // Move to loading step
    setCurrentStep(2);
    setIsLoading(true);
    
    // Simulate loading for 3 seconds
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep(3);
    }, 3000);
  };

  const handlePasscodeSubmit = async () => {
    const error = validatePasscode(formData.passcode, isBank);
    
    if (error) {
      setErrors({ passcode: error });
      return;
    }
    
    // Move to processing step
    setCurrentStep(4);
    setIsLoading(true);
    
    // Simulate payment processing for 2 seconds
    setTimeout(async () => {
      setIsLoading(false);
      
      // Simulate random success/failure (90% success rate)
      const isSuccess = Math.random() > 0.1;
      
      if (isSuccess) {
        setCurrentStep(5);
        onPaymentSuccess({
          paymentMethod,
          amount,
          transactionId: `TXN${Date.now()}`,
          timestamp: new Date().toISOString()
        });
      } else {
        onPaymentError('Payment failed. Please try again.');
      }
    }, 2000);
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    let processedValue = value;

    // Format card number with spaces
    if (field === 'cardNumber') {
      processedValue = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
      if (processedValue.length > 19) return; // Max 16 digits + 3 spaces
    }

    // Format phone number with spaces
    if (field === 'phoneNumber') {
      processedValue = value.replace(/\D/g, '');
      if (processedValue.length > 11) return; // Max 11 digits
      if (processedValue.length > 4) {
        processedValue = processedValue.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
      }
    }

    // Limit passcode length
    if (field === 'passcode') {
      const maxLength = isBank ? 6 : 4;
      processedValue = value.replace(/\D/g, '').slice(0, maxLength);
    }

    setFormData(prev => ({ ...prev, [field]: processedValue }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Keypad component for passcode entry
  const Keypad = ({ onNumberClick, onBackspace, onSubmit, value, maxLength }) => {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
    
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-mono tracking-widest mb-2">
            {value.split('').map((digit, index) => (
              <span key={index} className="inline-block w-8 h-8 border-b-2 border-gray-400 mx-1">
                {digit}
              </span>
            ))}
            {Array.from({ length: maxLength - value.length }).map((_, index) => (
              <span key={index} className="inline-block w-8 h-8 border-b-2 border-gray-300 mx-1">
                &nbsp;
              </span>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
          {numbers.map(num => (
            <button
              key={num}
              onClick={() => onNumberClick(num.toString())}
              disabled={value.length >= maxLength}
              className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-lg disabled:opacity-50"
            >
              {num}
            </button>
          ))}
          <button
            onClick={onBackspace}
            className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-lg"
          >
            ⌫
          </button>
          <button
            onClick={onSubmit}
            disabled={value.length !== maxLength}
            className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg disabled:opacity-50 col-span-2"
          >
            ✓
          </button>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ 
          zIndex: 9999,
          pointerEvents: 'auto'
        }}
      >
        {/* Backdrop - Enhanced to block all interactions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-md"
          onClick={onClose}
          style={{ 
            pointerEvents: 'auto',
            zIndex: 1,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh'
          }}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-gray-50 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          style={{ zIndex: 2 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{paymentInfo.icon}</span>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {paymentInfo.name} Payment
                </h2>
                <p className="text-sm text-gray-600">
                  Amount: ₱{parseFloat(amount).toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Step 1: Enter Number */}
          {currentStep === 1 && (
            <div className="p-6">
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  {paymentInfo.description}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isBank ? (
                      <>
                        <FiCreditCard className="inline w-4 h-4 mr-1" />
                        Card Number
                      </>
                    ) : (
                      <>
                        <FiPhone className="inline w-4 h-4 mr-1" />
                        Mobile Number
                      </>
                    )}
                  </label>
                  <input
                    type="text"
                    value={isBank ? formData.cardNumber : formData.phoneNumber}
                    onChange={(e) => handleInputChange(
                      isBank ? 'cardNumber' : 'phoneNumber', 
                      e.target.value
                    )}
                    placeholder={paymentInfo.placeholder}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[isBank ? 'cardNumber' : 'phoneNumber'] 
                        ? 'border-red-500' 
                        : 'border-gray-300'
                    }`}
                  />
                  {errors[isBank ? 'cardNumber' : 'phoneNumber'] && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="w-4 h-4 mr-1" />
                      {errors[isBank ? 'cardNumber' : 'phoneNumber']}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNumberSubmit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Loading */}
          {currentStep === 2 && (
            <div className="p-6 text-center">
              <div className="mb-4">
                <FiLoader className="w-16 h-16 text-blue-500 mx-auto animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Verifying {paymentInfo.name}...
              </h3>
              <p className="text-gray-600">
                Please wait while we verify your {isBank ? 'card' : 'account'}.
              </p>
            </div>
          )}

          {/* Step 3: Passcode Entry */}
          {currentStep === 3 && (
            <div className="p-6">
              <div className="mb-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Enter Your Passcode
                </h3>
                <p className="text-sm text-gray-600">
                  Enter your {isBank ? '6' : '4'}-digit passcode
                </p>
              </div>

              <Keypad
                onNumberClick={(num) => handleInputChange('passcode', formData.passcode + num)}
                onBackspace={() => handleInputChange('passcode', formData.passcode.slice(0, -1))}
                onSubmit={handlePasscodeSubmit}
                value={formData.passcode}
                maxLength={isBank ? 6 : 4}
              />

              {errors.passcode && (
                <p className="mt-4 text-sm text-red-600 flex items-center justify-center">
                  <FiAlertCircle className="w-4 h-4 mr-1" />
                  {errors.passcode}
                </p>
              )}

              <div className="mt-6">
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Processing Payment */}
          {currentStep === 4 && (
            <div className="p-6 text-center">
              <div className="mb-4">
                <FiLoader className="w-16 h-16 text-blue-500 mx-auto animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Processing Payment...
              </h3>
              <p className="text-gray-600">
                Please wait while we process your payment of ₱{parseFloat(amount).toLocaleString()}.
              </p>
            </div>
          )}

          {/* Step 5: Success */}
          {currentStep === 5 && (
            <div className="p-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mb-4"
              >
                <FiCheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              </motion.div>
              <h3 className="text-2xl font-bold text-green-600 mb-2">
                Payment Successful!
              </h3>
              <p className="text-gray-600 mb-4">
                Your payment has been processed successfully.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-700">
                  Redirecting to dashboard in {countdown} seconds...
                </p>
              </div>
              <div className="flex justify-center">
                <div className="w-8 h-8 border-4 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PaymentModal;
