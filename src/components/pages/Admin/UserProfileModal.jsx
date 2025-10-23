import React from 'react';
import { FiX, FiMail, FiPhone, FiMapPin, FiBriefcase, FiCalendar, FiUser, FiInfo, FiEye } from 'react-icons/fi';

const UserProfileModal = ({ user, onClose }) => {
  if (!user) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 animate-fade-in">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">User Profile: {user.display_name || user.business_name || 'N/A'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem icon={FiUser} label="Full Name" value={user.display_name || 'Not provided'} />
            <InfoItem icon={FiMail} label="Email" value={user.email} />
            {user.phone && <InfoItem icon={FiPhone} label="Phone" value={user.phone} />} 
            {user.address && <InfoItem icon={FiMapPin} label="Address" value={user.address} />} 
            <InfoItem icon={FiInfo} label="User Type" value={user.user_type ? user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1) : 'N/A'} />
            <InfoItem icon={FiCalendar} label="Joined" value={user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'} />
          </div>

          {/* Seller Specific Info */}
          {user.user_type === 'seller' && (
            <div className="border-t border-gray-200 pt-6 mt-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Seller Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem icon={FiBriefcase} label="Business Name" value={user.business_name || 'Not provided'} />
                <InfoItem icon={FiInfo} label="Seller Status" value={
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.seller_status || 'active')}`}>
                    {user.seller_status ? user.seller_status.charAt(0).toUpperCase() + user.seller_status.slice(1) : 'Active'}
                  </span>
                } />
                <InfoItem icon={FiInfo} label="Account Status" value={
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    user.is_active === false ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {user.is_active === false ? 'Disabled' : 'Active'}
                  </span>
                } />
              </div>
              {user.business_description && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Business Description:</p>
                  <p className="text-gray-800 text-sm leading-relaxed">{user.business_description}</p>
                </div>
              )}
              {(user.id_front_url || user.id_back_url) && (
                <div className="flex space-x-3 mt-4">
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
            </div>
          )}

          {/* Disabled Account Info */}
          {user.is_active === false && (
            <div className="border-t border-gray-200 pt-6 mt-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Account Disabled</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.disabled_at && (
                  <InfoItem icon={FiCalendar} label="Disabled On" value={new Date(user.disabled_at).toLocaleDateString()} />
                )}
                {user.disabled_reason && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Reason:</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{user.disabled_reason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Admin Activity Log (Placeholder) */}
          <div className="border-t border-gray-200 pt-6 mt-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Admin Activity Log (Coming Soon)</h3>
            <p className="text-gray-500 text-sm">Recent actions taken on this user's account will appear here.</p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value }) => (
  <div>
    <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center space-x-1">
      {Icon && <Icon className="w-3 h-3" />}
      <span>{label}:</span>
    </p>
    <p className="text-sm font-medium text-gray-900 mt-1">{value}</p>
  </div>
);

export default UserProfileModal;

