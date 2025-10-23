/**
 * Google Maps API Utility
 * 
 * Handles Google Maps API loading and initialization
 * 
 * @version 1.0.0
 */

// Google Maps API configuration
const resolveGoogleMapsApiKey = () => {
  // Prefer Vite-style envs; also check CRA-style for backward compatibility
  const viteEnv = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : undefined;
  const keyFromEnv = (viteEnv && (viteEnv.VITE_GOOGLE_MAPS_API_KEY || viteEnv.REACT_APP_GOOGLE_MAPS_API_KEY)) || undefined;

  if (keyFromEnv && typeof keyFromEnv === 'string' && keyFromEnv.trim().length > 0) {
    return keyFromEnv.trim();
  }

  // As a last resort, check if a runtime global was provided (e.g., window.__GOOGLE_MAPS_API_KEY__)
  const keyFromWindow = typeof window !== 'undefined' && window.__GOOGLE_MAPS_API_KEY__ ? String(window.__GOOGLE_MAPS_API_KEY__) : '';
  if (keyFromWindow.trim()) {
    return keyFromWindow.trim();
  }

  console.error('[Google Maps] Missing API key. Ensure VITE_GOOGLE_MAPS_API_KEY is set in chifere-app/.env and dev server restarted.');
  return '';
};

const GOOGLE_MAPS_CONFIG = {
  apiKey: resolveGoogleMapsApiKey(),
  // Valid optional libraries include 'places', 'geometry' etc. (no 'geocoding' library)
  libraries: ['places'],
  language: 'en',
  region: 'PH'
};

let isLoaded = false;
let isLoading = false;
let loadPromise = null;

/**
 * Load Google Maps API
 * @returns {Promise<boolean>} - Whether the API loaded successfully
 */
export const loadGoogleMapsAPI = () => {
  if (isLoaded) {
    return Promise.resolve(true);
  }

  if (isLoading) {
    return loadPromise;
  }

  isLoading = true;
  loadPromise = new Promise((resolve, reject) => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      isLoaded = true;
      isLoading = false;
      resolve(true);
      return;
    }

    // Create script element
    const script = document.createElement('script');
    if (!GOOGLE_MAPS_CONFIG.apiKey) {
      isLoading = false;
      reject(new Error('Missing Google Maps API key'));
      return;
    }
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_CONFIG.apiKey}&libraries=${GOOGLE_MAPS_CONFIG.libraries.join(',')}&language=${GOOGLE_MAPS_CONFIG.language}&region=${GOOGLE_MAPS_CONFIG.region}`;
    script.async = true;
    script.defer = true;

    // Handle script load
    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      resolve(true);
    };

    // Handle script error
    script.onerror = () => {
      isLoading = false;
      reject(new Error('Failed to load Google Maps API'));
    };

    // Add script to document
    document.head.appendChild(script);
  });

  return loadPromise;
};

/**
 * Check if Google Maps API is loaded
 * @returns {boolean} - Whether the API is loaded
 */
export const isGoogleMapsLoaded = () => {
  return isLoaded && window.google && window.google.maps;
};

/**
 * Get Google Maps API key
 * @returns {string} - The API key
 */
export const getGoogleMapsAPIKey = () => {
  return GOOGLE_MAPS_CONFIG.apiKey;
};

/**
 * Initialize Google Maps with error handling
 * @param {Function} callback - Callback to execute when maps is ready
 * @returns {Promise<void>}
 */
export const initializeGoogleMaps = async (callback) => {
  try {
    await loadGoogleMapsAPI();
    if (callback) {
      callback();
    }
  } catch (error) {
    console.error('Google Maps initialization failed:', error);
    throw error;
  }
};

/**
 * Geocode an address to get coordinates
 * @param {string} address - Address to geocode
 * @returns {Promise<Object>} - Geocoding result
 */
export const geocodeAddress = async (address) => {
  if (!isGoogleMapsLoaded()) {
    await loadGoogleMapsAPI();
  }

  return new Promise((resolve, reject) => {
    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const result = results[0];
        resolve({
          success: true,
          lat: result.geometry.location.lat(),
          lng: result.geometry.location.lng(),
          formatted_address: result.formatted_address,
          address_components: result.address_components
        });
      } else {
        reject(new Error(`Geocoding failed: ${status}`));
      }
    });
  });
};

/**
 * Reverse geocode coordinates to get address
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} - Reverse geocoding result
 */
export const reverseGeocode = async (lat, lng) => {
  if (!isGoogleMapsLoaded()) {
    await loadGoogleMapsAPI();
  }

  return new Promise((resolve, reject) => {
    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const result = results[0];
        resolve({
          success: true,
          formatted_address: result.formatted_address,
          address_components: result.address_components
        });
      } else {
        reject(new Error(`Reverse geocoding failed: ${status}`));
      }
    });
  });
};

export default {
  loadGoogleMapsAPI,
  isGoogleMapsLoaded,
  getGoogleMapsAPIKey,
  initializeGoogleMaps,
  geocodeAddress,
  reverseGeocode
};
