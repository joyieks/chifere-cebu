import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import otpService from '../../../services/otpService';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/Toast';

const OTPVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { showToast } = useToast();
  
  // Get data passed from signup
  const { email, userType, firstName, registeredUserId } = location.state || {};
  
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    // If no email, redirect back to signup
    if (!email) {
      console.log('❌ No email found, redirecting to signup');
      navigate('/signup');
      return;
    }
    
    console.log('✅ OTP Verification page loaded for:', email);
    
    // Focus first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [email, navigate]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }

    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newOtp = pastedData.split('');
    
    if (newOtp.length === 6) {
      setOtpCode(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const verifyOTP = async () => {
    const code = otpCode.join('');
    
    if (code.length !== 6) {
      showToast('Please enter all 6 digits', 'error');
      return;
    }

    setIsVerifying(true);
    console.log('🔍 [OTPVerification] Verifying code:', code);

    try {
      const result = await otpService.verifyOTP(email, code, 'verification');
      
      if (result.success) {
        showToast('Email verified successfully!', 'success');
        
        // Wait a bit for toast to show
        setTimeout(() => {
          if (userType === 'seller') {
            // For sellers, go to pending review screen
            navigate('/pending-review', { 
              state: { 
                email, 
                message: 'Your account is pending admin approval.' 
              } 
            });
          } else {
            // For buyers, redirect to login
            navigate('/login', { 
              state: { 
                message: 'Account created successfully! Please login.' 
              } 
            });
          }
        }, 1500);
      } else {
        showToast(result.error || 'Invalid OTP code. Please try again.', 'error');
        setOtpCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('❌ [OTPVerification] Verification error:', error);
      showToast('Verification failed. Please try again.', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const resendOTP = async () => {
    setIsResending(true);
    console.log('🔄 [OTPVerification] Resending OTP to:', email);

    try {
      const result = await otpService.generateAndSendOTP(
        email,
        userType,
        'verification',
        firstName
      );

      if (result.success) {
        showToast('New OTP code sent to your email!', 'success');
        setOtpCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        showToast('Failed to resend OTP. Please try again.', 'error');
      }
    } catch (error) {
      console.error('❌ [OTPVerification] Resend error:', error);
      showToast('Failed to resend OTP. Please try again.', 'error');
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToSignup = () => {
    navigate('/signup');
  };

  // If no email data, show error
  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="text-center p-8">
          <p className="text-gray-600 mb-4">No verification data found.</p>
          <button
            onClick={() => navigate('/signup')}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Back to Signup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 px-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={handleBackToSignup}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Signup</span>
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-orange-100">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
              <Mail className="w-10 h-10 text-orange-600" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
            Verify Your Email
          </h2>
          <p className="text-center text-gray-600 mb-8">
            We've sent a 6-digit code to<br />
            <span className="font-semibold text-orange-600">{email}</span>
          </p>

          {/* OTP Input */}
          <div className="flex justify-center gap-3 mb-6">
            {otpCode.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                disabled={isVerifying}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            onClick={verifyOTP}
            disabled={isVerifying || otpCode.join('').length !== 6}
            className="w-full py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mb-4"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify OTP Code'
            )}
          </button>

          {/* Resend Button */}
          <button
            onClick={resendOTP}
            disabled={isResending}
            className="w-full py-3 border-2 border-orange-600 text-orange-600 font-semibold rounded-lg hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isResending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              'Resend Code'
            )}
          </button>

          {/* Help Text */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Didn't receive the code? Check your spam folder or click resend.
          </p>
        </div>

        {/* Debug Info (remove in production) */}
        <div className="mt-4 text-center text-xs text-gray-400">
          <p>Email: {email}</p>
          <p>User Type: {userType}</p>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
