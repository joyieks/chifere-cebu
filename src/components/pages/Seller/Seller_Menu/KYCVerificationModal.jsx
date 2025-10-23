import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiShield,
  FiCheckCircle,
  FiX,
  FiArrowRight,
  FiClock,
  FiAlertTriangle
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

/**
 * KYCVerificationModal Component
 *
 * Modal shown when seller tries to access features requiring KYC verification
 * Cannot be dismissed - user must take action or navigate away
 *
 * @param {boolean} isOpen - Whether modal is open
 * @param {Function} onClose - Callback to close modal
 * @param {string} kycStatus - Current KYC status: 'none' | 'pending' | 'rejected'
 * @param {string} action - What action was blocked (e.g., "add product")
 */
const KYCVerificationModal = ({
  isOpen,
  onClose,
  kycStatus = 'none',
  action = 'perform this action'
}) => {
  const navigate = useNavigate();

  const handleSubmitKYC = () => {
    navigate('/seller/settings?tab=verification');
    onClose();
  };

  const handleLearnMore = () => {
    // Could navigate to help center or show more info
    navigate('/help/kyc-verification');
  };

  // Modal content based on status
  const getModalContent = () => {
    switch (kycStatus) {
      case 'pending':
        return {
          icon: FiClock,
          iconColor: 'text-yellow-500',
          iconBg: 'bg-yellow-100',
          title: 'Verification In Progress',
          message: `Your KYC verification is currently being reviewed. You cannot ${action} until your account is verified.`,
          description: 'This usually takes 1-3 business days. We\'ll notify you via email once your account is approved.',
          primaryAction: 'View Status',
          primaryColor: 'bg-yellow-600 hover:bg-yellow-700',
          showSecondary: true,
          secondaryAction: 'Go Back'
        };

      case 'rejected':
        return {
          icon: FiAlertTriangle,
          iconColor: 'text-red-500',
          iconBg: 'bg-red-100',
          title: 'Verification Rejected',
          message: `Your KYC verification was not approved. You must resubmit your documents before you can ${action}.`,
          description: 'Please review the rejection reason in your settings and submit valid documents.',
          primaryAction: 'Resubmit Documents',
          primaryColor: 'bg-red-600 hover:bg-red-700',
          showSecondary: true,
          secondaryAction: 'View Details'
        };

      default: // 'none'
        return {
          icon: FiShield,
          iconColor: 'text-blue-500',
          iconBg: 'bg-blue-100',
          title: 'KYC Verification Required',
          message: `To ${action}, you need to complete KYC verification first.`,
          description: 'This helps us ensure a safe and trustworthy marketplace for all ChiFere users.',
          primaryAction: 'Submit Documents',
          primaryColor: 'bg-blue-600 hover:bg-blue-700',
          showSecondary: true,
          secondaryAction: 'Learn More'
        };
    }
  };

  if (!isOpen) return null;

  const content = getModalContent();
  const Icon = content.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-full ${content.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${content.iconColor}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{content.title}</h2>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 text-gray-400 hover:text-gray-600 transition"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 mb-3 font-medium">
                {content.message}
              </p>
              <p className="text-gray-600 text-sm mb-6">
                {content.description}
              </p>

              {/* Why KYC section */}
              {kycStatus === 'none' && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Why do we require KYC?</h3>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <FiCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">Verify seller identity and legitimacy</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <FiCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">Protect buyers from fraud and scams</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <FiCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">Build trust in the marketplace</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <FiCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">Comply with Philippine regulations</span>
                    </div>
                  </div>
                </div>
              )}

              {/* What you need section */}
              {kycStatus === 'none' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-blue-900 mb-2">What you'll need:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Government-issued ID (front and back)</li>
                    <li>• Business permit (optional but recommended)</li>
                    <li>• DTI registration (optional)</li>
                  </ul>
                  <p className="text-xs text-blue-700 mt-2">
                    Verification usually takes 1-3 business days
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleSubmitKYC}
                  className={`w-full ${content.primaryColor} text-white px-4 py-3 rounded-lg font-medium transition flex items-center justify-center space-x-2`}
                >
                  <span>{content.primaryAction}</span>
                  <FiArrowRight className="w-4 h-4" />
                </button>

                {content.showSecondary && (
                  <button
                    onClick={kycStatus === 'none' ? handleLearnMore : onClose}
                    className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
                  >
                    {content.secondaryAction}
                  </button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t">
              <p className="text-xs text-gray-500 text-center">
                Your documents are encrypted and securely stored. We only use them for verification purposes.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default KYCVerificationModal;
