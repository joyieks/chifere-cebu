import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiAlertCircle,
  FiClock,
  FiXCircle,
  FiCheckCircle,
  FiX,
  FiArrowRight
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

/**
 * VerificationBanner Component
 *
 * Displays KYC verification status banner for sellers
 * Shows different messages and actions based on verification status
 *
 * @param {string} status - KYC status: 'none' | 'pending' | 'rejected' | 'approved'
 * @param {string} rejectionReason - Reason for rejection (if status is 'rejected')
 * @param {boolean} dismissible - Whether banner can be dismissed
 * @param {Function} onDismiss - Callback when banner is dismissed
 */
const VerificationBanner = ({
  status = 'none',
  rejectionReason = '',
  dismissible = false,
  onDismiss
}) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);

  // Load dismissed state from localStorage
  useEffect(() => {
    if (dismissible && status === 'pending') {
      const dismissed = localStorage.getItem(`kyc_banner_dismissed_${status}`);
      if (dismissed) {
        setIsVisible(false);
      }
    }
  }, [status, dismissible]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (dismissible) {
      localStorage.setItem(`kyc_banner_dismissed_${status}`, 'true');
    }
    onDismiss && onDismiss();
  };

  const handleAction = () => {
    navigate('/seller/settings?tab=verification');
  };

  // Don't show banner if approved or dismissed
  if (status === 'approved' || !isVisible) {
    return null;
  }

  // Banner configurations based on status
  const bannerConfig = {
    none: {
      icon: FiAlertCircle,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-900',
      title: 'Complete KYC Verification to Start Selling',
      message: 'Submit your government ID and business documents to verify your seller account. This is required before you can list products on ChiFere.',
      actionText: 'Submit Documents',
      showAction: true
    },
    pending: {
      icon: FiClock,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-900',
      title: 'Verification In Progress',
      message: 'Your KYC documents are being reviewed by our team. This usually takes 1-3 business days. You\'ll be notified once your account is verified.',
      actionText: 'View Status',
      showAction: true
    },
    rejected: {
      icon: FiXCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      textColor: 'text-red-900',
      title: 'Verification Rejected',
      message: rejectionReason || 'Your KYC verification was not approved. Please review the reason below and resubmit your documents.',
      actionText: 'Resubmit Documents',
      showAction: true
    }
  };

  const config = bannerConfig[status] || bannerConfig.none;
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 mb-6`}
        >
          <div className="flex items-start space-x-4">
            {/* Icon */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className={`font-semibold ${config.textColor} mb-1`}>
                    {config.title}
                  </h3>
                  <p className={`text-sm ${config.textColor} opacity-90`}>
                    {config.message}
                  </p>

                  {/* Rejection reason */}
                  {status === 'rejected' && rejectionReason && (
                    <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
                      <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</p>
                      <p className="text-sm text-red-700">{rejectionReason}</p>
                    </div>
                  )}

                  {/* Action button */}
                  {config.showAction && (
                    <button
                      onClick={handleAction}
                      className={`mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        status === 'none'
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : status === 'pending'
                          ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      <span>{config.actionText}</span>
                      <FiArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Dismiss button */}
                {dismissible && (
                  <button
                    onClick={handleDismiss}
                    className={`p-1 ${config.iconColor} hover:opacity-70 transition`}
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Additional info for pending status */}
          {status === 'pending' && (
            <div className="mt-4 pt-4 border-t border-yellow-200">
              <div className="flex items-start space-x-3">
                <FiCheckCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">What happens next?</p>
                  <ul className="space-y-1 opacity-90">
                    <li>• Our team will review your submitted documents</li>
                    <li>• You'll receive an email notification once reviewed</li>
                    <li>• If approved, you can immediately start listing products</li>
                    <li>• If more information is needed, we'll contact you</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VerificationBanner;
