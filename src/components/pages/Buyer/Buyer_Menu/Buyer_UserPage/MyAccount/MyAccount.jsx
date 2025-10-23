import React, { useState, useRef } from 'react';

const MyAccount = () => {
  const [profile, setProfile] = useState({
    name: 'Brent Catacutan',
    email: 'brent@example.com',
    phone: '+63 912 345 6789',
    birthday: '1995-05-15',
    address: 'Cebu City, Philippines'
  });

  const [editMode, setEditMode] = useState(false);
  const [editProfile, setEditProfile] = useState({ ...profile });
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [success, setSuccess] = useState(false);
  const [tempAvatar, setTempAvatar] = useState('/avatar.png');
  const fileInputRef = useRef();

  const handleEdit = () => {
    setEditMode(true);
    setEditProfile({ ...profile });
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditProfile({ ...profile });
    setTempAvatar('/avatar.png');
  };

  const handleChange = (e) => {
    setEditProfile({ ...editProfile, [e.target.name]: e.target.value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    setShowOtp(true);
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    if (otp === '123456') {
      setProfile({ ...editProfile });
      setShowOtp(false);
      setEditMode(false);
      setSuccess(true);
      setOtp('');
    } else {
      alert('Invalid OTP. Please try 123456');
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setTempAvatar(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            My Account
          </h1>
          <p className="text-gray-600 text-lg">Manage your personal information and preferences</p>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          {!editMode && (
            <div className="p-12">
              {/* Profile Display Mode */}
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
                {/* Avatar Section */}
                <div className="relative group">
                  <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-gradient-to-r from-blue-500 to-purple-500 p-1 bg-gradient-to-r from-blue-500 to-purple-500">
                    <img
                      src={tempAvatar}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover bg-white"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center lg:text-left">
                  <h2 className="text-4xl font-bold text-gray-800 mb-2">{profile.name}</h2>
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-center lg:justify-start text-gray-600">
                      <svg className="w-5 h-5 mr-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      <span className="text-lg">{profile.email}</span>
                    </div>
                    <div className="flex items-center justify-center lg:justify-start text-gray-600">
                      <svg className="w-5 h-5 mr-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      <span className="text-lg">{profile.phone}</span>
                    </div>
                    <div className="flex items-center justify-center lg:justify-start text-gray-600">
                      <svg className="w-5 h-5 mr-3 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <span className="text-lg">{profile.birthday}</span>
                    </div>
                    <div className="flex items-center justify-center lg:justify-start text-gray-600">
                      <svg className="w-5 h-5 mr-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-lg">{profile.address}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleEdit}
                    className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-3"
                  >
                    <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit Information</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {editMode && (
            <div className="p-12">
              {/* Edit Mode */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Edit Information
                </h2>
                <p className="text-gray-600">Update your personal details</p>
              </div>

              <form onSubmit={handleSave} className="space-y-8">
                {/* Avatar Upload */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <img
                      src={tempAvatar}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-blue-200"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Profile Picture</h3>
                    <p className="text-sm text-gray-500">Click the + icon to change your avatar</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={editProfile.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={editProfile.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={editProfile.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Birthday</label>
                    <input
                      type="date"
                      name="birthday"
                      value={editProfile.birthday}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={editProfile.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-6">
                  <button
                    type="submit"
                    className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold transform hover:scale-105"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 px-8 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* OTP Modal */}
        {showOtp && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4 transform animate-slide-up">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Verify Changes</h2>
                <p className="text-gray-500">Enter the 6-digit code sent to your email</p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center text-2xl font-mono tracking-widest"
                    placeholder="000000"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold"
                >
                  Verify & Save
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {success && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4 text-center transform animate-slide-up">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Successfully Saved!</h2>
              <p className="text-gray-600 mb-6">Your profile has been updated</p>
              <button
                onClick={() => setSuccess(false)}
                className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 font-semibold"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
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

export default MyAccount;