/**
 * Review Modal Component
 * 
 * Modal for buyers to write reviews and rate products after receiving them.
 * 
 * Features:
 * - Star rating system (1-5 stars)
 * - Comment text area
 * - Review validation
 * - Success/error handling
 * 
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiStar, 
  FiX, 
  FiSend,
  FiPackage,
  FiUser
} from 'react-icons/fi';
import { useToast } from '../../../../../components/Toast';
import reviewService from '../../../../../services/reviewService';

const ReviewModal = ({ isOpen, onClose, order, onReviewSubmitted }) => {
  const { showToast } = useToast();
  
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle star click
  const handleStarClick = (starRating) => {
    setRating(starRating);
  };

  // Handle star hover
  const handleStarHover = (starRating) => {
    setHoveredRating(starRating);
  };

  // Handle star leave
  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      showToast('Please select a rating', 'error');
      return;
    }

    if (comment.trim().length < 10) {
      showToast('Please write at least 10 characters in your review', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the first order item to determine product and seller
      const firstItem = order.order_items?.[0];
      if (!firstItem) {
        showToast('No items found in this order', 'error');
        return;
      }

      const reviewData = {
        buyer_id: order.buyer_id,
        seller_id: order.seller_id,
        product_id: firstItem.product_id,
        order_id: order.id,
        rating: rating,
        comment: comment.trim()
      };

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
    setHoveredRating(0);
    setComment('');
    setIsSubmitting(false);
    onClose();
  };

  // Render star rating
  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starNumber = index + 1;
      const isActive = starNumber <= (hoveredRating || rating);
      
      return (
        <button
          key={index}
          type="button"
          className={`p-1 transition-colors ${
            isActive ? 'text-yellow-400' : 'text-gray-300'
          } hover:text-yellow-400`}
          onClick={() => handleStarClick(starNumber)}
          onMouseEnter={() => handleStarHover(starNumber)}
          onMouseLeave={handleStarLeave}
        >
          <FiStar className="w-8 h-8 fill-current" />
        </button>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiStar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Write a Review</h2>
                <p className="text-sm text-gray-600">Share your experience</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Order Info */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiPackage className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Order #{order.order_number}</p>
                <p className="text-sm text-gray-600">
                  {order.order_items?.length || 0} item(s) • Delivered
                </p>
              </div>
            </div>
          </div>

          {/* Review Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Rating Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How would you rate this purchase? *
              </label>
              <div className="flex items-center space-x-1">
                {renderStars()}
                <span className="ml-3 text-sm text-gray-600">
                  {rating > 0 && (
                    <>
                      {rating === 1 && 'Poor'}
                      {rating === 2 && 'Fair'}
                      {rating === 3 && 'Good'}
                      {rating === 4 && 'Very Good'}
                      {rating === 5 && 'Excellent'}
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Comment Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Write your review *
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this product and seller..."
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  Minimum 10 characters required
                </p>
                <p className="text-xs text-gray-400">
                  {comment.length}/500
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || rating === 0 || comment.trim().length < 10}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <FiSend className="w-4 h-4" />
                    <span>Submit Review</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReviewModal;
