import React, { useState, useEffect } from 'react';
import { FiCheck, FiX, FiRefreshCw, FiUsers, FiEye, FiClock } from 'react-icons/fi';
import { useToast } from '../../Toast';
import adminService from '../../../services/adminService';

const PendingPage = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const pendingRes = await adminService.getPendingSellers();
      if (pendingRes.success) {
        setPending(pendingRes.sellers);
      } else {
        showToast(pendingRes.error || 'Failed to load pending applications', 'error');
      }
    } catch (e) {
      console.error('❌ [PendingPage] Load data error:', e);
      showToast('Failed to load pending applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sellerId) => {
    const res = await adminService.approveSeller(sellerId);
    if (res.success) {
      showToast('Seller approved successfully', 'success');
      setPending(pending.filter(p => p.id !== sellerId));
      loadData();
    } else {
      showToast(res.error || 'Failed to approve seller', 'error');
    }
  };

  const handleReject = async (sellerId) => {
    const reason = prompt('Enter rejection reason (optional):') || 'Not specified';
    setRejectingId(sellerId);
    const res = await adminService.rejectSeller(sellerId, reason);
    setRejectingId(null);
    if (res.success) {
      showToast('Seller rejected successfully', 'success');
      setPending(pending.filter(p => p.id !== sellerId));
      loadData();
    } else {
      showToast(res.error || 'Failed to reject seller', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pending Applications</h1>
              <p className="text-gray-600 mt-2">Review and approve seller applications</p>
            </div>
            <button 
              onClick={loadData} 
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FiClock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Pending Applications</h3>
              <p className="text-3xl font-bold text-yellow-600">{pending.length}</p>
              <p className="text-sm text-gray-500">Awaiting review</p>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-500">Loading applications...</span>
              </div>
            ) : pending.length === 0 ? (
              <div className="text-center py-12">
                <FiUsers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending applications</h3>
                <p className="text-gray-500">All seller applications have been reviewed.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pending.map(app => (
                  <SellerApplicationCard 
                    key={app.id} 
                    application={app} 
                    onApprove={() => handleApprove(app.id)}
                    onReject={() => handleReject(app.id)}
                    isRejecting={rejectingId === app.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SellerApplicationCard = ({ application, onApprove, onReject, isRejecting }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FiUsers className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {application.display_name || application.business_name || 'Unnamed Store'}
              </h3>
              <p className="text-sm text-gray-600">{application.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">ID Type</p>
              <p className="text-sm font-medium text-gray-900">{application.id_type || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Submitted</p>
              <p className="text-sm font-medium text-gray-900">
                {application.submitted_at ? new Date(application.submitted_at).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>

          {(application.id_front_url || application.id_back_url) && (
            <div className="flex space-x-3 mb-4">
              {application.id_front_url && (
                <a 
                  href={application.id_front_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <FiEye className="w-4 h-4" />
                  <span>View ID Front</span>
                </a>
              )}
              {application.id_back_url && (
                <a 
                  href={application.id_back_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <FiEye className="w-4 h-4" />
                  <span>View ID Back</span>
                </a>
              )}
            </div>
          )}

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>

          {showDetails && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Business Name:</p>
                  <p className="font-medium">{application.business_name || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone:</p>
                  <p className="font-medium">{application.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Address:</p>
                  <p className="font-medium">{application.address || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Business Description:</p>
                  <p className="font-medium">{application.business_description || 'Not provided'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-2 ml-4">
          <button 
            onClick={onApprove}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FiCheck className="w-4 h-4" />
            <span>Approve</span>
          </button>
          <button 
            onClick={onReject}
            disabled={isRejecting}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            <FiX className="w-4 h-4" />
            <span>{isRejecting ? 'Rejecting...' : 'Reject'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingPage;
