import React, { useState } from 'react';

const Settings = () => {
  const [settings, setSettings] = useState({
    notifications: {
      orderUpdates: true,
      promoOffers: false,
      barterRequests: true,
      messages: true,
      emailNotifications: false,
      smsNotifications: true,
    },
    privacy: {
      profileVisibility: 'public',
      showOnlineStatus: true,
      dataSharing: false,
      locationAccess: true,
    },
    preferences: {
      language: 'English',
      currency: 'PHP',
      theme: 'light',
      autoPlayVideos: false,
    },
    security: {
      twoFactorAuth: false,
      loginAlerts: true,
      deviceManagement: true,
    }
  });

  const [activeTab, setActiveTab] = useState('notifications');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const handleToggle = (category, setting) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting]
      }
    }));
  };

  const handleSelect = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const handleSave = () => {
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { id: 'privacy', label: 'Privacy', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { id: 'preferences', label: 'Preferences', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    { id: 'security', label: 'Security', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' }
  ];

  const ToggleSwitch = ({ checked, onChange, label, description }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
      <div className="flex-1">
        <h4 className="font-semibold text-gray-800">{label}</h4>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none ${
          checked ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  const SelectOption = ({ label, value, options, onChange, description }) => (
    <div className="p-4 bg-gray-50 rounded-xl">
      <label className="block font-semibold text-gray-800 mb-2">{label}</label>
      {description && <p className="text-sm text-gray-500 mb-3">{description}</p>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Settings
          </h1>
          <p className="text-gray-600 text-lg">Customize your experience and preferences</p>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          {/* Tabs */}
          <div className="flex overflow-x-auto bg-gray-50 p-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-8">
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Notification Settings</h2>
                  <p className="text-gray-600">Choose what notifications you want to receive</p>
                </div>
                
                <div className="space-y-4">
                  <ToggleSwitch
                    checked={settings.notifications.orderUpdates}
                    onChange={() => handleToggle('notifications', 'orderUpdates')}
                    label="Order Updates"
                    description="Get notified about order status changes"
                  />
                  <ToggleSwitch
                    checked={settings.notifications.barterRequests}
                    onChange={() => handleToggle('notifications', 'barterRequests')}
                    label="Barter Requests"
                    description="Receive notifications for new barter offers"
                  />
                  <ToggleSwitch
                    checked={settings.notifications.messages}
                    onChange={() => handleToggle('notifications', 'messages')}
                    label="Messages"
                    description="Get notified of new messages from sellers"
                  />
                  <ToggleSwitch
                    checked={settings.notifications.promoOffers}
                    onChange={() => handleToggle('notifications', 'promoOffers')}
                    label="Promotional Offers"
                    description="Receive special deals and discount notifications"
                  />
                  <ToggleSwitch
                    checked={settings.notifications.emailNotifications}
                    onChange={() => handleToggle('notifications', 'emailNotifications')}
                    label="Email Notifications"
                    description="Send notifications to your email address"
                  />
                  <ToggleSwitch
                    checked={settings.notifications.smsNotifications}
                    onChange={() => handleToggle('notifications', 'smsNotifications')}
                    label="SMS Notifications"
                    description="Send notifications via text message"
                  />
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Privacy Settings</h2>
                  <p className="text-gray-600">Control your privacy and data sharing preferences</p>
                </div>
                
                <div className="space-y-4">
                  <SelectOption
                    label="Profile Visibility"
                    value={settings.privacy.profileVisibility}
                    onChange={(value) => handleSelect('privacy', 'profileVisibility', value)}
                    description="Who can see your profile information"
                    options={[
                      { value: 'public', label: 'Public' },
                      { value: 'friends', label: 'Friends Only' },
                      { value: 'private', label: 'Private' }
                    ]}
                  />
                  <ToggleSwitch
                    checked={settings.privacy.showOnlineStatus}
                    onChange={() => handleToggle('privacy', 'showOnlineStatus')}
                    label="Show Online Status"
                    description="Let others see when you're online"
                  />
                  <ToggleSwitch
                    checked={settings.privacy.dataSharing}
                    onChange={() => handleToggle('privacy', 'dataSharing')}
                    label="Data Sharing"
                    description="Share anonymous usage data to improve the service"
                  />
                  <ToggleSwitch
                    checked={settings.privacy.locationAccess}
                    onChange={() => handleToggle('privacy', 'locationAccess')}
                    label="Location Access"
                    description="Allow location access for better recommendations"
                  />
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">App Preferences</h2>
                  <p className="text-gray-600">Customize your app experience</p>
                </div>
                
                <div className="space-y-4">
                  <SelectOption
                    label="Language"
                    value={settings.preferences.language}
                    onChange={(value) => handleSelect('preferences', 'language', value)}
                    description="Choose your preferred language"
                    options={[
                      { value: 'English', label: 'English' },
                      { value: 'Filipino', label: 'Filipino' },
                      { value: 'Cebuano', label: 'Cebuano' }
                    ]}
                  />
                  <SelectOption
                    label="Currency"
                    value={settings.preferences.currency}
                    onChange={(value) => handleSelect('preferences', 'currency', value)}
                    description="Select your preferred currency"
                    options={[
                      { value: 'PHP', label: 'Philippine Peso (₱)' },
                      { value: 'USD', label: 'US Dollar ($)' }
                    ]}
                  />
                  <SelectOption
                    label="Theme"
                    value={settings.preferences.theme}
                    onChange={(value) => handleSelect('preferences', 'theme', value)}
                    description="Choose your app theme"
                    options={[
                      { value: 'light', label: 'Light' },
                      { value: 'dark', label: 'Dark' },
                      { value: 'auto', label: 'Auto' }
                    ]}
                  />
                  <ToggleSwitch
                    checked={settings.preferences.autoPlayVideos}
                    onChange={() => handleToggle('preferences', 'autoPlayVideos')}
                    label="Auto-play Videos"
                    description="Automatically play videos in your feed"
                  />
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Security Settings</h2>
                  <p className="text-gray-600">Manage your account security</p>
                </div>
                
                <div className="space-y-4">
                  <ToggleSwitch
                    checked={settings.security.twoFactorAuth}
                    onChange={() => handleToggle('security', 'twoFactorAuth')}
                    label="Two-Factor Authentication"
                    description="Add an extra layer of security to your account"
                  />
                  <ToggleSwitch
                    checked={settings.security.loginAlerts}
                    onChange={() => handleToggle('security', 'loginAlerts')}
                    label="Login Alerts"
                    description="Get notified of new login attempts"
                  />
                  <ToggleSwitch
                    checked={settings.security.deviceManagement}
                    onChange={() => handleToggle('security', 'deviceManagement')}
                    label="Device Management"
                    description="Track and manage devices that access your account"
                  />
                  
                  <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-2">Password Settings</h4>
                    <p className="text-sm text-yellow-700 mb-4">Last changed 30 days ago</p>
                    <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200 font-medium">
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-8 border-t border-gray-200 mt-8">
              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleSave}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSaveSuccess && (
          <div className="fixed bottom-8 right-8 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg animate-slide-up">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Settings saved successfully!</span>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
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

export default Settings;
