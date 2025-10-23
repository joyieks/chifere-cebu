/**
 * OfferModal Component
 * 
 * Modal component for making barter offers on products.
 * Allows users to send offers to sellers for barter items.
 * 
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiDollarSign, FiPackage, FiMessageSquare, FiClock } from 'react-icons/fi';
import { useMessaging } from '../../../../contexts/MessagingContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { useToast } from '../../../../components/Toast';
import { supabase } from '../../../../config/supabase';

// Helper function to get full image URL from Supabase Storage
const getProductImageUrl = (product) => {
  if (!product) return null;
  
  // Check all possible image field names
  const imagePath = product.primary_image || 
                    product.images?.[0] || 
                    product.image_url || 
                    product.image || 
                    product.product_image || 
                    product.photo || 
                    product.photos?.[0] || 
                    product.thumbnail;
  
  if (!imagePath) return null;
  
  // If it's already a full URL (starts with http), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Otherwise, construct Supabase Storage URL
  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(imagePath);
  
  console.log('🔄 [OfferModal] Image path:', imagePath);
  console.log('🔄 [OfferModal] Generated URL:', data?.publicUrl);
  
  return data?.publicUrl || null;
};

const OfferModal = ({ 
  isOpen, 
  onClose, 
  product, 
  store 
}) => {
  const { user } = useAuth();
  const { sendOffer } = useMessaging();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    offerType: 'barter', // barter, cash_offer, trade
    offerValue: '',
    offerDescription: '',
    offerItems: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      showToast('Please log in to make an offer', 'error');
      return;
    }

    // Debug: Log the product and store data
    console.log('🔄 [OfferModal] Product data:', product);
    console.log('🔄 [OfferModal] ALL product keys:', product ? Object.keys(product) : 'no product');
    console.log('🔄 [OfferModal] Product image fields:', {
      primary_image: product?.primary_image,
      images: product?.images,
      image_url: product?.image_url,
      image: product?.image,
      product_image: product?.product_image,
      photo: product?.photo,
      photos: product?.photos,
      thumbnail: product?.thumbnail
    });
    console.log('🔄 [OfferModal] Store data:', store);

    if (!product) {
      console.error('🔄 [OfferModal] Product data is missing');
      showToast('Product information is missing', 'error');
      return;
    }

    // Create store data from product if store is missing
    let storeData = store;
    if (!storeData && product.seller_id) {
      storeData = {
        id: product.seller_id,
        name: 'Unknown Store',
        business_name: 'Unknown Store',
        display_name: 'Unknown Store',
        rating: 4.5,
        location: { city: 'Cebu' },
        verified: false,
        policies: {
          shipping: 'Standard shipping',
          returns: '30-day returns',
          payment: 'All major cards accepted'
        }
      };
      console.log('🔄 [OfferModal] Created fallback store data:', storeData);
    }

    if (!storeData) {
      console.error('🔄 [OfferModal] Store data is missing and cannot be created from product');
      showToast('Store information is missing', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const offerData = {
        productId: product.id,
        productName: product.name,
        productImage: getProductImageUrl(product),
        productPrice: product.price,
        sellerId: storeData.id,
        sellerName: storeData.business_name || storeData.display_name,
        offerType: formData.offerType,
        offerValue: formData.offerValue,
        offerDescription: formData.offerDescription,
        offerItems: formData.offerItems,
        message: formData.message,
        status: 'pending'
      };

      const result = await sendOffer(offerData);
      
      if (result.success) {
        showToast('Offer sent successfully!', 'success');
        onClose();
        setFormData({
          offerType: 'barter',
          offerValue: '',
          offerDescription: '',
          offerItems: '',
          message: ''
        });
      } else {
        showToast(result.error || 'Failed to send offer', 'error');
      }
    } catch (error) {
      console.error('Error sending offer:', error);
      showToast('An error occurred while sending the offer', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Make an Offer</h2>
              <p className="text-sm text-gray-600 mt-1">
                {product?.name} from {store?.business_name || store?.display_name || 'Unknown Store'}
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Product Preview */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-4">
                {/* Product Image */}
                <div className="flex-shrink-0 w-20 h-20 bg-white rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                  {getProductImageUrl(product) ? (
                    <img 
                      src={getProductImageUrl(product)} 
                      alt={product?.name || 'Product'} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        console.log('🔄 [OfferModal] Image failed to load');
                        e.target.style.display = 'none';
                        e.target.parentElement.querySelector('.fallback-icon')?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <FiPackage className="w-8 h-8 text-gray-400 fallback-icon" style={{ display: getProductImageUrl(product) ? 'none' : 'block' }} />
                </div>
                {/* Product Info */}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{product?.name}</h3>
                  <p className="text-sm text-orange-600 font-medium">
                    {product?.barter_item ? 'Available for Barter' : `₱${product?.price?.toLocaleString()}`}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Offer Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Offer Type
                </label>
                <select
                  name="offerType"
                  value={formData.offerType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="barter">Barter Exchange</option>
                  <option value="cash_offer">Cash Offer</option>
                </select>
              </div>

              {/* Offer Value */}
              {formData.offerType === 'cash_offer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cash Offer (₱)
                  </label>
                  <div className="relative">
                    <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      name="offerValue"
                      value={formData.offerValue}
                      onChange={handleInputChange}
                      placeholder="Enter your offer amount"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              )}

              {/* Offer Items */}
              {formData.offerType === 'barter' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Items You're Offering
                  </label>
                  <div className="relative">
                    <FiPackage className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <textarea
                      name="offerItems"
                      value={formData.offerItems}
                      onChange={handleInputChange}
                      placeholder="Describe the items you're offering in exchange..."
                      rows={3}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Offer Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Offer Description
                </label>
                <div className="relative">
                  <FiMessageSquare className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <textarea
                    name="offerDescription"
                    value={formData.offerDescription}
                    onChange={handleInputChange}
                    placeholder="Describe your offer in detail..."
                    rows={3}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              {/* Additional Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Message (Optional)
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Any additional information for the seller..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Expiry Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FiClock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">Offer Expiry</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Your offer will expire in 7 days if not responded to.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <FiMessageSquare className="w-4 h-4" />
                      <span>Send Offer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OfferModal;