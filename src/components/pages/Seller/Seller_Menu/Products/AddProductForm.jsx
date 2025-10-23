import React, { useState } from 'react';
import { theme } from '../../../../../styles/designSystem';
import {
  FiX,
  FiCheck,
  FiUpload,
  FiTrash2,
  FiPackage,
  FiDollarSign,
  FiImage,
  FiTag,
  FiRefreshCw
} from 'react-icons/fi';
import itemService from '../../../../../services/itemService';
import fileUploadService from '../../../../../services/fileUploadService';
import { useAuth } from '../../../../../contexts/AuthContext';

const AddProductForm = ({ isOpen, onClose, onSuccess, editData = null }) => {
  const { user } = useAuth();
  const isEditMode = !!editData;

  // Form data
  const [formData, setFormData] = useState({
    // Product type selection
    productType: editData?.product_type || 'preloved', // 'preloved' or 'barter'
    
    // Basic Info
    name: editData?.name || '',
    description: editData?.description || '',
    category: editData?.category || '',
    condition: editData?.condition || '',
    location: editData?.location || user?.address || '',
    brand: editData?.brand || '',
    model: editData?.model || '',
    quantity: editData?.quantity || 1,

    // Pricing (for preloved items)
    price: editData?.price || '',
    originalPrice: editData?.original_price || '',

    // Barter specific
    barterPreferences: editData?.barter_preferences || '',
    estimatedValue: editData?.estimated_value || '',

    // Images
    images: [],
    existingImages: editData?.images || [],
    imagePreviews: editData?.images || [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Categories
  const categories = [
    'Electronics',
    'Fashion & Apparel', 
    'Home & Garden',
    'Furniture',
    'Sports & Outdoors',
    'Books & Media',
    'Automotive',
    'Toys & Games',
    'Collectibles & Art',
    'Other'
  ];

  // Conditions
  const conditions = [
    'New',
    'Like New',
    'Good',
    'Fair',
    'Poor'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [...formData.images, ...files];
    setFormData(prev => ({
      ...prev,
      images: newImages,
      imagePreviews: [...prev.imagePreviews, ...files.map(file => URL.createObjectURL(file))]
    }));
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    const newPreviews = formData.imagePreviews.filter((_, i) => i !== index);
    setFormData(prev => ({
        ...prev,
        images: newImages,
      imagePreviews: newPreviews
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    setError('');

    try {
      // First, create the product to get an ID
      const productData = {
        seller_id: user.id,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        condition: formData.condition,
        location: formData.location,
        brand: formData.brand,
        model: formData.model,
        quantity: parseInt(formData.quantity),
        images: [], // Will be updated after upload
        primary_image: '', // Will be updated after upload
        status: 'active'
      };

      let result;
      if (formData.productType === 'preloved') {
        // Add to preloved items table
        productData.price = parseFloat(formData.price) || 0;
        productData.original_price = parseFloat(formData.originalPrice) || null;
        productData.product_type = 'preloved';
        productData.selling_mode = 'sell';
        productData.is_barter_only = false;
        productData.is_sell_only = true;
        productData.is_both = false;
        
        result = await itemService.createPrelovedItem(productData);
      } else {
        // Add to barter items table
        productData.barter_preferences = formData.barterPreferences;
        productData.estimated_value = parseFloat(formData.estimatedValue) || 0;
        productData.product_type = 'barter';
        productData.selling_mode = 'barter';
        productData.is_barter_only = true;
        productData.is_sell_only = false;
        productData.is_both = false;
        
        result = await itemService.createBarterItem(productData);
      }

      if (!result.success) {
        setError(result.error || 'Failed to create product');
        return;
      }

      const productId = result.data.id;
      console.log('✅ Product created with ID:', productId);

      // Upload images if any
      if (formData.images.length > 0) {
        console.log('📸 Uploading images...');
        const uploadedImages = [];
        
        for (let i = 0; i < formData.images.length; i++) {
          const file = formData.images[i];
          console.log(`📸 Uploading image ${i + 1}/${formData.images.length}:`, file.name);
          
          const uploadResult = await fileUploadService.uploadProductImage(file, user.id, productId);
          
          if (uploadResult.success) {
            uploadedImages.push(uploadResult.data.url);
            console.log(`✅ Image ${i + 1} uploaded successfully:`, uploadResult.data.url);
          } else {
            console.error(`❌ Failed to upload image ${i + 1}:`, uploadResult.error);
            // Continue with other images even if one fails
          }
        }

        // Update product with uploaded image URLs
        if (uploadedImages.length > 0) {
          const updateData = {
            images: uploadedImages,
            primary_image: uploadedImages[0]
          };

          console.log('🔄 Updating product with image URLs:', updateData);
          // Pass the correct table name based on product type
          const tableName = formData.productType === 'preloved' ? 'seller_add_item_preloved' : 'seller_add_barter_item';
          const updateResult = await itemService.updateItem(productId, updateData, tableName);
          if (updateResult.success) {
            console.log('✅ Product updated with image URLs');
          } else {
            console.error('❌ Failed to update product with images:', updateResult.error);
          }
        } else {
          console.warn('⚠️ No images were successfully uploaded');
        }
      } else {
        console.log('ℹ️ No images to upload');
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Create product error:', err);
      setError('An error occurred while creating the product');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pt-20">
      {/* Blurred background overlay */}
      <div 
        className="absolute inset-0 bg-white bg-opacity-20" 
        style={{ 
          backdropFilter: 'blur(20px)', 
          WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(0, 0, 0, 0.3)'
        }}
      ></div>
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Type *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleInputChange('productType', 'preloved')}
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  formData.productType === 'preloved'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FiPackage className="w-8 h-8 mx-auto mb-2" />
                <div className="font-medium">Item for Sale</div>
                <div className="text-sm text-gray-500">Regular products with fixed price</div>
              </button>
              
              <button
                type="button"
                onClick={() => handleInputChange('productType', 'barter')}
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  formData.productType === 'barter'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FiRefreshCw className="w-8 h-8 mx-auto mb-2" />
                <div className="font-medium">Barter Item</div>
                <div className="text-sm text-gray-500">Items for trade/exchange</div>
              </button>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                >
                <option value="">Select Category</option>
                  {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition *
                </label>
                <select
                  value={formData.condition}
                onChange={(e) => handleInputChange('condition', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                >
                <option value="">Select Condition</option>
                  {conditions.map(cond => (
                  <option key={cond} value={cond}>{cond}</option>
                  ))}
                </select>
            </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
                </label>
                <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
                </label>
                <input
                  type="text"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            </div>

          {/* Pricing Section - Only for preloved items */}
          {formData.productType === 'preloved' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₱) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                  Original Price (₱)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                  value={formData.originalPrice}
                  onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
                </div>
          )}

          {/* Barter Section - Only for barter items */}
          {formData.productType === 'barter' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Value (₱)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.estimatedValue}
                  onChange={(e) => handleInputChange('estimatedValue', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Barter Preferences
                </label>
                <textarea
                  value={formData.barterPreferences}
                  onChange={(e) => handleInputChange('barterPreferences', e.target.value)}
                  rows={3}
                  placeholder="What items are you looking to trade for?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              </div>
            )}

          {/* Images */}
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Images
              </label>
            
            {/* Image Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <FiUpload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  Click to upload images or drag and drop
                </span>
              </label>
            </div>

            {/* Image Previews */}
            {formData.imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {formData.imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <FiTrash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
              type="button"
            onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
              Cancel
          </button>
          <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <FiCheck className="w-4 h-4 mr-2" />
                  {isEditMode ? 'Update Product' : 'Create Product'}
                </>
              )}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductForm;