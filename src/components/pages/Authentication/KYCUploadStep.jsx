import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiUpload,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiFile,
  FiImage,
  FiTrash2,
  FiInfo
} from 'react-icons/fi';
import kycService from '../../../services/kycService';
import { theme } from '../../../styles/designSystem';

/**
 * KYCUploadStep Component
 *
 * Reusable component for KYC document upload
 * Used in: Seller signup (Step 2.5) and Settings page
 *
 * @param {string} userId - User ID (seller)
 * @param {Function} onComplete - Callback when KYC submitted successfully
 * @param {Function} onSkip - Callback when user skips (optional)
 * @param {boolean} isSettings - True if used in settings (no skip option)
 * @param {Object} existingDocs - Existing documents (for resubmission)
 */
const KYCUploadStep = ({
  userId,
  onComplete,
  onSkip,
  isSettings = false,
  existingDocs = null
}) => {
  const [documents, setDocuments] = useState({
    governmentIdFront: null,
    governmentIdBack: null,
    businessPermit: null,
    dtiRegistration: null
  });

  const [previews, setPreviews] = useState({
    governmentIdFront: existingDocs?.governmentId?.front || null,
    governmentIdBack: existingDocs?.governmentId?.back || null,
    businessPermit: existingDocs?.businessPermit?.url || null,
    dtiRegistration: existingDocs?.dtiRegistration?.url || null
  });

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState({});
  const [uploadedUrls, setUploadedUrls] = useState({});

  // Document type configurations
  const documentTypes = [
    {
      key: 'governmentIdFront',
      label: 'Government ID (Front)',
      description: 'Front side of your government-issued ID',
      required: true,
      acceptedTypes: ['Driver\'s License', 'Passport', 'National ID', 'Postal ID', 'SSS/GSIS ID']
    },
    {
      key: 'governmentIdBack',
      label: 'Government ID (Back)',
      description: 'Back side of your government-issued ID',
      required: true,
      acceptedTypes: ['Same as front side']
    },
    {
      key: 'businessPermit',
      label: 'Business Permit',
      description: 'Mayor\'s permit or business registration (Optional)',
      required: false,
      acceptedTypes: ['Business Permit', 'Mayor\'s Permit']
    },
    {
      key: 'dtiRegistration',
      label: 'DTI Registration',
      description: 'DTI or SEC registration certificate (Optional)',
      required: false,
      acceptedTypes: ['DTI Registration', 'SEC Certificate']
    }
  ];

  // Validate file
  const validateFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'Only images (JPG, PNG, WebP) and PDFs are allowed' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }

    return { valid: true };
  };

  // Handle file selection
  const handleFileChange = (documentKey, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setErrors(prev => ({ ...prev, [documentKey]: validation.error }));
      return;
    }

    // Clear error
    setErrors(prev => ({ ...prev, [documentKey]: '' }));

    // Store file
    setDocuments(prev => ({ ...prev, [documentKey]: file }));

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviews(prev => ({ ...prev, [documentKey]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // Remove file
  const removeFile = (documentKey) => {
    setDocuments(prev => ({ ...prev, [documentKey]: null }));
    setPreviews(prev => ({ ...prev, [documentKey]: null }));
    setErrors(prev => ({ ...prev, [documentKey]: '' }));
    setUploadedUrls(prev => ({ ...prev, [documentKey]: '' }));
  };

  // Validate all required documents
  const validateDocuments = () => {
    const newErrors = {};

    if (!documents.governmentIdFront && !previews.governmentIdFront) {
      newErrors.governmentIdFront = 'Government ID (Front) is required';
    }

    if (!documents.governmentIdBack && !previews.governmentIdBack) {
      newErrors.governmentIdBack = 'Government ID (Back) is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Upload single document
  const uploadDocument = async (documentKey, file) => {
    try {
      const result = await kycService.uploadKYCDocument(userId, documentKey, file);

      if (result.success) {
        setUploadedUrls(prev => ({ ...prev, [documentKey]: result.url }));
        return result.url;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      throw new Error(`Failed to upload ${documentKey}: ${error.message}`);
    }
  };

  // Submit KYC documents
  const handleSubmit = async () => {
    if (!validateDocuments()) {
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const urls = { ...uploadedUrls };
      let progress = 0;
      const totalDocuments = Object.values(documents).filter(doc => doc !== null).length;
      const progressIncrement = totalDocuments > 0 ? 80 / totalDocuments : 0;

      // Upload new documents
      for (const [key, file] of Object.entries(documents)) {
        if (file) {
          const url = await uploadDocument(key, file);
          urls[key] = url;
          progress += progressIncrement;
          setUploadProgress(Math.min(progress, 80));
        }
      }

      // Use existing URLs for documents not replaced
      for (const [key, preview] of Object.entries(previews)) {
        if (preview && !documents[key] && preview.startsWith('http')) {
          urls[key] = preview;
        }
      }

      setUploadProgress(85);

      // Prepare documents object for submission
      const kycDocuments = {
        governmentId: {
          front: urls.governmentIdFront || '',
          back: urls.governmentIdBack || ''
        },
        businessPermit: urls.businessPermit || null,
        dtiRegistration: urls.dtiRegistration || null
      };

      setUploadProgress(90);

      // Submit KYC for review
      const submitResult = await kycService.submitKYCForReview(userId, kycDocuments);

      if (!submitResult.success) {
        throw new Error(submitResult.error || 'Failed to submit KYC documents');
      }

      setUploadProgress(100);

      // Success callback
      setTimeout(() => {
        onComplete && onComplete();
      }, 500);
    } catch (error) {
      console.error('KYC upload error:', error);
      setErrors({ submit: error.message });
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle skip
  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  // Document upload card
  const DocumentUploadCard = ({ docType }) => {
    const hasFile = documents[docType.key] || previews[docType.key];
    const error = errors[docType.key];

    return (
      <div className={`border-2 rounded-lg p-4 transition-all ${
        error ? 'border-red-300 bg-red-50' : hasFile ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
      }`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-800">{docType.label}</h3>
              {docType.required && (
                <span className="text-xs text-red-500 font-medium">*Required</span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">{docType.description}</p>
          </div>
          {hasFile && (
            <button
              onClick={() => removeFile(docType.key)}
              className="p-1 text-red-500 hover:bg-red-100 rounded transition"
              disabled={uploading}
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Preview */}
        {previews[docType.key] && (
          <div className="mb-3">
            {previews[docType.key].startsWith('data:application/pdf') || previews[docType.key].includes('.pdf') ? (
              <div className="flex items-center space-x-2 p-3 bg-gray-100 rounded">
                <FiFile className="w-8 h-8 text-red-500" />
                <span className="text-sm text-gray-700">PDF Document</span>
              </div>
            ) : (
              <img
                src={previews[docType.key]}
                alt={docType.label}
                className="w-full h-32 object-cover rounded"
              />
            )}
          </div>
        )}

        {/* Upload button */}
        {!hasFile && (
          <label
            className={`flex items-center justify-center space-x-2 p-4 border-2 border-dashed rounded-lg cursor-pointer transition ${
              uploading ? 'cursor-not-allowed opacity-50' : 'hover:border-blue-500 hover:bg-blue-50'
            }`}
          >
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
              onChange={(e) => handleFileChange(docType.key, e)}
              className="hidden"
              disabled={uploading}
            />
            <FiUpload className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">Click to upload</span>
          </label>
        )}

        {/* Replace button */}
        {hasFile && !uploading && (
          <label className="flex items-center justify-center space-x-2 p-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 transition">
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
              onChange={(e) => handleFileChange(docType.key, e)}
              className="hidden"
            />
            <FiUpload className="w-4 h-4" />
            <span className="text-sm">Replace</span>
          </label>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-center space-x-2 mt-2 text-sm text-red-600">
            <FiAlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Accepted types */}
        <div className="mt-3 text-xs text-gray-500">
          <strong>Accepted:</strong> {docType.acceptedTypes.join(', ')}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {isSettings ? 'KYC Verification' : 'Verify Your Identity'}
        </h2>
        <p className="text-gray-600">
          Upload your documents to verify your seller account. This helps us ensure a safe marketplace for everyone.
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <FiInfo className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-1">Why do we need these documents?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Verify your identity and business legitimacy</li>
              <li>• Protect buyers from fraud and scams</li>
              <li>• Comply with Philippines e-commerce regulations</li>
              <li>• Build trust in the ChiFere marketplace</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Document upload cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {documentTypes.map(docType => (
          <DocumentUploadCard key={docType.key} docType={docType} />
        ))}
      </div>

      {/* Requirements */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-gray-800 mb-2">Document Requirements</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Clear, readable photos or scans</li>
          <li>• All text and details must be visible</li>
          <li>• Maximum file size: 10MB per document</li>
          <li>• Accepted formats: JPG, PNG, WebP, PDF</li>
          <li>• Documents must be valid and not expired</li>
        </ul>
      </div>

      {/* Upload progress */}
      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">Uploading documents...</span>
            <span className="text-sm text-blue-600">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Submit error */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 text-red-600">
            <FiAlertCircle className="w-5 h-5" />
            <span className="font-medium">{errors.submit}</span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        {!isSettings && onSkip && (
          <button
            onClick={handleSkip}
            className="text-gray-600 hover:text-gray-800 font-medium"
            disabled={uploading}
          >
            Skip for now (Submit later)
          </button>
        )}

        <div className="flex items-center space-x-4 ml-auto">
          <button
            onClick={handleSubmit}
            disabled={uploading || (!documents.governmentIdFront && !previews.governmentIdFront) || (!documents.governmentIdBack && !previews.governmentIdBack)}
            className="btn-base btn-lg btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <FiCheck className="w-5 h-5" />
                <span>Submit for Verification</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Privacy notice */}
      <div className="mt-6 text-center text-xs text-gray-500">
        Your documents are encrypted and securely stored. We will only use them for verification purposes.
      </div>
    </motion.div>
  );
};

export default KYCUploadStep;
