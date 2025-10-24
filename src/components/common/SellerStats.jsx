/**
 * Seller Stats Component
 * 
 * Displays seller statistics including followers, reviews, and ratings.
 * 
 * Features:
 * - Follower count
 * - Review count
 * - Average rating with stars
 * - Rating breakdown
 * 
 * @version 1.0.0
 */

import React from 'react';
import { FiStar, FiUsers, FiMessageSquare, FiTrendingUp } from 'react-icons/fi';

const SellerStats = ({ stats, showDetails = false }) => {
  // Render star rating
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    return Array.from({ length: 5 }, (_, index) => {
      const starNumber = index + 1;
      let starClass = 'text-gray-300';
      
      if (starNumber <= fullStars) {
        starClass = 'text-yellow-400 fill-current';
      } else if (starNumber === fullStars + 1 && hasHalfStar) {
        starClass = 'text-yellow-400 fill-current opacity-50';
      }
      
      return (
        <FiStar
          key={index}
          className={`w-4 h-4 ${starClass}`}
        />
      );
    });
  };

  // Format number with commas
  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Seller Statistics</h3>
        {showDetails && (
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <FiTrendingUp className="w-4 h-4" />
            <span>Live Stats</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Followers */}
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            <FiUsers className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {formatNumber(stats.total_followers || 0)}
          </p>
          <p className="text-sm text-gray-600">Followers</p>
        </div>

        {/* Reviews */}
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            <FiMessageSquare className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">
            {formatNumber(stats.total_reviews || 0)}
          </p>
          <p className="text-sm text-gray-600">Reviews</p>
        </div>

        {/* Rating */}
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            <FiStar className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            {stats.average_rating ? stats.average_rating.toFixed(1) : '0.0'}
          </p>
          <p className="text-sm text-gray-600">Average Rating</p>
        </div>
      </div>

      {/* Rating Display */}
      {stats.average_rating > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-center space-x-2">
            <div className="flex items-center space-x-1">
              {renderStars(stats.average_rating)}
            </div>
            <span className="text-sm text-gray-600">
              ({stats.total_reviews} review{stats.total_reviews !== 1 ? 's' : ''})
            </span>
          </div>
        </div>
      )}

      {/* Additional Details */}
      {showDetails && stats.total_reviews > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total Rating Sum</p>
              <p className="font-semibold text-gray-900">
                {formatNumber(stats.total_rating_sum || 0)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Last Updated</p>
              <p className="font-semibold text-gray-900">
                {stats.updated_at ? new Date(stats.updated_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerStats;
