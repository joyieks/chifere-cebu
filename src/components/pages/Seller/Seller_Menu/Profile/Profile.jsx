import React, { useState, useEffect, useRef } from 'react';
import SellerLayout from '../Seller_Layout/SellerLayout';
import { theme } from '../../../../../styles/designSystem';
import { useAuth } from '../../../../../contexts/AuthContext';
import { supabase } from '../../../../../config/supabase';
import ProfilePictureModal from '../../../../../components/common/ProfilePictureModal/ProfilePictureModal';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiCamera, 
  FiSave,
  FiEdit3,
  FiStar,
  FiShield,
  FiTrendingUp,
  FiPackage
} from 'react-icons/fi';

// Peso Icon Component
const PesoIcon = ({ className, style }) => (
  <span className={className} style={style}>₱</span>
);

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    businessName: '',
    businessDescription: '',
    avatar: '/default-avatar.png',
    coverImage: '/placeholder-store.svg',
    isVerified: false,
    joinDate: '',
    rating: 0,
    totalSales: 0,
    totalRevenue: 0,
    responseRate: 0,
    responseTime: 'N/A'
  });

  const [editedProfile, setEditedProfile] = useState({ ...profile });
  const [saving, setSaving] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const fileInputRef = useRef();

  // Load user data from AuthContext and database
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user) {
        try {
          // Fetch additional seller data from user_profiles table
          const { data: profileData, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching profile:', error);
          }

          const userProfile = {
            name: user.display_name || user.first_name || 'User',
            email: user.email || '',
            phone: profileData?.phone || user.phone || '',
            address: profileData?.address || user.address || '',
            businessName: profileData?.business_name || '',
            businessDescription: profileData?.business_description || '',
            avatar: user.profile_image || user.avatar || '/default-avatar.png',
            coverImage: '/placeholder-store.svg',
            isVerified: profileData?.is_verified || user.is_verified || false,
            joinDate: user.created_at || profileData?.created_at || '',
            rating: profileData?.rating || 0,
            totalSales: profileData?.total_sales || 0,
            totalRevenue: 0, // This would need to be calculated from orders
            responseRate: 95, // This would need to be calculated
            responseTime: '2 hours' // This would need to be calculated
          };

          setProfile(userProfile);
          setEditedProfile(userProfile);
        } catch (error) {
          console.error('Error loading profile:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadUserProfile();
  }, [user]);

  const handleSave = async () => {
    // Basic validation
    if (!editedProfile.name.trim()) {
      alert('Please enter your name');
      return;
    }
    
    if (!editedProfile.email.trim()) {
      alert('Please enter your email');
      return;
    }

    if (!editedProfile.businessName.trim()) {
      alert('Please enter your business name');
      return;
    }

    setSaving(true);
    try {
      // Update the user profile in the database
      const updateData = {
        display_name: editedProfile.name,
        phone: editedProfile.phone,
        address: editedProfile.address,
        business_name: editedProfile.businessName,
        business_description: editedProfile.businessDescription,
        profile_image: editedProfile.avatar !== '/default-avatar.png' ? editedProfile.avatar : null
      };

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        alert('Error updating profile. Please try again.');
        return;
      }

      setProfile({ ...editedProfile });
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile({ ...profile });
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditedProfile({ ...editedProfile, [field]: value });
  };

  const handleProfilePictureUpdate = async (newImageUrl) => {
    setEditedProfile({ ...editedProfile, avatar: newImageUrl });
    // Update the user data in AuthContext to sync across all components
    if (user) {
      try {
        await updateProfile({ 
          profile_image: newImageUrl,
          avatar: newImageUrl 
        });
      } catch (error) {
        console.error('Error updating user profile:', error);
      }
    }
  };

  const StatCard = ({ icon: Icon, title, value, color = 'blue' }) => (
    <div className="card-base p-6">
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center`}
             style={{ backgroundColor: theme.colors[color][100] }}>
          {typeof Icon === 'function' && Icon.name === 'PesoIcon' ? (
            <Icon className="text-2xl font-bold" style={{ color: theme.colors[color][500] }} />
          ) : (
            <Icon className="w-6 h-6" style={{ color: theme.colors[color][500] }} />
          )}
        </div>
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );

  const InputField = ({ label, value, onChange, type = 'text', placeholder, disabled = false }) => (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={4}
          className={`input-base ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`input-base ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
        />
      )}
    </div>
  );

  if (loading) {
    return (
      <SellerLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading profile...</p>
            </div>
          </div>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Edit Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`btn-base btn-md ${isEditing ? 'btn-outline' : 'btn-primary'}`}
          >
            <FiEdit3 className="w-4 h-4 mr-2" />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* Profile Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={FiStar}
            title="Average Rating"
            value={`${profile.rating}/5`}
            color="warning"
          />
          <StatCard
            icon={FiPackage}
            title="Total Sales"
            value={profile.totalSales}
            color="primary"
          />
          <StatCard
            icon={PesoIcon}
            title="Total Revenue"
            value={`₱${profile.totalRevenue.toLocaleString()}`}
            color="success"
          />
          <StatCard
            icon={FiTrendingUp}
            title="Response Rate"
            value={`${profile.responseRate}%`}
            color="info"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-2">
              <div className="card-base p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Profile Information</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn-base btn-md btn-outline"
                    >
                      <FiEdit3 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleCancel}
                        className="btn-base btn-md btn-outline"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-base btn-md btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </div>
                        ) : (
                          <>
                            <FiSave className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label="Full Name"
                    value={isEditing ? editedProfile.name : profile.name}
                    onChange={(value) => handleInputChange('name', value)}
                    disabled={!isEditing}
                    placeholder="Enter your full name"
                  />
                  
                  <InputField
                    label="Email Address"
                    type="email"
                    value={isEditing ? editedProfile.email : profile.email}
                    onChange={(value) => handleInputChange('email', value)}
                    disabled={!isEditing}
                    placeholder="Enter your email"
                  />
                  
                  <InputField
                    label="Phone Number"
                    value={isEditing ? editedProfile.phone : profile.phone}
                    onChange={(value) => handleInputChange('phone', value)}
                    disabled={!isEditing}
                    placeholder="Enter your phone number"
                  />
                  
                  <InputField
                    label="Business Name"
                    value={isEditing ? editedProfile.businessName : profile.businessName}
                    onChange={(value) => handleInputChange('businessName', value)}
                    disabled={!isEditing}
                    placeholder="Enter your business name"
                  />
                </div>

                <InputField
                  label="Address"
                  value={isEditing ? editedProfile.address : profile.address}
                  onChange={(value) => handleInputChange('address', value)}
                  disabled={!isEditing}
                  placeholder="Enter your complete address"
                />

                <InputField
                  label="Business Description"
                  type="textarea"
                  value={isEditing ? editedProfile.businessDescription : profile.businessDescription}
                  onChange={(value) => handleInputChange('businessDescription', value)}
                  disabled={!isEditing}
                  placeholder="Describe your business and what you sell"
                />
              </div>
            </div>

            {/* Profile Card & Additional Info */}
            <div className="space-y-8">
              {/* Profile Card */}
              <div className="card-base p-6">
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <img
                      src={isEditing ? editedProfile.avatar : profile.avatar}
                      alt={profile.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    {isEditing && (
                      <button 
                        onClick={() => setShowProfileModal(true)}
                        className="absolute bottom-0 right-0 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                      >
                        <FiCamera className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{profile.name}</h3>
                  <p className="text-gray-600 mb-2">{profile.businessName}</p>
                  
                  <div className="flex items-center justify-center space-x-1 mb-4">
                    {profile.isVerified && (
                      <div className="flex items-center space-x-1 text-blue-500">
                        <FiShield className="w-4 h-4" />
                        <span className="text-sm font-medium">Verified Seller</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center space-x-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <FiStar
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(profile.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">({profile.rating})</span>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    Member since {new Date(profile.joinDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long'
                    })}
                  </p>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="card-base p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Performance Metrics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Response Rate</span>
                    <span className="font-semibold text-green-600">{profile.responseRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Avg. Response Time</span>
                    <span className="font-semibold text-gray-800">{profile.responseTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Customer Satisfaction</span>
                    <span className="font-semibold text-blue-600">{profile.rating}/5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Repeat Customers</span>
                    <span className="font-semibold text-gray-800">67%</span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="card-base p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <FiMail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{profile.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FiPhone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{profile.phone}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <FiMapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <span className="text-sm text-gray-600 flex-1">{profile.address}</span>
                  </div>
                </div>
              </div>
            </div>
        </div>

        {/* Profile Picture Modal */}
        <ProfilePictureModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          currentImage={isEditing ? editedProfile.avatar : profile.avatar}
          onImageUpdate={handleProfilePictureUpdate}
          userId={user?.id}
          userType="seller"
          userName={profile.name || 'User'}
        />
      </div>
    </SellerLayout>
  );
};

export default Profile;