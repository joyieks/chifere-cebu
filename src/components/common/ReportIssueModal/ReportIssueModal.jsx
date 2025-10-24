import React, { useState, useRef } from 'react';
import { FiX, FiUpload, FiAlertCircle, FiCheck, FiCamera } from 'react-icons/fi';
import { supabase } from '../../../config/supabase';
import fileUploadService from '../../../services/fileUploadService';

const ReportIssueModal = ({ 
  isOpen, 
  onClose, 
  user, 
  userType = 'buyer' 
}) => {
  const [reportData, setReportData] = useState({
    reason: '',
    description: '',
    proofImage: null
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef();

  const reportReasons = [
    'Technical Issue',
    'Payment Problem',
    'Account Issue',
    'Product/Service Problem',
    'User Behavior',
    'Security Concern',
    'Bug Report',
    'Feature Request',
    'Other'
  ];

  const handleInputChange = (field, value) => {
    setReportData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError('');
    setReportData(prev => ({
      ...prev,
      proofImage: file
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!reportData.reason) {
      setError('Please select a report reason');
      return;
    }
    
    if (!reportData.description.trim()) {
      setError('Please provide a description of the issue');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      let proofImageUrl = null;

      // Upload proof image if provided
      if (reportData.proofImage) {
        setUploading(true);
        const uploadResult = await fileUploadService.uploadProfilePicture(
          reportData.proofImage, 
          user.id, 
          userType
        );
        
        if (uploadResult.success) {
          proofImageUrl = uploadResult.data.url;
        } else {
          throw new Error(uploadResult.error || 'Failed to upload proof image');
        }
        setUploading(false);
      }

      // Submit report to database
      const { error: insertError } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reporter_type: userType,
          reporter_name: user.name || user.display_name || 'User',
          reporter_email: user.email,
          report_reason: reportData.reason,
          report_description: reportData.description,
          proof_image_url: proofImageUrl
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      setSuccess(true);
      
      // Auto close after success
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (error) {
      console.error('Error submitting report:', error);
      setError(error.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const handleClose = () => {
    setReportData({
      reason: '',
      description: '',
      proofImage: null
    });
    setError('');
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg mx-4 transform animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Report an Issue</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Report Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Report Reason *
            </label>
            <select
              value={reportData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            >
              <option value="">Select a reason</option>
              {reportReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={reportData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Please describe the issue in detail..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              required
            />
          </div>

          {/* Proof Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Send Picture for Proof (Optional)
            </label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {reportData.proofImage ? (
                <div className="space-y-2">
                  <FiCamera className="w-8 h-8 text-green-500 mx-auto" />
                  <p className="text-green-600 font-medium">{reportData.proofImage.name}</p>
                  <p className="text-sm text-gray-500">Click to change image</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <FiUpload className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-gray-600">Click to upload proof image</p>
                  <p className="text-sm text-gray-500">PNG, JPG, WebP up to 5MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <FiAlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <FiCheck className="w-5 h-5 text-green-500 mr-2" />
              <p className="text-green-700 text-sm">Report submitted successfully! Our team will review it soon.</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:from-red-700 hover:to-orange-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting || uploading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {uploading ? 'Uploading...' : 'Submitting...'}
                </div>
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
      `}</style>
    </div>
  );
};

export default ReportIssueModal;
