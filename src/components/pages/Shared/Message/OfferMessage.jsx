import React from 'react';

const OfferMessage = ({ message, isOwnMessage }) => {
  // Parse the offer data from message metadata or content
  const metadata = message.metadata || {};
  
  // Extract offer information
  const productName = metadata.productName || 'Unknown Product';
  // Be resilient: try several possible fields for the image
  const productImage = metadata.productImage || metadata.image_url || metadata.image || metadata.thumbnailUrl || metadata.thumbnail;
  
  // Debug: Log image data
  console.log('🔄 [OfferMessage] Image debugging:', {
    metadata,
    productImage,
    allImageFields: {
      productImage: metadata.productImage,
      image_url: metadata.image_url,
      image: metadata.image,
      thumbnailUrl: metadata.thumbnailUrl,
      thumbnail: metadata.thumbnail
    }
  });
  const productPrice = metadata.productPrice || 0;
  const offerType = metadata.offerType || 'offer';
  const offerValue = metadata.offerValue;
  const offerItems = metadata.offerItems;
  const offerDescription = metadata.offerDescription || '';
  const additionalMessage = message.content?.includes('Additional Message:') 
    ? message.content.split('Additional Message:')[1]?.trim() 
    : '';

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
              {productImage && productImage !== 'null' && productImage !== 'undefined' ? (
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