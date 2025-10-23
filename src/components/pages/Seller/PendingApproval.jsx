/**
 * PendingApproval Component
 * 
 * Displays a waiting page for sellers whose applications are pending admin approval.
 * Shows application status, submitted documents, and estimated review time.
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiClock, FiFileText, FiMail, FiPhone, FiMapPin, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/Toast';

const PendingApproval = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [applicationData, setApplicationData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading application data
    const loadApplicationData = async () => {
      try {
        // In a real app, you'd fetch this from the database
        setApplicationData({
          businessName: user?.business_name || 'Your Business',
          submittedAt: user?.submitted_at || new Date().toISOString(),
          idType: user?.id_type || 'Driver\'s License',
          status: 'pending',
          estimatedReviewTime: '2-3 business days'
        });
      } catch (error) {
        console.error('Error loading application data:', error);
        showToast('Error loading application data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadApplicationData();
  }, [user, showToast]);

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logged out successfully', 'success');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      showToast('Logout failed. Please try again.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Application Under Review</h1>
              <p className="text-gray-600 mt-1">Your seller application is being reviewed by our admin team</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border p-6 mb-8"
        >
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <FiClock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">Application Pending</h2>
              <p className="text-gray-600 mt-1">
                Your application was submitted on {new Date(applicationData?.submittedAt).toLocaleDateString()} and is currently under review.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Application Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <FiFileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Business Name</p>
                  <p className="text-sm text-gray-600">{applicationData?.businessName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FiMail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FiPhone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Phone</p>
                  <p className="text-sm text-gray-600">{user?.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <FiMapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Business Address</p>
                  <p className="text-sm text-gray-600">{user?.business_address || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FiFileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">ID Type</p>
                  <p className="text-sm text-gray-600">{applicationData?.idType}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FiCheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Status</p>
                  <p className="text-sm text-green-600 capitalize">{applicationData?.status}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Review Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Timeline</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <FiCheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Application Submitted</p>
                <p className="text-sm text-gray-600">
                  {new Date(applicationData?.submittedAt).toLocaleDateString()} at {new Date(applicationData?.submittedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <FiClock className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Under Review</p>
                <p className="text-sm text-gray-600">Our admin team is reviewing your application and documents</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <FiCheckCircle className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Approval Decision</p>
                <p className="text-sm text-gray-500">You'll be notified via email once the review is complete</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Information Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-6"
        >
          <div className="flex items-start space-x-3">
            <FiAlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">What happens next?</h4>
              <div className="mt-2 text-sm text-blue-700 space-y-1">
                <p>• Our admin team will review your business information and ID documents</p>
                <p>• The review process typically takes {applicationData?.estimatedReviewTime}</p>
                <p>• You'll receive an email notification once a decision is made</p>
                <p>• If approved, you'll gain access to the seller dashboard</p>
                <p>• If additional information is needed, we'll contact you directly</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8"
        >
          <p className="text-gray-600 mb-4">
            Have questions about your application? Contact our support team.
          </p>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Contact Support
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default PendingApproval;

