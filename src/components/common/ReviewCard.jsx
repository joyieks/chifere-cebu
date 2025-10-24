/**
 * Review Card Component
 * 
 * Displays individual review cards with rating, comment, and reviewer info.
 * 
 * Features:
 * - Star rating display
 * - Reviewer information
 * - Review date
 * - Comment text
 * - Verified purchase badge
 * 
 * @version 1.0.0
 */

import React from 'react';
import { FiStar, FiUser, FiCheckCircle } from 'react-icons/fi';

const ReviewCard = ({ review, showProductInfo = false }) => {
  // Render star rating
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => {
      const starNumber = index + 1;
      const isActive = starNumber <= rating;
      
      return (
        <FiStar
          key={index}
          className={`w-4 h-4 ${
            isActive ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
        />
      );
    });
  };

  // Get reviewer name
  const getReviewerName = () => {
    if (review.buyer?.raw_user_meta_data?.full_name) {
      return review.buyer.raw_user_meta_data.full_name;
    }
    if (review.buyer?.raw_user_meta_data?.name) {
      return review.buyer.raw_user_meta_data.name;
    }
    if (review.buyer?.email) {
      return review.buyer.email.split('@')[0];
    }
    return 'Anonymous';
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-100 rounded-full">
            <FiUser className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <p className="font-medium text-gray-900">{getReviewerName()}</p>
              {review.is_verified && (
                <div className="flex items-center space-x-1 text-green-600">
                  <FiCheckCircle className="w-3 h-3" />
                  <span className="text-xs font-medium">Verified</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500">{formatDate(review.created_at)}</p>
          </div>
        </div>
        
        {/* Rating */}
        <div className="flex items-center space-x-1">
          {renderStars(review.rating)}
          <span className="ml-2 text-sm font-medium text-gray-700">
            {review.rating}/5
          </span>
        </div>
      </div>

      {/* Comment */}
      {review.comment && (
        <div className="mb-3">
          <p className="text-gray-700 leading-relaxed">{review.comment}</p>
        </div>
      )}

      {/* Product Info (if needed) */}
      {showProductInfo && review.product_id && (
        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Product ID: {review.product_id}
          </p>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
