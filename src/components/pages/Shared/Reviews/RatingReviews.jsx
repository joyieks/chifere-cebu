/**
 * Rating & Reviews System Component
 * 
 * Implements the user rating and review system as specified in the ChiFere manuscript.
 * Enables buyers to leave ratings and reviews, enhancing trust and transparency.
 * 
 * Features:
 * - Star rating system (1-5 stars)
 * - Written review submission
 * - Review display with filtering
 * - Seller response functionality
 * - Review statistics and analytics
 * 
 * @version 1.0.0 - Initial implementation per manuscript Figure 17
 */

import React, { useState, useEffect } from 'react';
import { theme } from '../../../../styles/designSystem';
import { 
  FiStar, 
  FiThumbsUp, 
  FiThumbsDown, 
  FiFlag, 
  FiMessageSquare,
  FiFilter,
  FiUser,
  FiCheck,
  FiEdit3,
  FiCamera
} from 'react-icons/fi';

const RatingReviews = ({ 
  productId, 
  sellerId, 
  currentUser, 
  userRole = 'buyer',
  onReviewSubmitted,
  onReviewUpdated 
}) => {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({
    rating: 0,
    title: '',
    content: '',
    images: []
  });
  const [reviewMode, setReviewMode] = useState('view'); // 'view', 'write', 'edit'
  const [filterRating, setFilterRating] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showImages, setShowImages] = useState(false);

  // Mock reviews data
  useEffect(() => {
    // TODO: Replace with actual reviews from Firebase
    const mockReviews = [
      {
        id: 'rev1',
        userId: 'user1',
        userName: 'Maria Santos',
        userAvatar: '/default-avatar.svg',
        rating: 5,
        title: 'Excellent quality and fast delivery!',
        content: 'The item was exactly as described. Great condition and the seller was very responsive to my questions. Highly recommended!',
        images: ['/placeholder-product.svg'],
        timestamp: '2025-01-20T10:30:00',
        likes: 12,
        dislikes: 0,
        sellerResponse: null,
        verified: true,
        helpful: 15
      },
      {
        id: 'rev2',
        userId: 'user2',
        userName: 'Paolo Reyes',
        userAvatar: '/default-avatar.svg',
        rating: 4,
        title: 'Good product, minor wear',
        content: 'Item is in good condition with some minor signs of use. Seller was honest about the condition. Fair price for what you get.',
        images: [],
        timestamp: '2025-01-18T14:20:00',
        likes: 8,
        dislikes: 1,
        sellerResponse: {
          content: 'Thank you for your honest review! I always try to describe items accurately.',
          timestamp: '2025-01-18T16:45:00'
        },
        verified: true,
        helpful: 6
      },
      {
        id: 'rev3',
        userId: 'user3',
        userName: 'Carlos Lopez',
        userAvatar: '/default-avatar.svg',
        rating: 3,
        title: 'Average condition',
        content: 'The item works fine but has more wear than expected. Packaging could be better.',
        images: [],
        timestamp: '2025-01-15T09:15:00',
        likes: 3,
        dislikes: 2,
        sellerResponse: null,
        verified: false,
        helpful: 2
      }
    ];
    setReviews(mockReviews);
  }, [productId]);

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(review => review.rating === rating).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(review => review.rating === rating).length / reviews.length) * 100 
      : 0
  }));

  const handleRatingClick = (rating) => {
    setNewReview({ ...newReview, rating });
  };

  const submitReview = () => {
    if (newReview.rating === 0) {
      alert('Please select a rating');
      return;
    }

    if (!newReview.content.trim()) {
      alert('Please write a review');
      return;
    }

    const review = {
      id: `rev_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      rating: newReview.rating,
      title: newReview.title,
      content: newReview.content,
      images: newReview.images,
      timestamp: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      sellerResponse: null,
      verified: true, // TODO: Implement verification logic
      helpful: 0
    };

    setReviews([review, ...reviews]);
    setNewReview({ rating: 0, title: '', content: '', images: [] });
    setReviewMode('view');

    if (onReviewSubmitted) {
      onReviewSubmitted(review);
    }
  };

  const handleReviewAction = (reviewId, action, value = null) => {
    setReviews(reviews.map(review => {
      if (review.id === reviewId) {
        switch (action) {
          case 'like':
            return { ...review, likes: review.likes + 1 };
          case 'dislike':
            return { ...review, dislikes: review.dislikes + 1 };
          case 'helpful':
            return { ...review, helpful: review.helpful + 1 };
          case 'seller_response':
            return {
              ...review,
              sellerResponse: {
                content: value,
                timestamp: new Date().toISOString()
              }
            };
          default:
            return review;
        }
      }
      return review;
    }));
  };

  const filteredAndSortedReviews = reviews
    .filter(review => filterRating === 'all' || review.rating === parseInt(filterRating))
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.timestamp) - new Date(b.timestamp);
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        case 'helpful':
          return b.helpful - a.helpful;
        default: // 'newest'
          return new Date(b.timestamp) - new Date(a.timestamp);
      }
    });

  const StarRating = ({ rating, interactive = false, size = 'normal', onRatingClick }) => {
    const starSize = size === 'large' ? 'w-8 h-8' : size === 'small' ? 'w-4 h-4' : 'w-5 h-5';
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => interactive && onRatingClick && onRatingClick(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!interactive}
          >
            <FiStar
              className={`${starSize} ${
                star <= rating 
                  ? 'text-yellow-400 fill-current' 
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const ReviewCard = ({ review }) => {
    const [sellerResponseText, setSellerResponseText] = useState('');
    const [showResponseForm, setShowResponseForm] = useState(false);

    return (
      <div className="p-6 border rounded-xl mb-4 bg-white" style={{ borderColor: theme.colors.gray[200] }}>
        {/* Review Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <img 
              src={review.userAvatar} 
              alt={review.userName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-gray-800">{review.userName}</h4>
                {review.verified && (
                  <div className="flex items-center text-green-600 text-xs">
                    <FiCheck className="w-3 h-3 mr-1" />
                    Verified Purchase
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <StarRating rating={review.rating} size="small" />
                <span className="text-xs text-gray-500">
                  {new Date(review.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          <button className="text-gray-400 hover:text-gray-600">
            <FiFlag className="w-4 h-4" />
          </button>
        </div>

        {/* Review Content */}
        {review.title && (
          <h5 className="font-semibold text-gray-800 mb-2">{review.title}</h5>
        )}
        <p className="text-gray-700 mb-4 leading-relaxed">{review.content}</p>

        {/* Review Images */}
        {review.images.length > 0 && (
          <div className="flex space-x-2 mb-4">
            {review.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Review image ${index + 1}`}
                className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowImages(true)}
              />
            ))}
          </div>
        )}

        {/* Review Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleReviewAction(review.id, 'helpful')}
              className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <FiThumbsUp className="w-4 h-4" />
              <span className="text-sm">{review.helpful}</span>
            </button>
            
            <button
              onClick={() => handleReviewAction(review.id, 'like')}
              className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors"
            >
              <FiThumbsUp className="w-4 h-4" />
              <span className="text-sm">{review.likes}</span>
            </button>
            
            <button
              onClick={() => handleReviewAction(review.id, 'dislike')}
              className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
            >
              <FiThumbsDown className="w-4 h-4" />
              <span className="text-sm">{review.dislikes}</span>
            </button>
          </div>

          {userRole === 'seller' && !review.sellerResponse && (
            <button
              onClick={() => setShowResponseForm(!showResponseForm)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <FiMessageSquare className="w-4 h-4 mr-1 inline" />
              Respond
            </button>
          )}
        </div>

        {/* Seller Response Form */}
        {showResponseForm && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <textarea
              value={sellerResponseText}
              onChange={(e) => setSellerResponseText(e.target.value)}
              placeholder="Write a professional response to this review..."
              className="w-full p-3 border rounded-lg resize-none h-20 text-sm"
              style={{ borderColor: theme.colors.gray[300] }}
            />
            <div className="flex justify-end space-x-2 mt-2">
              <button
                onClick={() => setShowResponseForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (sellerResponseText.trim()) {
                    handleReviewAction(review.id, 'seller_response', sellerResponseText);
                    setSellerResponseText('');
                    setShowResponseForm(false);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Post Response
              </button>
            </div>
          </div>
        )}

        {/* Seller Response Display */}
        {review.sellerResponse && (
          <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
            <div className="flex items-center space-x-2 mb-2">
              <FiUser className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-blue-800 text-sm">Seller Response</span>
              <span className="text-xs text-blue-600">
                {new Date(review.sellerResponse.timestamp).toLocaleDateString()}
              </span>
            </div>
            <p className="text-blue-800 text-sm">{review.sellerResponse.content}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Reviews Overview */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Customer Reviews</h2>
          {userRole === 'buyer' && (
            <button
              onClick={() => setReviewMode(reviewMode === 'write' ? 'view' : 'write')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <FiEdit3 className="w-5 h-5 mr-2 inline" />
              {reviewMode === 'write' ? 'Cancel' : 'Write Review'}
            </button>
          )}
        </div>

        {/* Rating Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="text-center">
            <div className="text-6xl font-bold text-gray-800 mb-2">
              {averageRating.toFixed(1)}
            </div>
            <StarRating rating={Math.round(averageRating)} size="large" />
            <p className="text-gray-600 mt-2">{reviews.length} reviews</p>
          </div>

          <div className="space-y-2">
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 w-8">{rating}★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 bg-yellow-400 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-8">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Write Review Form */}
      {reviewMode === 'write' && (
        <div className="mb-8 p-6 border rounded-xl bg-gray-50" style={{ borderColor: theme.colors.gray[200] }}>
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Write Your Review</h3>
          
          <div className="space-y-4">
            {/* Star Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
              <StarRating 
                rating={newReview.rating} 
                interactive={true}
                size="large"
                onRatingClick={handleRatingClick}
              />
            </div>

            {/* Review Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Review Title</label>
              <input
                type="text"
                value={newReview.title}
                onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                placeholder="Summarize your experience in a few words"
                className="w-full p-3 border rounded-lg"
                style={{ borderColor: theme.colors.gray[300] }}
              />
            </div>

            {/* Review Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Review *</label>
              <textarea
                value={newReview.content}
                onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                placeholder="Share your experience with this item. Was it as described? How was the seller's communication?"
                className="w-full p-3 border rounded-lg resize-none h-32"
                style={{ borderColor: theme.colors.gray[300] }}
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Add Photos (Optional)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FiCamera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">Click to upload photos of the item</p>
                <input type="file" multiple accept="image/*" className="hidden" />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setReviewMode('view')}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Sorting */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="px-4 py-2 border rounded-lg"
            style={{ borderColor: theme.colors.gray[300] }}
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border rounded-lg"
            style={{ borderColor: theme.colors.gray[300] }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>

        <span className="text-gray-600 text-sm">
          {filteredAndSortedReviews.length} of {reviews.length} reviews
        </span>
      </div>

      {/* Reviews List */}
      <div>
        {filteredAndSortedReviews.length === 0 ? (
          <div className="text-center py-12">
            <FiStar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Reviews Yet</h3>
            <p className="text-gray-500">Be the first to share your experience with this item!</p>
          </div>
        ) : (
          filteredAndSortedReviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))
        )}
      </div>
    </div>
  );
};

export default RatingReviews;