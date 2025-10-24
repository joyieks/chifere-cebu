import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiUsers, FiShoppingBag, FiEye, FiCheck, FiX, FiSearch, FiUserX, FiUserCheck } from 'react-icons/fi';
import { useToast } from '../../Toast';
import { useAuth } from '../../../contexts/AuthContext';
import adminService from '../../../services/adminService';
import UserProfileModal from './UserProfileModal';

const UsersPage = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'sellers', 'buyers'
  const [rejectingId, setRejectingId] = useState(null);
  const [disablingId, setDisablingId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadAllUsers();
  }, []);

  const loadAllUsers = async () => {
    setLoading(true);
    try {
      const result = await adminService.getAllUsers();
      if (result.success) {
        setAllUsers(result.users);
      } else {
        showToast(result.error || 'Failed to load users', 'error');
      }
    } catch (error) {
      console.error('Load users error:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sellerId) => {
    const res = await adminService.approveSeller(sellerId);
    if (res.success) {
      showToast('Seller approved successfully', 'success');
      loadAllUsers(); // Reload to get updated data
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
      loadAllUsers(); // Reload to get updated data
    } else {
      showToast(res.error || 'Failed to reject seller', 'error');
    }
  };

  const handleDisableUser = async (userId, userName) => {
    if (!user) {
      showToast('Admin not authenticated', 'error');
      return;
    }


    const reason = prompt(`Enter reason for disabling ${userName}'s account (optional):`) || 'Account disabled by admin';
    if (reason === null) return; // User cancelled
    
    setDisablingId(userId);
    const res = await adminService.disableUser(userId, user.id, reason);
    setDisablingId(null);
    
    if (res.success) {
      showToast('User account disabled successfully', 'success');
      
      // Immediately update the UI to reflect the change
      setAllUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId 
            ? { ...u, is_active: false, disabled_at: new Date().toISOString(), disabled_reason: reason }
            : u
        )
      );
      
      await loadAllUsers(); // Reload to get updated data from database
    } else {
      showToast(res.error || 'Failed to disable user account', 'error');
    }
  };

  const handleEnableUser = async (userId, userName) => {
    if (!user) {
      showToast('Admin not authenticated', 'error');
      return;
    }

    if (!confirm(`Are you sure you want to enable ${userName}'s account?`)) return;
    
    setDisablingId(userId);
    const res = await adminService.enableUser(userId, user.id);
    setDisablingId(null);
    
    if (res.success) {
      showToast('User account enabled successfully', 'success');
      
      // Immediately update the UI to reflect the change
      setAllUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId 
            ? { ...u, is_active: true, disabled_at: null, disabled_reason: null }
            : u
        )
      );
      
      await loadAllUsers(); // Reload to get updated data from database
    } else {
      showToast(res.error || 'Failed to enable user account', 'error');
    }
  };

  const handleViewProfile = (user) => {
    setSelectedUser(user);
    setShowProfileModal(true);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setSelectedUser(null);
  };

  // Filter users based on search term and type, excluding rejected users
  const filteredUsers = allUsers.filter(user => {
    // Exclude rejected users
    if (user.seller_status === 'rejected') {
      return false;
    }

    const matchesSearch = 
      user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = 
      filterType === 'all' ||
      (filterType === 'sellers' && user.user_type === 'seller') ||
      (filterType === 'buyers' && user.user_type === 'buyer');
    
    return matchesSearch && matchesType;
  });

  // Filter out rejected users for stats
  const nonRejectedUsers = allUsers.filter(u => u.seller_status !== 'rejected');
  
  const stats = {
    total: nonRejectedUsers.length,
    sellers: nonRejectedUsers.filter(u => u.user_type === 'seller').length,
    buyers: nonRejectedUsers.filter(u => u.user_type === 'buyer').length,
    pending: nonRejectedUsers.filter(u => u.seller_status === 'pending').length,
    approved: nonRejectedUsers.filter(u => u.seller_status === 'approved').length,
    rejected: allUsers.filter(u => u.seller_status === 'rejected').length, // Keep rejected count for reference
    disabled: nonRejectedUsers.filter(u => u.is_active === false || u.is_active === null).length,
    active: nonRejectedUsers.filter(u => u.is_active === true).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-2">Manage all user accounts and seller applications</p>
            </div>
            <button 
              onClick={loadAllUsers} 
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Users" value={stats.total} icon={FiUsers} color="blue" />
          <StatCard label="Active Users" value={stats.active} icon={FiUserCheck} color="green" />
          <StatCard label="Disabled Users" value={stats.disabled} icon={FiUserX} color="red" />
          <StatCard label="Pending Sellers" value={stats.pending} icon={FiCheck} color="yellow" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users by name, email, or business..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Type Filter */}
            <div className="flex space-x-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Users
              </button>
              <button
                onClick={() => setFilterType('sellers')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'sellers'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Sellers
              </button>
              <button
                onClick={() => setFilterType('buyers')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'buyers'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Buyers
              </button>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-500">Loading users...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <FiUsers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms' : 'No user accounts have been created yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user, index) => (
                <UserCard
                  key={`${user.id}-${user.user_type}-${index}`}
                  user={user}
                  type={user.user_type}
                  onApprove={() => handleApprove(user.id)}
                  onReject={() => handleReject(user.id)}
                  isRejecting={rejectingId === user.id}
                  onDisable={handleDisableUser}
                  onEnable={handleEnableUser}
                  isDisabling={disablingId === user.id}
                  onViewProfile={handleViewProfile}
                />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Profile Modal */}
      {showProfileModal && (
        <UserProfileModal
          user={selectedUser}
          onClose={handleCloseProfileModal}
        />
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

const UserCard = ({ user, type, onApprove, onReject, isRejecting, onDisable, onEnable, isDisabling, onViewProfile }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (userType) => {
    return userType === 'seller' ? FiUsers : FiShoppingBag;
  };

  const getTypeColor = (userType) => {
    return userType === 'seller' ? 'text-blue-600' : 'text-green-600';
  };

  const TypeIcon = getTypeIcon(type);

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              type === 'seller' ? 'bg-blue-100' : 'bg-green-100'
            }`}>
              <TypeIcon className={`w-5 h-5 ${getTypeColor(type)}`} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900">
                  {user.display_name || user.business_name || 'Unnamed User'}
                </h3>
                {(user.is_active === false || user.is_active === null) && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <FiUserX className="w-3 h-3 mr-1" />
                    Disabled
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Type</p>
              <p className="text-sm font-medium text-gray-900 capitalize">{type}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Account Status</p>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                (user.is_active === false || user.is_active === null) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {(user.is_active === false || user.is_active === null) ? 'Disabled' : 'Active'}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Joined</p>
              <p className="text-sm font-medium text-gray-900">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>

          {type === 'seller' && (user.id_front_url || user.id_back_url) && (
            <div className="flex space-x-3 mb-4">
              {user.id_front_url && (
                <a 
                  href={user.id_front_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <FiEye className="w-4 h-4" />
                  <span>View ID Front</span>
                </a>
              )}
              {user.id_back_url && (
                <a 
                  href={user.id_back_url} 
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
                  <p className="text-gray-500">Full Name:</p>
                  <p className="font-medium">{user.display_name || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email:</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                {user.phone && (
                  <div>
                    <p className="text-gray-500">Phone:</p>
                    <p className="font-medium">{user.phone}</p>
                  </div>
                )}
                {user.address && (
                  <div>
                    <p className="text-gray-500">Address:</p>
                    <p className="font-medium">{user.address}</p>
                  </div>
                )}
                {user.business_name && (
                  <div>
                    <p className="text-gray-500">Business Name:</p>
                    <p className="font-medium">{user.business_name}</p>
                  </div>
                )}
                {user.business_description && (
                  <div>
                    <p className="text-gray-500">Business Description:</p>
                    <p className="font-medium">{user.business_description}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">User ID:</p>
                  <p className="font-medium text-xs">{user.id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Last Updated:</p>
                  <p className="font-medium">
                    {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-2 ml-4">
          <button 
            onClick={() => onViewProfile(user)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiEye className="w-4 h-4" />
            <span>View Profile</span>
          </button>
          
          {/* Disable/Enable Account Button */}
          {(user.is_active === false || user.is_active === null) ? (
            <button 
              onClick={() => onEnable(user.id, user.display_name || user.business_name || 'User')}
              disabled={isDisabling}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              <FiUserCheck className="w-4 h-4" />
              <span>{isDisabling ? 'Enabling...' : 'Enable Account'}</span>
            </button>
          ) : (
            <button 
              onClick={() => onDisable(user.id, user.display_name || user.business_name || 'User')}
              disabled={isDisabling}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
            >
              <FiUserX className="w-4 h-4" />
              <span>{isDisabling ? 'Disabling...' : 'Disable Account'}</span>
            </button>
          )}

          {type === 'seller' && user.seller_status === 'pending' && (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
