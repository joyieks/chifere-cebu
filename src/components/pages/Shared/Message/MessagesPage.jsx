import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useMessaging } from '../../../../contexts/MessagingContext';
import { FiMessageCircle, FiSearch, FiMoreVertical, FiArrowLeft } from 'react-icons/fi';
import { BsThreeDotsVertical } from 'react-icons/bs';

const MessagesPage = ({ onConversationSelect }) => {
  const { user } = useAuth();
  const { conversations, isLoading, error } = useMessaging();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter conversations based on search term
  const filteredConversations = (conversations || []).filter(conv => {
    if (!searchTerm) return true;
    
    // Search in participant names or last message content
    const participantNames = Object.values(conv.participantInfo || {}).map(p => p.name).join(' ');
    const lastMessageContent = conv.lastMessage?.content || '';
    
    return participantNames.toLowerCase().includes(searchTerm.toLowerCase()) ||
           lastMessageContent.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getOtherParticipant = (conversation) => {
    if (!conversation.participants || !Array.isArray(conversation.participants)) return { name: 'Unknown User', avatar: null };
    
    const otherId = conversation.participants.find(id => id !== user?.id);
    return conversation.participantInfo?.[otherId] || { name: 'Unknown User', avatar: null };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading messages: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FiMessageCircle className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <FiSearch className="h-5 w-5 text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <BsThreeDotsVertical className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="divide-y divide-gray-200">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12">
            <FiMessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
            <p className="text-gray-500">
              {searchTerm ? 'No conversations match your search.' : 'Start a conversation by messaging a seller about their product.'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const otherParticipant = getOtherParticipant(conversation);
            const unreadCount = conversation.unreadCount?.[user?.id] || 0;
            
            return (
              <div
                key={conversation.id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onConversationSelect?.(conversation)}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                      {otherParticipant.avatar ? (
                        <img
                          src={otherParticipant.avatar}
                          alt={otherParticipant.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-medium">
                          {otherParticipant.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </div>
                    )}
                  </div>

                  {/* Conversation Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {otherParticipant.name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.lastMessage?.createdAt || conversation.updatedAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {conversation.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {unreadCount > 0 && (
                    <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
