import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../config/supabase';

const OfferMessage = ({ message, isOwnMessage }) => {
  const [productData, setProductData] = useState(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [productError, setProductError] = useState(null);
  
  // Parse the offer data from message metadata or content
  const metadata = message.metadata || {};
  
  // Extract offer information from metadata (fallback values)
  const fallbackProductName = metadata.productName || 'Unknown Product';
  const fallbackProductImage = metadata.productImage || metadata.image_url || metadata.image || metadata.thumbnailUrl || metadata.thumbnail;
  const fallbackProductPrice = metadata.productPrice || 0;
  
  const offerType = metadata.offerType || 'offer';
  const offerValue = metadata.offerValue;
  const offerItems = metadata.offerItems;
  const offerDescription = metadata.offerDescription || '';
  const additionalMessage = message.content?.includes('Additional Message:') 
    ? message.content.split('Additional Message:')[1]?.trim() 
    : '';

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
    
    return data?.publicUrl || null;
  };

  // Fetch real product data from database
  useEffect(() => {
    const fetchProductData = async () => {
      const productId = metadata.productId;
      
      if (!productId) {
        console.log('🔄 [OfferMessage] No product ID found in metadata');
        return;
      }

      setIsLoadingProduct(true);
      setProductError(null);

      try {
        console.log('🔄 [OfferMessage] Fetching product data for ID:', productId);
        
        // Try to find product in old products table first
        const { data: oldProduct, error: oldError } = await supabase
          .from('products')
          .select(`
            *,
            user_profiles!products_seller_id_fkey (
              id,
              display_name,
              business_name,
              profile_image
            )
          `)
          .eq('id', productId)
          .single();

        if (!oldError && oldProduct) {
          console.log('✅ [OfferMessage] Product found in old products table:', oldProduct);
          setProductData(oldProduct);
          return;
        }

        // Try to find in preloved items table
        const { data: prelovedProduct, error: prelovedError } = await supabase
          .from('seller_add_item_preloved')
          .select(`
            *,
            user_profiles!seller_add_item_preloved_seller_id_fkey (
              id,
              display_name,
              business_name,
              profile_image
            )
          `)
          .eq('id', productId)
          .single();

        if (!prelovedError && prelovedProduct) {
          console.log('✅ [OfferMessage] Product found in preloved items table:', prelovedProduct);
          setProductData(prelovedProduct);
          return;
        }

        // Try to find in barter items table
        const { data: barterProduct, error: barterError } = await supabase
          .from('seller_add_barter_item')
          .select(`
            *,
            user_profiles!seller_add_barter_item_seller_id_fkey (
              id,
              display_name,
              business_name,
              profile_image
            )
          `)
          .eq('id', productId)
          .single();

        if (!barterError && barterProduct) {
          console.log('✅ [OfferMessage] Product found in barter items table:', barterProduct);
          setProductData(barterProduct);
          return;
        }

        // Product not found in any table
        console.warn('⚠️ [OfferMessage] Product not found in any table for ID:', productId);
        setProductError('Product not found');
        
      } catch (error) {
        console.error('❌ [OfferMessage] Error fetching product data:', error);
        setProductError(error.message);
      } finally {
        setIsLoadingProduct(false);
      }
    };

    fetchProductData();
  }, [metadata.productId]);

  // Use real product data if available, otherwise fallback to metadata
  const productName = productData?.name || fallbackProductName;
  const productImage = productData ? getProductImageUrl(productData) : fallbackProductImage;
  const productPrice = productData?.price || fallbackProductPrice;

  // Format offer type for display
  const formatOfferType = (type) => {
    switch (type) {
      case 'barter': return 'Barter Exchange';
      case 'cash_offer': return 'Cash Offer';
      default: return type;
    }
  };

  return (
    <div className={`max-w-sm lg:max-w-md ${isOwnMessage ? 'ml-auto' : 'mr-auto'}`}>
      {/* Offer Card */}
      <div className={`rounded-xl shadow-lg overflow-hidden bg-white border border-gray-200 text-gray-900`}>
        
        {/* Header */}
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <span className="text-lg">🛍️</span>
            </div>
            <div>
              <h3 className="font-semibold text-sm">Make Offer Request</h3>
              <p className="text-xs text-gray-500">Product Offer</p>
            </div>
          </div>
            </div>
            
        {/* Product Section */}
        <div className="p-3">
          <div className="flex gap-3">
            {/* Product Image */}
            <div className="flex-shrink-0">
              {isLoadingProduct ? (
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : productImage && productImage !== 'null' && productImage !== 'undefined' ? (
                <img 
                  src={productImage} 
                  alt={productName}
                  className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                  onError={(e) => {
                    console.log('🔄 [OfferMessage] Image failed to load:', productImage);
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                  onLoad={() => {
                    console.log('🔄 [OfferMessage] Image loaded successfully:', productImage);
                  }}
                />
              ) : null}
              <div 
                className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200"
                style={{ display: (productImage && productImage !== 'null' && productImage !== 'undefined') ? 'none' : 'flex' }}
              >
                <span className="text-2xl">📦</span>
              </div>
            </div>
              
            {/* Product Details */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{productName}</h4>
              <p className="text-xs text-gray-600">₱{productPrice.toLocaleString()}</p>
              
              {/* Debug info - show data source */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-400 mt-1">
                  {productData ? '✅ Live data' : '⚠️ Fallback data'}
                  {productError && ` (Error: ${productError})`}
                </div>
              )}
              
              {/* Offer Type Badge */}
              <div className="mt-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  offerType === 'barter' 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {formatOfferType(offerType)}
                </span>
              </div>
            </div>
          </div>

          {/* Offer Details */}
          <div className="mt-3 space-y-2">
            {offerValue && (
              <div className="text-xs">
                <span className="text-gray-500">Offer Value:</span>
                <span className="ml-1 font-medium">₱{offerValue.toLocaleString()}</span>
              </div>
            )}
            
            {offerItems && (
              <div className="text-xs">
                <span className="text-gray-500">Items Offered:</span>
                <span className="ml-1 font-medium">{offerItems}</span>
              </div>
            )}

            {offerDescription && (
              <div className="text-xs">
                <span className="text-gray-500">Description:</span>
                <p className="mt-1 p-2 rounded bg-gray-50 text-xs leading-relaxed border border-gray-200">
                  {offerDescription}
                </p>
              </div>
            )}
            
            {additionalMessage && (
              <div className="text-xs">
                <span className="text-gray-500">Additional Message:</span>
                <p className="mt-1 p-2 rounded bg-gray-50 text-xs leading-relaxed border border-gray-200">
                  {additionalMessage}
                </p>
          </div>
        )}
          </div>

          {/* Status */}
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                'bg-amber-100 text-amber-700'
              }`}>
                Pending
              </span>
            </div>
              </div>
            </div>
          </div>

      {/* Timestamp */}
      <div className={`text-xs mt-1 ${isOwnMessage ? 'text-right text-gray-500' : 'text-left text-gray-500'}`}>
        {new Date(message.createdAt).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </div>
    </div>
  );
};

export default OfferMessage;