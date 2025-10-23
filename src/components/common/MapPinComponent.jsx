import React, { useState, useEffect, useRef } from 'react';

const MapPinComponent = ({ 
  onAddressConfirm, 
  initialAddress = null, 
  height = '400px',
  isOpen = false,
  onClose = () => {}
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize Google Maps
  useEffect(() => {
    if (isOpen && !map) {
      initializeMap();
    }
  }, [isOpen]);

  const initializeMap = () => {
    if (!window.google) {
      setError('Google Maps API not loaded. Please check your API key.');
      return;
    }

    try {
      // Default center (Cebu City)
      const defaultCenter = { lat: 10.3157, lng: 123.8854 };
      
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 15,
        center: initialAddress ? 
          { lat: initialAddress.lat || defaultCenter.lat, lng: initialAddress.lng || defaultCenter.lng } : 
          defaultCenter,
        mapTypeId: 'roadmap',
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        mapTypeControl: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      setMap(mapInstance);

      // Add click listener for pin placement
      mapInstance.addListener('click', (event) => {
        placeMarker(event.latLng, mapInstance);
      });

      // If initial address has coordinates, place marker
      if (initialAddress && initialAddress.lat && initialAddress.lng) {
        placeMarker(
          new window.google.maps.LatLng(initialAddress.lat, initialAddress.lng), 
          mapInstance
        );
      }

    } catch (error) {
      console.error('Error initializing map:', error);
      setError('Failed to initialize map. Please try again.');
    }
  };

  const placeMarker = (location, mapInstance) => {
    // Remove existing marker
    if (marker) {
      marker.setMap(null);
    }

    // Create new marker
    const newMarker = new window.google.maps.Marker({
      position: location,
      map: mapInstance,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
      title: 'Your Address'
    });

    setMarker(newMarker);

    // Get address from coordinates
    getAddressFromCoordinates(location);

    // Add drag listener
    newMarker.addListener('dragend', () => {
      getAddressFromCoordinates(newMarker.getPosition());
    });
  };

  const getAddressFromCoordinates = (location) => {
    if (!window.google) return;

    setIsLoading(true);
    setError(null);

    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ location }, (results, status) => {
      setIsLoading(false);
      
      if (status === 'OK' && results[0]) {
        const result = results[0];
        const addressComponents = result.address_components;
        
        // Parse address components
        let streetAddress = '';
        let barangay = '';
        let city = '';
        let province = '';
        let zipCode = '';

        addressComponents.forEach(component => {
          const types = component.types;
          
          if (types.includes('street_number') || types.includes('route')) {
            streetAddress += component.long_name + ' ';
          } else if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
            barangay = component.long_name;
          } else if (types.includes('locality')) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            province = component.long_name;
          } else if (types.includes('postal_code')) {
            zipCode = component.long_name;
          }
        });

        const addressData = {
          lat: location.lat(),
          lng: location.lng(),
          street_address: streetAddress.trim(),
          barangay: barangay,
          city: city,
          province: province,
          zip_code: zipCode,
          formatted_address: result.formatted_address,
          recipient_name: initialAddress?.recipient_name || '',
          phone_number: initialAddress?.phone_number || '',
          type: initialAddress?.type || 'home',
          isDefault: initialAddress?.isDefault || false
        };

        setSelectedAddress(addressData);
      } else {
        setError('Could not find address for this location. Please try a different spot.');
      }
    });
  };

  const handleConfirmAddress = () => {
    if (selectedAddress) {
      onAddressConfirm(selectedAddress);
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Pin Your Address</h2>
              <p className="text-gray-600 mt-1">Click on the map to place a pin at your exact location</p>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative">
          <div 
            ref={mapRef} 
            style={{ height }} 
            className="w-full"
          />
          
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Getting address...</span>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span>Click on the map to place your address pin</span>
            </div>
          </div>
        </div>

        {/* Address Details */}
        {selectedAddress && (
          <div className="p-6 border-t border-gray-200">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Selected Address:</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-800 font-medium">{selectedAddress.street_address}</p>
                {selectedAddress.barangay && (
                  <p className="text-gray-600">{selectedAddress.barangay}</p>
                )}
                <p className="text-gray-600">
                  {selectedAddress.city}, {selectedAddress.province} {selectedAddress.zip_code}
                </p>
                <p className="text-sm text-gray-500 mt-2">{selectedAddress.formatted_address}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handleCancel}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAddress}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold"
              >
                Confirm This Address
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border-t border-red-200">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPinComponent;


