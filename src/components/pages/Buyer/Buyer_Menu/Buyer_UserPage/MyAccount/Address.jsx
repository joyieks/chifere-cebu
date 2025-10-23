import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../../../contexts/AuthContext';
import addressService from '../../../../../../services/addressService';
import MapPinComponent from '../../../../../../components/common/MapPinComponent';
import { loadGoogleMapsAPI } from '../../../../../../utils/googleMaps';

const initialAddresses = [
  {
    id: 1,
    type: 'Home',
    name: 'Brent Catacutan',
    phone: '+63 912 345 6789',
    address: '123 Main Street, Barangay Lahug, Cebu City, Cebu 6000',
    isDefault: true,
  },
  {
    id: 2,
    type: 'Work',
    name: 'Brent Catacutan',
    phone: '+63 912 345 6789',
    address: '456 Business Park, IT Park, Cebu City, Cebu 6000',
    isDefault: false,
  },
];

const Address = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type: 'home',
    recipient_name: '',
    phone_number: '',
    street_address: '',
    barangay: '',
    city: '',
    province: '',
    zip_code: '',
    lat: null,
    lng: null,
    isDefault: false,
    isConfirmed: false, // New field to track if address is confirmed via map
  });

  // Load addresses from service
  useEffect(() => {
    const loadAddresses = async () => {
      if (user) {
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
      }
    };
    loadAddresses();
  }, [user]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      const result = await addressService.addAddress(user.uid, 'buyer', newAddress);
      if (result.success) {
        setAddresses(prev => [...prev, result.data]);
        setShowAdd(false);
        setNewAddress({ type: 'home', recipient_name: '', phone_number: '', street_address: '', barangay: '', city: '', province: '', zip_code: '', isDefault: false });
      }
    } catch (error) {
      console.error('Error adding address:', error);
    }
  };

  const handleEdit = (id) => {
    const address = addresses.find(addr => addr.id === id);
    setNewAddress(address);
    setEditingId(id);
    setShowAdd(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      const result = await addressService.updateAddressById(editingId, newAddress);
      if (result.success) {
        setAddresses(prev => prev.map(addr => 
          addr.id === editingId ? result.data : addr
        ));
        setShowAdd(false);
        setEditingId(null);
        setNewAddress({ type: 'home', recipient_name: '', phone_number: '', street_address: '', barangay: '', city: '', province: '', zip_code: '', isDefault: false });
      }
    } catch (error) {
      console.error('Error updating address:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const result = await addressService.deleteAddressById(id);
      if (result.success) {
        setAddresses(prev => prev.filter(addr => addr.id !== id));
      }
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const result = await addressService.updateAddressById(id, { isDefault: true });
      if (result.success) {
        setAddresses(prev => prev.map(addr => ({
          ...addr,
          isDefault: addr.id === id
        })));
      }
    } catch (error) {
      console.error('Error setting default address:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      isConfirmed: false // Reset confirmation when manually editing
    }));
  };

  const handleOpenMap = async () => {
    setMapLoading(true);
    try {
      await loadGoogleMapsAPI();
      setShowMap(true);
    } catch (error) {
      console.error('Failed to load Google Maps:', error);
      alert('Failed to load Google Maps. Please check your internet connection and try again.');
    } finally {
      setMapLoading(false);
    }
  };

  const handleAddressConfirm = (confirmedAddress) => {
    setNewAddress(prev => ({
      ...prev,
      ...confirmedAddress,
      isConfirmed: true
    }));
    setShowMap(false);
  };

  const handleMapClose = () => {
    setShowMap(false);
  };

  if (loading) {
    return (
      <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl mx-auto backdrop-blur-sm border border-white/20">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading addresses...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl mx-auto backdrop-blur-sm border border-white/20">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            My Addresses
          </h1>
          <p className="text-gray-500">Manage your delivery addresses</p>
        </div>

        {/* Add Address Button */}
        <div className="mb-8 flex justify-between items-center">
          <span className="font-semibold text-gray-700 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            Saved Addresses ({addresses.length})
          </span>
          <button 
            className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 ease-in-out flex items-center space-x-2"
            onClick={() => setShowAdd(true)}
          >
            <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add New Address</span>
          </button>
        </div>

        {/* Address Cards */}
        <div className="space-y-4">
          {addresses.length === 0 ? (
            <div className="text-center py-12 animate-fade-in">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-500">No addresses saved yet</p>
              <p className="text-sm text-gray-400">Add your first address to get started</p>
            </div>
          ) : (
            addresses.map((address, index) => (
              <div 
                key={address.id} 
                className="group relative bg-gradient-to-r from-white to-gray-50 rounded-2xl p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out border border-gray-100"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold mr-3 ${
                        address.type === 'home' ? 'bg-green-100 text-green-700' :
                        address.type === 'work' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                          {address.type === 'home' ? (
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                          ) : (
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v2a1 1 0 01-1 1H6a1 1 0 01-1-1v-2h8z" clipRule="evenodd" />
                          )}
                        </svg>
                        {address.type.charAt(0).toUpperCase() + address.type.slice(1)}
                      </div>
                      {address.isDefault && (
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">
                          Default
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-xl text-gray-800 mb-2">{address.recipient_name}</h3>
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
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <button 
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all duration-200 font-medium border border-blue-200 hover:border-blue-300 group-hover:scale-105"
                      onClick={() => handleEdit(address.id)}
                    >
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    
                    {!address.isDefault && (
                      <button 
                        className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all duration-200 font-medium border border-green-200 hover:border-green-300 group-hover:scale-105"
                        onClick={() => handleSetDefault(address.id)}
                      >
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Set Default
                      </button>
                    )}
                    
                    <button 
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200 font-medium border border-red-200 hover:border-red-300 group-hover:scale-105"
                      onClick={() => handleDelete(address.id)}
                    >
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add/Edit Address Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl mx-4 transform animate-slide-up max-h-[90vh] overflow-y-auto">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingId ? 'Edit Address' : 'Add New Address'}
                </h2>
                <p className="text-gray-500">Enter your delivery address details</p>
              </div>

              <form onSubmit={editingId ? handleUpdate : handleAdd} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address Type</label>
                    <select 
                      name="type"
                      value={newAddress.type} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
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
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white" 
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white" 
                    placeholder="+63 912 345 6789"
                    required 
                  />
                </div>

                {/* Map Pin Button */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Address Location</h3>
                      <p className="text-sm text-gray-600">Pin your exact location on the map for accurate delivery</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenMap}
                      disabled={mapLoading}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {mapLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Loading Map...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          <span>Pin Location on Map</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  {newAddress.isConfirmed && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-green-800 font-medium">Address confirmed via map pin</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
                    <input 
                      type="text" 
                      name="street_address"
                      value={newAddress.street_address || ''} 
                      onChange={handleChange} 
                      className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        newAddress.isConfirmed 
                          ? 'bg-gray-100 cursor-not-allowed' 
                          : 'bg-gray-50 hover:bg-white'
                      }`}
                      placeholder="House/Unit/Floor No., Street Name"
                      required 
                      readOnly={newAddress.isConfirmed}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Barangay</label>
                    <input 
                      type="text" 
                      name="barangay"
                      value={newAddress.barangay || ''} 
                      onChange={handleChange} 
                      className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        newAddress.isConfirmed 
                          ? 'bg-gray-100 cursor-not-allowed' 
                          : 'bg-gray-50 hover:bg-white'
                      }`}
                      placeholder="Barangay"
                      readOnly={newAddress.isConfirmed}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                    <input 
                      type="text" 
                      name="city"
                      value={newAddress.city || ''} 
                      onChange={handleChange} 
                      className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        newAddress.isConfirmed 
                          ? 'bg-gray-100 cursor-not-allowed' 
                          : 'bg-gray-50 hover:bg-white'
                      }`}
                      placeholder="City"
                      required 
                      readOnly={newAddress.isConfirmed}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Province</label>
                    <input 
                      type="text" 
                      name="province"
                      value={newAddress.province || ''} 
                      onChange={handleChange} 
                      className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        newAddress.isConfirmed 
                          ? 'bg-gray-100 cursor-not-allowed' 
                          : 'bg-gray-50 hover:bg-white'
                      }`}
                      placeholder="Province"
                      required 
                      readOnly={newAddress.isConfirmed}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ZIP Code</label>
                    <input 
                      type="text" 
                      name="zip_code"
                      value={newAddress.zip_code || ''} 
                      onChange={handleChange} 
                      className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        newAddress.isConfirmed 
                          ? 'bg-gray-100 cursor-not-allowed' 
                          : 'bg-gray-50 hover:bg-white'
                      }`}
                      placeholder="ZIP Code"
                      readOnly={newAddress.isConfirmed}
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
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold"
                    onClick={() => {
                      setShowAdd(false);
                      setEditingId(null);
                      setNewAddress({ type: 'Home', name: '', phone: '', address: '', isDefault: false });
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold transform hover:scale-105"
                  >
                    {editingId ? 'Update Address' : 'Add Address'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Map Pin Component */}
        <MapPinComponent
          isOpen={showMap}
          onClose={handleMapClose}
          onAddressConfirm={handleAddressConfirm}
          initialAddress={newAddress}
          height="500px"
        />
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

export default Address;
