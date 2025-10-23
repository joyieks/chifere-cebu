import React, { useState } from 'react';
import SellerLayout from '../Seller_Layout/SellerLayout';
import { theme } from '../../../../../styles/designSystem';
import { 
  FiBell, 
  FiShield, 
  FiCreditCard, 
  FiGlobe,
  FiMoon,
  FiSun,
  FiToggleLeft,
  FiToggleRight,
  FiSave,
  FiAlertTriangle,
  FiTrash2,
  FiDownload,
  FiUpload
} from 'react-icons/fi';

const Settings = () => {
  const [settings, setSettings] = useState({
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      newOrders: true,
      newMessages: true,
      promotions: false,
      systemUpdates: true
    },
    privacy: {
      profileVisibility: 'public',
      showContactInfo: true,
      allowReviews: true,
      dataSharing: false
    },
    business: {
      autoAcceptOrders: false,
      businessHours: '9:00 AM - 6:00 PM',
      processingTime: '1-2 business days',
      returnPolicy: '7 days return policy',
      shippingRegions: 'Cebu City, Lapu-Lapu, Mandaue'
    },
    appearance: {
      theme: 'light',
      language: 'en'
    }
  });

  const [hasChanges, setHasChanges] = useState(false);

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const saveSettings = () => {
    // Here you would typically save to backend
    console.log('Saving settings:', settings);
    setHasChanges(false);
  };

  const exportData = () => {
    // Mock data export
    const dataToExport = {
      profile: settings,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chifere-seller-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const ToggleSwitch = ({ isOn, onToggle, disabled = false }) => (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`transition-colors ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      {isOn ? (
        <FiToggleRight className="w-8 h-8 text-blue-500" />
      ) : (
        <FiToggleLeft className="w-8 h-8 text-gray-400" />
      )}
    </button>
  );

  const SettingsSection = ({ title, icon: Icon, children }) => (
    <div className="card-base p-6 mb-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center"
             style={{ backgroundColor: theme.colors.primary[100] }}>
          <Icon className="w-5 h-5" style={{ color: theme.colors.primary[500] }} />
        </div>
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  );

  const SettingItem = ({ label, description, control }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-800">{label}</h3>
        {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
      </div>
      <div className="ml-4">
        {control}
      </div>
    </div>
  );

  return (
    <SellerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Save Button */}
        {hasChanges && (
          <div className="flex justify-end mb-6">
            <button
              onClick={saveSettings}
              className="btn-base btn-md btn-primary"
            >
              <FiSave className="w-4 h-4 mr-2" />
              Save Changes
            </button>
          </div>
        )}

        <div className="max-w-4xl">
            {/* Notifications */}
            <SettingsSection title="Notifications" icon={FiBell}>
              <div className="space-y-1">
                <SettingItem
                  label="Email Notifications"
                  description="Receive notifications via email"
                  control={
                    <ToggleSwitch
                      isOn={settings.notifications.emailNotifications}
                      onToggle={() => updateSetting('notifications', 'emailNotifications', !settings.notifications.emailNotifications)}
                    />
                  }
                />
                
                <SettingItem
                  label="Push Notifications"
                  description="Get instant notifications on your device"
                  control={
                    <ToggleSwitch
                      isOn={settings.notifications.pushNotifications}
                      onToggle={() => updateSetting('notifications', 'pushNotifications', !settings.notifications.pushNotifications)}
                    />
                  }
                />
                
                <SettingItem
                  label="SMS Notifications"
                  description="Receive important updates via SMS"
                  control={
                    <ToggleSwitch
                      isOn={settings.notifications.smsNotifications}
                      onToggle={() => updateSetting('notifications', 'smsNotifications', !settings.notifications.smsNotifications)}
                    />
                  }
                />
                
                <SettingItem
                  label="New Orders"
                  description="Get notified when you receive new orders"
                  control={
                    <ToggleSwitch
                      isOn={settings.notifications.newOrders}
                      onToggle={() => updateSetting('notifications', 'newOrders', !settings.notifications.newOrders)}
                    />
                  }
                />
                
                <SettingItem
                  label="New Messages"
                  description="Get notified of new customer messages"
                  control={
                    <ToggleSwitch
                      isOn={settings.notifications.newMessages}
                      onToggle={() => updateSetting('notifications', 'newMessages', !settings.notifications.newMessages)}
                    />
                  }
                />
                
                <SettingItem
                  label="Promotions"
                  description="Receive promotional offers and updates"
                  control={
                    <ToggleSwitch
                      isOn={settings.notifications.promotions}
                      onToggle={() => updateSetting('notifications', 'promotions', !settings.notifications.promotions)}
                    />
                  }
                />
              </div>
            </SettingsSection>

            {/* Privacy & Security */}
            <SettingsSection title="Privacy & Security" icon={FiShield}>
              <div className="space-y-1">
                <SettingItem
                  label="Profile Visibility"
                  description="Control who can see your profile"
                  control={
                    <select
                      value={settings.privacy.profileVisibility}
                      onChange={(e) => updateSetting('privacy', 'profileVisibility', e.target.value)}
                      className="input-base w-40"
                    >
                      <option value="public">Public</option>
                      <option value="buyers-only">Buyers Only</option>
                      <option value="private">Private</option>
                    </select>
                  }
                />
                
                <SettingItem
                  label="Show Contact Information"
                  description="Display your contact details on your profile"
                  control={
                    <ToggleSwitch
                      isOn={settings.privacy.showContactInfo}
                      onToggle={() => updateSetting('privacy', 'showContactInfo', !settings.privacy.showContactInfo)}
                    />
                  }
                />
                
                <SettingItem
                  label="Allow Reviews"
                  description="Let customers leave reviews on your products"
                  control={
                    <ToggleSwitch
                      isOn={settings.privacy.allowReviews}
                      onToggle={() => updateSetting('privacy', 'allowReviews', !settings.privacy.allowReviews)}
                    />
                  }
                />
                
                <SettingItem
                  label="Data Sharing"
                  description="Share anonymous data to improve ChiFere services"
                  control={
                    <ToggleSwitch
                      isOn={settings.privacy.dataSharing}
                      onToggle={() => updateSetting('privacy', 'dataSharing', !settings.privacy.dataSharing)}
                    />
                  }
                />
              </div>
            </SettingsSection>

            {/* Business Settings */}
            <SettingsSection title="Business Settings" icon={FiCreditCard}>
              <div className="space-y-4">
                <SettingItem
                  label="Auto-Accept Orders"
                  description="Automatically accept orders without manual approval"
                  control={
                    <ToggleSwitch
                      isOn={settings.business.autoAcceptOrders}
                      onToggle={() => updateSetting('business', 'autoAcceptOrders', !settings.business.autoAcceptOrders)}
                    />
                  }
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Hours</label>
                    <input
                      type="text"
                      value={settings.business.businessHours}
                      onChange={(e) => updateSetting('business', 'businessHours', e.target.value)}
                      className="input-base"
                      placeholder="e.g., 9:00 AM - 6:00 PM"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Processing Time</label>
                    <input
                      type="text"
                      value={settings.business.processingTime}
                      onChange={(e) => updateSetting('business', 'processingTime', e.target.value)}
                      className="input-base"
                      placeholder="e.g., 1-2 business days"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Return Policy</label>
                  <textarea
                    value={settings.business.returnPolicy}
                    onChange={(e) => updateSetting('business', 'returnPolicy', e.target.value)}
                    className="input-base"
                    rows={3}
                    placeholder="Describe your return policy"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Regions</label>
                  <input
                    type="text"
                    value={settings.business.shippingRegions}
                    onChange={(e) => updateSetting('business', 'shippingRegions', e.target.value)}
                    className="input-base"
                    placeholder="e.g., Cebu City, Lapu-Lapu, Mandaue"
                  />
                </div>
              </div>
            </SettingsSection>

            {/* Appearance */}
            <SettingsSection title="Appearance & Language" icon={FiGlobe}>
              <div className="space-y-1">
                <SettingItem
                  label="Theme"
                  description="Choose your preferred theme"
                  control={
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateSetting('appearance', 'theme', 'light')}
                        className={`p-2 rounded-lg ${
                          settings.appearance.theme === 'light'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <FiSun className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateSetting('appearance', 'theme', 'dark')}
                        className={`p-2 rounded-lg ${
                          settings.appearance.theme === 'dark'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <FiMoon className="w-4 h-4" />
                      </button>
                    </div>
                  }
                />
                
                <SettingItem
                  label="Language"
                  description="Select your preferred language"
                  control={
                    <select
                      value={settings.appearance.language}
                      onChange={(e) => updateSetting('appearance', 'language', e.target.value)}
                      className="input-base w-40"
                    >
                      <option value="en">English</option>
                      <option value="ceb">Cebuano</option>
                      <option value="tl">Tagalog</option>
                    </select>
                  }
                />
              </div>
            </SettingsSection>

            {/* Data Management */}
            <SettingsSection title="Data Management" icon={FiDownload}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={exportData}
                    className="btn-base btn-md btn-outline flex items-center justify-center"
                  >
                    <FiDownload className="w-4 h-4 mr-2" />
                    Export My Data
                  </button>
                  
                  <button className="btn-base btn-md btn-outline flex items-center justify-center">
                    <FiUpload className="w-4 h-4 mr-2" />
                    Import Settings
                  </button>
                </div>
              </div>
            </SettingsSection>

            {/* Danger Zone */}
            <div className="card-base p-6 border-l-4 border-red-500">
              <div className="flex items-center space-x-3 mb-4">
                <FiAlertTriangle className="w-6 h-6 text-red-500" />
                <h2 className="text-xl font-bold text-red-800">Danger Zone</h2>
              </div>
              
              <p className="text-gray-600 mb-4">
                These actions are permanent and cannot be undone. Please proceed with caution.
              </p>
              
              <div className="flex items-center space-x-4">
                <button className="btn-base btn-md bg-red-500 text-white hover:bg-red-600">
                  <FiTrash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </button>
                
                <button className="btn-base btn-md btn-outline border-red-300 text-red-600 hover:bg-red-50">
                  Deactivate Store
                </button>
              </div>
            </div>
        </div>
      </div>
    </SellerLayout>
  );
};

export default Settings;