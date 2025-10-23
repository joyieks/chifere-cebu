import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../../../contexts/AuthContext';
import addressService from '../../../../../../services/addressService';
import { theme } from '../../../../../../styles/designSystem';

const AddressSelectionModal = ({ isOpen, onClose, onSelectAddress, selectedAddressId }) => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type: 'home',
    recipient_name: '',
    phone_number: '',
    street_address: '',
    barangay: '',
    city: '',
    province: '',
    zip_code: '',
    isDefault: false,
  });

  // Load addresses when modal opens
  useEffect(() => {
    if (isOpen && user) {
      loadAddresses();
    }
  }, [isOpen, user]);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const result = await addressService.getAddresses(user.uid, 'buyer');
      if (result.success) {
        setAddresses(result.data);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      const result = await addressService.addAddress(user.uid, 'buyer', newAddress);
      if (result.success) {
        setAddresses(prev => [...prev, result.data]);
        setShowAddForm(false);
        setNewAddress({
          type: 'home',
          recipient_name: '',
          phone_number: '',
          street_address: '',
          barangay: '',
          city: '',
          province: '',
          zip_code: '',
          isDefault: false,
        });
      }
    } catch (error) {
      console.error('Error adding address:', error);
    }
  };

  const handleSelectAddress = (address) => {
    onSelectAddress(address);
    onClose();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Select Delivery Address</h2>
              <p className="text-gray-600 mt-1">Choose where you want your order delivered</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading addresses...</p>
            </div>
          ) : (
            <>
              {/* Address List */}
              <div className="space-y-4 mb-6">
                {addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-gray-500 mb-4">No addresses saved yet</p>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Add Your First Address
                    </button>
                  </div>
                ) : (
                  addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                        selectedAddressId === address.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleSelectAddress(address)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <div className={`px-3 py-1 rounded-full text-sm font-semibold mr-3 ${
                              address.type === 'home' ? 'bg-green-100 text-green-700' :
                              address.type === 'work' ? 'bg-blue-100 text-blue-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {address.type.charAt(0).toUpperCase() + address.type.slice(1)}
                            </div>
                            {address.isDefault && (
                              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">
                                Default
                              </span>
                            )}
                          </div>
                          
                          <h3 className="font-bold text-lg text-gray-800 mb-1">{address.recipient_name}</h3>
                          <p className="text-gray-600 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                            {address.phone_number}
                          </p>
                          <p className="text-gray-700 leading-relaxed flex items-start">
                            <svg className="w-4 h-4 mr-2 mt-1 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            {`${address.street_address}, ${address.barangay ? address.barangay + ', ' : ''}${address.city}, ${address.province}, ${address.zip_code}`}
                          </p>
                        </div>
                        
                        {selectedAddressId === address.id && (
                          <div className="ml-4">
                            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add New Address Button */}
              {!showAddForm && addresses.length > 0 && (
                <div className="text-center">
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                  >
                    + Add New Address
                  </button>
                </div>
              )}

              {/* Add Address Form */}
              {showAddForm && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Address</h3>
                  <form onSubmit={handleAddAddress} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Address Type</label>
                        <select 
                          name="type"
                          value={newAddress.type} 
                          onChange={handleChange} 
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="home">Home</option>
                          <option value="work">Work</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                        <input 
                          type="text" 
                          name="recipient_name"
                          value={newAddress.recipient_name || ''} 
                          onChange={handleChange} 
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                          placeholder="Enter full name"
                          required 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                        <input 
                          type="text" 
                          name="phone_number"
                          value={newAddress.phone_number || ''} 
                          onChange={handleChange} 
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                          placeholder="+63 912 345 6789"
                          required 
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
                        <input 
                          type="text" 
                          name="street_address"
                          value={newAddress.street_address} 
                          onChange={handleChange} 
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                          placeholder="House/Unit/Floor No., Street Name"
                          required 
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Barangay</label>
                        <input 
                          type="text" 
                          name="barangay"
                          value={newAddress.barangay} 
                          onChange={handleChange} 
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                          placeholder="Barangay"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                        <input 
                          type="text" 
                          name="city"
                          value={newAddress.city} 
                          onChange={handleChange} 
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                          placeholder="City"
                          required 
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Province</label>
                        <input 
                          type="text" 
                          name="province"
                          value={newAddress.province} 
                          onChange={handleChange} 
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                          placeholder="Province"
                          required 
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">ZIP Code</label>
                        <input 
                          type="text" 
                          name="zip_code"
                          value={newAddress.zip_code} 
                          onChange={handleChange} 
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                          placeholder="ZIP Code"
                        />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        name="isDefault"
                        checked={newAddress.isDefault}
                        onChange={handleChange}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mr-3" 
                      />
                      <label className="text-sm font-medium text-gray-700">Set as default address</label>
                    </div>

                    <div className="flex space-x-4 pt-4">
                      <button 
                        type="button" 
                        className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-semibold"
                        onClick={() => setShowAddForm(false)}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold"
                      >
                        Add Address
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AddressSelectionModal;
