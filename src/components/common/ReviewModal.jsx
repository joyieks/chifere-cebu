/**
 * Review Modal Component
 * 
 * Modal for customers to leave reviews for purchased items.
 * 
 * Features:
 * - Star rating system
 * - Text review comments
 * - Product information display
 * - Form validation
 * - Integration with reviewService
 * 
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiStar, FiPackage } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast';
import reviewService from '../../services/reviewService';

const ReviewModal = ({ 
  isOpen, 
  onClose, 
  orderItem, 
  orderId, 
  sellerId,
  onReviewSubmitted 
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  // Handle rating selection
  const handleRatingClick = (selectedRating) => {
    setRating(selectedRating);
  };

  // Handle rating hover
  const handleRatingHover = (hoveredRating) => {
    setHoveredRating(hoveredRating);
  };

  // Handle rating leave
  const handleRatingLeave = () => {
    setHoveredRating(0);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      showToast('Please select a rating', 'error');
      return;
    }

    if (!comment.trim()) {
      showToast('Please write a review comment', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewData = {
        buyer_id: user.id,
        seller_id: sellerId,
        product_id: orderItem.product_id,
        order_id: orderId,
        rating: rating,
        comment: comment.trim()
      };

      console.log('🔍 [ReviewModal] Submitting review with data:', reviewData);
      console.log('🔍 [ReviewModal] Rating value:', rating, 'Type:', typeof rating);

      const result = await reviewService.createReview(reviewData);
      
      if (result.success) {
        showToast('Review submitted successfully!', 'success');
        onReviewSubmitted?.(result.data);
        handleClose();
      } else {
        showToast(result.error || 'Failed to submit review', 'error');
      }
    } catch (error) {
      console.error('Review submission error:', error);
      showToast('Failed to submit review', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setRating(0);
    setComment('');
    setHoveredRating(0);
    onClose();
  };

  // Render star rating
  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starNumber = index + 1;
      const isFilled = starNumber <= (hoveredRating || rating);
      
      return (
        <button
          key={index}
          type="button"
          className="focus:outline-none"
          onClick={() => handleRatingClick(starNumber)}
          onMouseEnter={() => handleRatingHover(starNumber)}
          onMouseLeave={handleRatingLeave}
        >
          <FiStar
            className={`w-8 h-8 transition-colors ${
              isFilled ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        </button>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Write a Review</h2>
              <p className="text-sm text-gray-600 mt-1">Share your experience with this product</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Product Information */}
            <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                {orderItem.product_image ? (
                  <img
                    src={orderItem.product_image}
                    alt={orderItem.product_name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    <FiPackage className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{orderItem.product_name}</h3>
                <p className="text-sm text-gray-500">Quantity: {orderItem.quantity}</p>
                <p className="text-sm text-gray-500">Price: ₱{parseFloat(orderItem.unit_price || 0).toLocaleString()}</p>
              </div>
            </div>

            {/* Review Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How would you rate this product? *
                </label>
                <div className="flex items-center space-x-1">
                  {renderStars()}
                </div>
                {rating > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Very Good'}
                    {rating === 5 && 'Excellent'}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                  Write your review *
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {comment.length}/500 characters
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || rating === 0 || !comment.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReviewModal;
