/**
 * Image Utilities for ChiFere Cebu
 * 
 * This utility file provides helper functions for handling images
 * throughout the application, including fallbacks and placeholders.
 * 
 * @version 1.0.0
 * @created 2025-01-20
 */

/**
 * Generate a placeholder image URL
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} text - Text to display on placeholder
 * @param {string} backgroundColor - Background color (hex)
 * @param {string} textColor - Text color (hex)
 * @returns {string} Placeholder image URL
 */
export const generatePlaceholder = (
  width = 400, 
  height = 300, 
  text = 'Product Image', 
  backgroundColor = '#E5E7EB', 
  textColor = '#6B7280'
) => {
  return `https://via.placeholder.com/${width}x${height}/${backgroundColor.replace('#', '')}/${textColor.replace('#', '')}?text=${encodeURIComponent(text)}`;
};

/**
 * Get a product placeholder image
 * @param {string} productName - Name of the product
 * @param {string} category - Product category
 * @returns {string} Placeholder image URL
 */
export const getProductPlaceholder = (productName = 'Product', category = 'General') => {
  const categoryColors = {
    'Electronics': { bg: '#DBEAFE', text: '#1E40AF' },
    'Fashion': { bg: '#FCE7F3', text: '#BE185D' },
    'Home & Garden': { bg: '#D1FAE5', text: '#047857' },
    'Sports': { bg: '#FEF3C7', text: '#D97706' },
    'Books': { bg: '#E0E7FF', text: '#3730A3' },
    'Automotive': { bg: '#F3F4F6', text: '#374151' },
    'General': { bg: '#E5E7EB', text: '#6B7280' }
  };

  const colors = categoryColors[category] || categoryColors['General'];
  
  return generatePlaceholder(
    400, 
    300, 
    productName.length > 20 ? productName.substring(0, 20) + '...' : productName,
    colors.bg,
    colors.text
  );
};

/**
 * Get user avatar placeholder
 * @param {string} name - User name
 * @param {number} size - Avatar size
 * @returns {string} Avatar placeholder URL
 */
export const getUserAvatarPlaceholder = (name = 'User', size = 100) => {
  // Generate initials from name
  const initials = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
  
  return generatePlaceholder(
    size,
    size,
    initials,
    '#3B82F6', // Primary blue
    '#FFFFFF'  // White text
  );
};

/**
 * Default product images by category
 */
export const defaultProductImages = {
  'Electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop',
  'Fashion': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop',
  'Home & Garden': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
  'Sports': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
  'Books': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
  'Automotive': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop',
  'General': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop'
};

/**
 * Get a default product image by category
 * @param {string} category - Product category
 * @returns {string} Default image URL
 */
export const getDefaultProductImage = (category = 'General') => {
  return defaultProductImages[category] || defaultProductImages['General'];
};

/**
 * Handle image load error by setting fallback
 * @param {Event} event - Image error event
 * @param {string} fallbackUrl - Fallback image URL
 * @param {string} productName - Product name for placeholder
 * @param {string} category - Product category
 */
export const handleImageError = (event, fallbackUrl = null, productName = 'Product', category = 'General') => {
  const img = event.target;
  
  if (fallbackUrl && img.src !== fallbackUrl) {
    img.src = fallbackUrl;
  } else if (img.src !== getProductPlaceholder(productName, category)) {
    img.src = getProductPlaceholder(productName, category);
  }
};

/**
 * Validate image URL
 * @param {string} url - Image URL to validate
 * @returns {boolean} Whether URL is valid
 */
export const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Optimize image URL for different screen sizes
 * @param {string} url - Original image URL
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @param {string} quality - Image quality (low, medium, high)
 * @returns {string} Optimized image URL
 */
export const optimizeImageUrl = (url, width = 400, height = 300, quality = 'medium') => {
  if (!url || !isValidImageUrl(url)) {
    return getProductPlaceholder('Product', 'General');
  }

  // For Unsplash images, add optimization parameters
  if (url.includes('unsplash.com')) {
    const qualityMap = {
      low: 60,
      medium: 80,
      high: 95
    };
    
    const q = qualityMap[quality] || qualityMap.medium;
    return `${url}&w=${width}&h=${height}&q=${q}&fit=crop`;
  }

  // For other images, return as-is (could be extended for other services)
  return url;
};

/**
 * Image component props helper
 * @param {string} src - Image source
 * @param {string} alt - Alt text
 * @param {string} category - Product category
 * @param {Object} options - Additional options
 * @returns {Object} Image props object
 */
export const getImageProps = (src, alt = 'Image', category = 'General', options = {}) => {
  const {
    width = 400,
    height = 300,
    quality = 'medium',
    enableFallback = true
  } = options;

  const optimizedSrc = optimizeImageUrl(src, width, height, quality);
  
  const props = {
    src: optimizedSrc,
    alt,
    loading: 'lazy',
    style: {
      width: '100%',
      height: 'auto',
      objectFit: 'cover'
    }
  };

  if (enableFallback) {
    props.onError = (e) => handleImageError(e, getDefaultProductImage(category), alt, category);
  }

  return props;
};

export default {
  generatePlaceholder,
  getProductPlaceholder,
  getUserAvatarPlaceholder,
  defaultProductImages,
  getDefaultProductImage,
  handleImageError,
  isValidImageUrl,
  optimizeImageUrl,
  getImageProps
};








