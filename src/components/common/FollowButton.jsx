/**
 * Follow Button Component
 * 
 * A reusable follow/unfollow button for sellers.
 * 
 * Features:
 * - Toggle follow status
 * - Loading states
 * - Success/error handling
 * - Different styles for different contexts
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { FiUserPlus, FiUserCheck, FiLoader } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast';
import followService from '../../services/followService';

const FollowButton = ({ 
  sellerId, 
  sellerName = 'Seller',
  variant = 'default', // 'default', 'compact', 'minimal'
  showCount = false,
  onFollowChange = null
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Check follow status on mount
  useEffect(() => {
    if (user && sellerId) {
      checkFollowStatus();
      if (showCount) {
        getFollowerCount();
      }
    }
  }, [user, sellerId, showCount]);

  // Check follow status
  const checkFollowStatus = async () => {
    if (!user || !sellerId) return;
    
    try {
      const result = await followService.isFollowing(user.id, sellerId);
      if (result.success) {
        setIsFollowing(result.isFollowing);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Get follower count
  const getFollowerCount = async () => {
    if (!sellerId) return;
    
    try {
      const result = await followService.getFollowerCount(sellerId);
      if (result.success) {
        setFollowerCount(result.count);
      }
    } catch (error) {
      console.error('Error getting follower count:', error);
    }
  };

  // Handle follow toggle
  const handleFollowToggle = async () => {
    if (!user) {
      showToast('Please log in to follow sellers', 'error');
      return;
    }

    if (user.id === sellerId) {
      showToast('You cannot follow yourself', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const result = await followService.toggleFollow(user.id, sellerId);
      
      if (result.success) {
        setIsFollowing(result.isFollowing);
        
        if (result.action === 'followed') {
          showToast(`You are now following ${sellerName}`, 'success');
          setFollowerCount(prev => prev + 1);
        } else {
          showToast(`You unfollowed ${sellerName}`, 'success');
          setFollowerCount(prev => Math.max(prev - 1, 0));
        }
        
        onFollowChange?.(result.isFollowing);
      } else {
        showToast(result.error || 'Failed to update follow status', 'error');
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
      showToast('Failed to update follow status', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if checking status or no user
  if (isCheckingStatus || !user) {
    return null;
  }

  // Don't render if user is the seller
  if (user.id === sellerId) {
    return null;
  }

  // Render different variants
  const renderButton = () => {
    const baseClasses = "flex items-center justify-center space-x-2 transition-all duration-200 font-medium";
    
    if (variant === 'compact') {
      return (
        <button
          onClick={handleFollowToggle}
          disabled={isLoading}
          className={`${baseClasses} px-3 py-2 rounded-lg text-sm ${
            isFollowing
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            <FiLoader className="w-4 h-4 animate-spin" />
          ) : isFollowing ? (
            <FiUserCheck className="w-4 h-4" />
          ) : (
            <FiUserPlus className="w-4 h-4" />
          )}
          <span>{isFollowing ? 'Following' : 'Follow'}</span>
        </button>
      );
    }

    if (variant === 'minimal') {
      return (
        <button
          onClick={handleFollowToggle}
          disabled={isLoading}
          className={`${baseClasses} p-2 rounded-full ${
            isFollowing
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            <FiLoader className="w-4 h-4 animate-spin" />
          ) : isFollowing ? (
            <FiUserCheck className="w-4 h-4" />
          ) : (
            <FiUserPlus className="w-4 h-4" />
          )}
        </button>
      );
    }

    // Default variant
    return (
      <button
        onClick={handleFollowToggle}
        disabled={isLoading}
        className={`${baseClasses} px-4 py-2 rounded-lg ${
          isFollowing
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? (
          <FiLoader className="w-4 h-4 animate-spin" />
        ) : isFollowing ? (
          <FiUserCheck className="w-4 h-4" />
        ) : (
          <FiUserPlus className="w-4 h-4" />
        )}
        <span>{isFollowing ? 'Following' : 'Follow'}</span>
        {showCount && followerCount > 0 && (
          <span className="text-xs opacity-75">
            ({followerCount})
          </span>
        )}
      </button>
    );
  };

  return renderButton();
};

export default FollowButton;
