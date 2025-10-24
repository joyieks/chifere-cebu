import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiEye, FiCheck, FiX, FiRefreshCw, FiFilter, FiSearch, FiClock, FiUser, FiMail, FiMessageSquare, FiImage } from 'react-icons/fi';
import { useToast } from '../../Toast';
import { supabase } from '../../../config/supabase';

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      showToast('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId, status, notes = '') => {
    setUpdating(true);
    try {
      const updateData = {
        status,
        admin_notes: notes,
        updated_at: new Date().toISOString()
      };

      if (status === 'reviewed') {
        updateData.reviewed_at = new Date().toISOString();
      } else if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', reportId);

      if (error) {
        throw error;
      }

      // Update local state
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, ...updateData }
          : report
      ));

      showToast(`Report ${status} successfully`, 'success');
      setShowModal(false);
      setSelectedReport(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating report:', error);
      showToast('Failed to update report', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || '');
    setShowModal(true);
  };

  const filteredReports = reports.filter(report => {
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      report.report_reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.report_description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return FiClock;
      case 'reviewed': return FiEye;
      case 'resolved': return FiCheck;
      case 'dismissed': return FiX;
      default: return FiAlertTriangle;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReportStats = () => {
    const total = reports.length;
    const pending = reports.filter(r => r.status === 'pending').length;
    const reviewed = reports.filter(r => r.status === 'reviewed').length;
    const resolved = reports.filter(r => r.status === 'resolved').length;
    const dismissed = reports.filter(r => r.status === 'dismissed').length;

    return { total, pending, reviewed, resolved, dismissed };
  };

  const stats = getReportStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Reports</h1>
              <p className="text-gray-600 mt-2">Review and manage user concerns and issues</p>
            </div>
            <button 
              onClick={loadReports} 
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            title="Total Reports"
            value={stats.total}
            color="blue"
            icon={FiAlertTriangle}
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            color="yellow"
            icon={FiClock}
          />
          <StatCard
            title="Reviewed"
            value={stats.reviewed}
            color="blue"
            icon={FiEye}
          />
          <StatCard
            title="Resolved"
            value={stats.resolved}
            color="green"
            icon={FiCheck}
          />
          <StatCard
            title="Dismissed"
            value={stats.dismissed}
            color="gray"
            icon={FiX}
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search reports by reason, reporter name, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <FiFilter className="w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Reports ({filteredReports.length})
            </h3>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-500">Loading reports...</span>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <FiAlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No user reports have been submitted yet'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredReports.map((report) => {
                const StatusIcon = getStatusIcon(report.status);
                return (
                  <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDate(report.created_at)}
                          </span>
                        </div>
                        
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          {report.report_reason}
                        </h4>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {report.report_description}
                        </p>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <FiUser className="w-4 h-4" />
                            <span>{report.reporter_name}</span>
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                              {report.reporter_type}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FiMail className="w-4 h-4" />
                            <span>{report.reporter_email}</span>
                          </div>
                          {report.proof_image_url && (
                            <div className="flex items-center space-x-1">
                              <FiImage className="w-4 h-4" />
                              <span>Has proof image</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleViewReport(report)}
                        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <FiEye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Report Detail Modal */}
        {showModal && selectedReport && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Report Details</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FiX className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Report Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reporter</label>
                    <p className="text-gray-900">{selectedReport.reporter_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <p className="text-gray-900 capitalize">{selectedReport.reporter_type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{selectedReport.reporter_email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedReport.status)}`}>
                      {selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Report Reason</label>
                    <p className="text-gray-900">{selectedReport.report_reason}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Submitted</label>
                    <p className="text-gray-900">{formatDate(selectedReport.created_at)}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedReport.report_description}</p>
                  </div>
                </div>

                {/* Proof Image */}
                {selectedReport.proof_image_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Proof Image</label>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <img
                        src={selectedReport.proof_image_url}
                        alt="Proof"
                        className="max-w-full h-auto rounded-lg shadow-sm"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div className="hidden text-gray-500 text-center py-4">
                        <FiImage className="w-8 h-8 mx-auto mb-2" />
                        <p>Image could not be loaded</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add your notes here..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                  {selectedReport.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateReportStatus(selectedReport.id, 'reviewed', adminNotes)}
                        disabled={updating}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        <FiEye className="w-4 h-4" />
                        <span>Mark as Reviewed</span>
                      </button>
                      <button
                        onClick={() => updateReportStatus(selectedReport.id, 'resolved', adminNotes)}
                        disabled={updating}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        <FiCheck className="w-4 h-4" />
                        <span>Mark as Resolved</span>
                      </button>
                      <button
                        onClick={() => updateReportStatus(selectedReport.id, 'dismissed', adminNotes)}
                        disabled={updating}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        <FiX className="w-4 h-4" />
                        <span>Dismiss</span>
                      </button>
                    </>
                  )}
                  
                  {selectedReport.status === 'reviewed' && (
                    <>
                      <button
                        onClick={() => updateReportStatus(selectedReport.id, 'resolved', adminNotes)}
                        disabled={updating}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        <FiCheck className="w-4 h-4" />
                        <span>Mark as Resolved</span>
                      </button>
                      <button
                        onClick={() => updateReportStatus(selectedReport.id, 'dismissed', adminNotes)}
                        disabled={updating}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        <FiX className="w-4 h-4" />
                        <span>Dismiss</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color, icon: Icon }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    gray: 'bg-gray-100 text-gray-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;