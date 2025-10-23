/**
 * ConversationList Component
 * 
 * Displays a list of user conversations with last message previews,
 * unread counts, and online status indicators.
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { BsSearch, BsThreeDotsVertical } from 'react-icons/bs';
import { IoMdCheckmarkCircle } from 'react-icons/io';
import { formatDistanceToNow } from 'date-fns';
import theme from '../../../../styles/designSystem';
import { useMessaging } from '../../../../contexts/MessagingContext';
import { useAuth } from '../../../../contexts/AuthContext';

const ConversationList = ({ 
  onConversationSelect, 
  selectedConversationId = null,
  className = '' 
}) => {
  const { user } = useAuth();
  const currentUserId = String(user?.id || '');
  const { 
    conversations, 
    error, 
    markMessagesAsRead 
  } = useMessaging();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // Conversations are already loaded by MessagingContext
  // No need to reload them here

  // Filter conversations based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conversation => {
        const otherParticipant = conversation.participants.find(p => String(p) !== currentUserId);
        const participantInfo = conversation.participantInfo[otherParticipant];
        const participantName = participantInfo?.name || 'Unknown User';
        const lastMessageContent = conversation.lastMessage?.content || '';
        
        return (
          participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lastMessageContent.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
      setFilteredConversations(filtered);
    }
  }, [searchTerm, conversations, user]);

  const handleConversationClick = async (conversation) => {
    // Mark messages as read
    if (conversation.unreadCount[user?.id] > 0) {
      await markMessagesAsRead(conversation.id);
    }
    
    onConversationSelect(conversation);
  };

  const getLastMessagePreview = (lastMessage) => {
    if (!lastMessage) return 'No messages yet';
    
    switch (lastMessage.type) {
      case 'text':
        return lastMessage.content;
      case 'image':
        return '📷 Photo';
      case 'offer':
        return '🤝 Offer made';
      case 'system':
        return lastMessage.content;
      default:
        return lastMessage.content;
    }
  };

  const getMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const messageTime = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(messageTime, { addSuffix: false });
  };

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center p-6 ${className}`}
        style={{
          backgroundColor: theme.colors.error[50],
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.error[200]}`
        }}
      >
        <div style={{ color: theme.colors.error[600] }}>
          Failed to load conversations: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      
      {/* Header */}
      <div 
        style={{
          padding: theme.spacing[4],
          borderBottom: `1px solid ${theme.colors.gray[200]}`,
          backgroundColor: theme.colors.white
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 
            style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.gray[900]
            }}
          >
            Messages
          </h2>
          
          <button
            style={{
              padding: theme.spacing[2],
              borderRadius: theme.borderRadius.full,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: theme.colors.gray[500],
              transition: theme.animations.transition.colors
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = theme.colors.gray[100];
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            <BsThreeDotsVertical size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div 
          style={{
            position: 'relative',
            marginBottom: theme.spacing[4]
          }}
        >
          <BsSearch 
            style={{
              position: 'absolute',
              left: theme.spacing[3],
              top: '50%',
              transform: 'translateY(-50%)',
              color: theme.colors.gray[400],
              fontSize: theme.typography.fontSize.base
            }}
          />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: `${theme.spacing[3]} ${theme.spacing[3]} ${theme.spacing[3]} ${theme.spacing[10]}`,
              fontSize: theme.typography.fontSize.base,
              borderRadius: theme.borderRadius.full,
              border: `1px solid ${theme.colors.gray[300]}`,
              backgroundColor: theme.colors.gray[50],
              color: theme.colors.gray[800],
              outline: 'none',
              transition: theme.animations.transition.all
            }}
            onFocus={(e) => {
              e.target.style.borderColor = theme.colors.primary[500];
              e.target.style.backgroundColor = theme.colors.white;
              e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primary[100]}`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = theme.colors.gray[300];
              e.target.style.backgroundColor = theme.colors.gray[50];
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {/* Conversations List */}
      <div 
        className="flex-1 overflow-y-auto"
        style={{
          backgroundColor: theme.colors.white
        }}
      >
        {loadingList ? (
          <div className="flex items-center justify-center p-8">
            <div 
              style={{
                width: '32px',
                height: '32px',
                border: `3px solid ${theme.colors.gray[200]}`,
                borderTop: `3px solid ${theme.colors.primary[500]}`,
                borderRadius: theme.borderRadius.full,
                animation: 'spin 1s linear infinite'
              }}
            />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div 
            className="flex flex-col items-center justify-center p-8"
            style={{ color: theme.colors.gray[500] }}
          >
            <div 
              style={{
                fontSize: theme.typography.fontSize['4xl'],
                marginBottom: theme.spacing[3]
              }}
            >
              💬
            </div>
            <div 
              style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.medium,
                marginBottom: theme.spacing[2]
              }}
            >
              No conversations yet
            </div>
            <div 
              style={{
                fontSize: theme.typography.fontSize.sm,
                textAlign: 'center',
                color: theme.colors.gray[400]
              }}
            >
              Start a conversation by messaging a seller or buyer
            </div>
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const otherParticipant = conversation.participants.find(p => String(p) !== currentUserId);
            const participantInfo = conversation.participantInfo?.[otherParticipant] || {};
            const participantName = participantInfo.name || 'Unknown User';
            const participantAvatar = participantInfo.avatar;
            const unreadCount = conversation.unreadCount[currentUserId] || 0;
            const isSelected = selectedConversationId === conversation.id;

            return (
              <div
                key={conversation.id}
                onClick={() => handleConversationClick(conversation)}
                style={{
                  padding: theme.spacing[4],
                  borderBottom: `1px solid ${theme.colors.gray[100]}`,
                  backgroundColor: isSelected ? theme.colors.primary[50] : 'transparent',
                  cursor: 'pointer',
                  transition: theme.animations.transition.colors
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.target.style.backgroundColor = theme.colors.gray[50];
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div className="flex items-center space-x-3">
                  
                  {/* Avatar */}
                  <div 
                    style={{
                      position: 'relative',
                      flexShrink: 0
                    }}
                  >
                    <div 
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: theme.borderRadius.full,
                        backgroundColor: participantAvatar ? 'transparent' : theme.colors.primary[500],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: theme.typography.fontSize.lg,
                        fontWeight: theme.typography.fontWeight.semibold,
                        color: theme.colors.white,
                        overflow: 'hidden'
                      }}
                    >
                      {participantAvatar ? (
                        <img 
                          src={participantAvatar} 
                          alt={participantName}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        participantName.charAt(0).toUpperCase()
                      )}
                    </div>
                    
                    {/* Online indicator (mock) */}
                    <div 
                      style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        width: '12px',
                        height: '12px',
                        backgroundColor: theme.colors.success[500],
                        borderRadius: theme.borderRadius.full,
                        border: `2px solid ${theme.colors.white}`
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div 
                        style={{
                          fontSize: theme.typography.fontSize.base,
                          fontWeight: unreadCount > 0 ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium,
                          color: theme.colors.gray[900],
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {participantName}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {conversation.lastMessage && (
                          <span 
                            style={{
                              fontSize: theme.typography.fontSize.xs,
                              color: theme.colors.gray[500]
                            }}
                          >
                            {getMessageTime(conversation.lastMessage.createdAt)}
                          </span>
                        )}
                        
                        {unreadCount > 0 && (
                          <div 
                            style={{
                              minWidth: '20px',
                              height: '20px',
                              backgroundColor: theme.colors.primary[500],
                              borderRadius: theme.borderRadius.full,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: theme.typography.fontSize.xs,
                              fontWeight: theme.typography.fontWeight.semibold,
                              color: theme.colors.white,
                              padding: `0 ${theme.spacing[1]}`
                            }}
                          >
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div 
                        style={{
                          fontSize: theme.typography.fontSize.sm,
                          color: unreadCount > 0 ? theme.colors.gray[700] : theme.colors.gray[500],
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '200px'
                        }}
                      >
                        {getLastMessagePreview(conversation.lastMessage)}
                      </div>
                      
                      {conversation.lastMessage?.senderId === user?.id && (
                        <IoMdCheckmarkCircle 
                          style={{
                            color: theme.colors.success[500],
                            fontSize: theme.typography.fontSize.sm,
                            flexShrink: 0,
                            marginLeft: theme.spacing[2]
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationList;
