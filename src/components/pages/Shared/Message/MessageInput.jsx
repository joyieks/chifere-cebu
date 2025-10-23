/**
 * MessageInput Component
 * 
 * Input component for composing and sending messages with support for
 * text, file attachments, emojis, and special barter offers.
 * 
 * @version 1.0.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { 
  BsSend, 
  BsPaperclip, 
  BsEmojiSmile, 
  BsX,
  BsImage,
  BsFileEarmark,
  BsCurrencyDollar
} from 'react-icons/bs';
import theme from '../../../../styles/designSystem';
import { useMessaging } from '../../../../contexts/MessagingContext';

const MessageInput = ({ 
  conversationId, 
  placeholder = "Type a message...",
  onSend,
  disabled = false,
  className = '' 
}) => {
  const { sendMessage, setTypingStatus } = useMessaging();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Common emojis for quick access
  const quickEmojis = ['😊', '👍', '❤️', '😂', '😭', '🔥', '💯', '🙌', '👏', '🤝'];

  const handleInputChange = useCallback((e) => {
    setMessage(e.target.value);
    
    // Handle typing indicators
    setTypingStatus(conversationId, true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(conversationId, false);
    }, 1000);
  }, [conversationId, setTypingStatus]);

  const handleSendMessage = useCallback(async () => {
    if ((!message.trim() && attachments.length === 0) || isLoading || disabled) return;

    setIsLoading(true);
    
    try {
      // Send text message
      if (message.trim()) {
        const result = await sendMessage(conversationId, message.trim(), 'text');
        if (result.success) {
          setMessage('');
          setTypingStatus(conversationId, false);
          onSend && onSend(result);
        }
      }

      // Handle attachments (mock implementation)
      for (const attachment of attachments) {
        if (attachment.type === 'image') {
          await sendMessage(conversationId, attachment.url, 'image', {
            imageUrl: attachment.url,
            caption: attachment.caption
          });
        } else {
          await sendMessage(conversationId, attachment.name, 'file', {
            fileUrl: attachment.url,
            fileName: attachment.name,
            fileSize: attachment.size
          });
        }
      }

      setAttachments([]);
      
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  }, [message, attachments, conversationId, sendMessage, setTypingStatus, onSend, isLoading, disabled]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const attachment = {
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        url: URL.createObjectURL(file), // In real app, upload to storage first
        file
      };
      
      setAttachments(prev => [...prev, attachment]);
    });
    
    setShowAttachmentMenu(false);
    e.target.value = ''; // Reset file input
  };

  const removeAttachment = (attachmentId) => {
    setAttachments(prev => {
      const newAttachments = prev.filter(att => att.id !== attachmentId);
      // Clean up object URLs
      const removed = prev.find(att => att.id === attachmentId);
      if (removed?.url) {
        URL.revokeObjectURL(removed.url);
      }
      return newAttachments;
    });
  };

  const insertEmoji = (emoji) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);
      
      // Set cursor position after emoji
      setTimeout(() => {
        input.setSelectionRange(start + emoji.length, start + emoji.length);
        input.focus();
      }, 0);
    }
    setShowEmojiPicker(false);
  };

  return (
    <div className={`${className}`}>
      
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div 
          style={{
            padding: theme.spacing[3],
            borderTop: `1px solid ${theme.colors.gray[200]}`,
            backgroundColor: theme.colors.gray[50]
          }}
        >
          <div className="flex flex-wrap gap-2">
            {attachments.map(attachment => (
              <div
                key={attachment.id}
                style={{
                  position: 'relative',
                  padding: theme.spacing[2],
                  backgroundColor: theme.colors.white,
                  borderRadius: theme.borderRadius.lg,
                  border: `1px solid ${theme.colors.gray[200]}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing[2]
                }}
              >
                {attachment.type === 'image' ? (
                  <img 
                    src={attachment.url} 
                    alt={attachment.name}
                    style={{
                      width: '40px',
                      height: '40px',
                      objectFit: 'cover',
                      borderRadius: theme.borderRadius.md
                    }}
                  />
                ) : (
                  <BsFileEarmark 
                    style={{
                      fontSize: '24px',
                      color: theme.colors.primary[500]
                    }}
                  />
                )}
                
                <div>
                  <div 
                    style={{
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: theme.colors.gray[900]
                    }}
                  >
                    {attachment.name}
                  </div>
                  <div 
                    style={{
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.gray[500]
                    }}
                  >
                    {(attachment.size / 1024).toFixed(1)} KB
                  </div>
                </div>

                <button
                  onClick={() => removeAttachment(attachment.id)}
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    width: '20px',
                    height: '20px',
                    borderRadius: theme.borderRadius.full,
                    backgroundColor: theme.colors.error[500],
                    color: theme.colors.white,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px'
                  }}
                >
                  <BsX />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div 
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            right: 0,
            backgroundColor: theme.colors.white,
            border: `1px solid ${theme.colors.gray[200]}`,
            borderRadius: theme.borderRadius.lg,
            boxShadow: theme.shadows.lg,
            padding: theme.spacing[3],
            marginBottom: theme.spacing[2],
            zIndex: theme.zIndex.dropdown
          }}
        >
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: theme.spacing[2]
            }}
          >
            {quickEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => insertEmoji(emoji)}
                style={{
                  padding: theme.spacing[2],
                  border: 'none',
                  backgroundColor: 'transparent',
                  borderRadius: theme.borderRadius.md,
                  cursor: 'pointer',
                  fontSize: theme.typography.fontSize.lg,
                  transition: theme.animations.transition.colors
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = theme.colors.gray[100];
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attachment Menu */}
      {showAttachmentMenu && (
        <div 
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            backgroundColor: theme.colors.white,
            border: `1px solid ${theme.colors.gray[200]}`,
            borderRadius: theme.borderRadius.lg,
            boxShadow: theme.shadows.lg,
            padding: theme.spacing[2],
            marginBottom: theme.spacing[2],
            zIndex: theme.zIndex.dropdown,
            minWidth: '200px'
          }}
        >
          <button
            onClick={() => {
              fileInputRef.current?.click();
              setShowAttachmentMenu(false);
            }}
            style={{
              width: '100%',
              padding: theme.spacing[3],
              border: 'none',
              backgroundColor: 'transparent',
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing[3],
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.gray[700],
              transition: theme.animations.transition.colors
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = theme.colors.gray[50];
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            <BsImage style={{ color: theme.colors.primary[500] }} />
            Photo or Video
          </button>
          
          <button
            onClick={() => {
              // Handle offer creation
              setShowOfferModal(true);
              setShowAttachmentMenu(false);
            }}
            style={{
              width: '100%',
              padding: theme.spacing[3],
              border: 'none',
              backgroundColor: 'transparent',
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing[3],
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.gray[700],
              transition: theme.animations.transition.colors
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = theme.colors.gray[50];
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            <BsCurrencyDollar style={{ color: theme.colors.success[500] }} />
            Make Offer
          </button>
        </div>
      )}

      {/* Main Input Area */}
      <div 
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          gap: theme.spacing[2],
          padding: theme.spacing[4],
          backgroundColor: theme.colors.white,
          borderTop: `1px solid ${theme.colors.gray[200]}`
        }}
      >
        
        {/* Attachment Button */}
        <button
          onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
          disabled={disabled}
          style={{
            padding: theme.spacing[2],
            border: 'none',
            backgroundColor: 'transparent',
            borderRadius: theme.borderRadius.full,
            cursor: disabled ? 'not-allowed' : 'pointer',
            color: disabled ? theme.colors.gray[400] : theme.colors.gray[500],
            transition: theme.animations.transition.colors,
            opacity: disabled ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.target.style.backgroundColor = theme.colors.gray[100];
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
          }}
        >
          <BsPaperclip size={20} />
        </button>

        {/* Text Input */}
        <div 
          className="flex-1"
          style={{
            position: 'relative'
          }}
        >
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            style={{
              width: '100%',
              minHeight: '40px',
              maxHeight: '120px',
              padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
              paddingRight: theme.spacing[12], // Space for emoji button
              fontSize: theme.typography.fontSize.base,
              borderRadius: theme.borderRadius.full,
              border: `1px solid ${theme.colors.gray[300]}`,
              backgroundColor: disabled ? theme.colors.gray[100] : theme.colors.gray[50],
              color: theme.colors.gray[800],
              outline: 'none',
              resize: 'none',
              transition: theme.animations.transition.all,
              opacity: disabled ? 0.5 : 1,
              fontFamily: theme.typography.fontFamily.sans.join(', '),
              lineHeight: theme.typography.lineHeight.normal
            }}
            onFocus={(e) => {
              if (!disabled) {
                e.target.style.borderColor = theme.colors.primary[500];
                e.target.style.backgroundColor = theme.colors.white;
                e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primary[100]}`;
              }
            }}
            onBlur={(e) => {
              e.target.style.borderColor = theme.colors.gray[300];
              e.target.style.backgroundColor = disabled ? theme.colors.gray[100] : theme.colors.gray[50];
              e.target.style.boxShadow = 'none';
            }}
          />

          {/* Emoji Button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
            style={{
              position: 'absolute',
              right: theme.spacing[3],
              top: '50%',
              transform: 'translateY(-50%)',
              padding: theme.spacing[1],
              border: 'none',
              backgroundColor: 'transparent',
              borderRadius: theme.borderRadius.full,
              cursor: disabled ? 'not-allowed' : 'pointer',
              color: disabled ? theme.colors.gray[400] : theme.colors.gray[500],
              transition: theme.animations.transition.colors,
              opacity: disabled ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.target.style.backgroundColor = theme.colors.gray[100];
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            <BsEmojiSmile size={16} />
          </button>
        </div>

        {/* Send Button */}
        <button
          onClick={handleSendMessage}
          disabled={disabled || isLoading || (!message.trim() && attachments.length === 0)}
          style={{
            padding: theme.spacing[3],
            borderRadius: theme.borderRadius.full,
            border: 'none',
            backgroundColor: theme.colors.primary[500],
            color: theme.colors.white,
            cursor: (disabled || isLoading || (!message.trim() && attachments.length === 0)) ? 'not-allowed' : 'pointer',
            transition: theme.animations.transition.all,
            opacity: (disabled || isLoading || (!message.trim() && attachments.length === 0)) ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            if (!disabled && !isLoading && (message.trim() || attachments.length > 0)) {
              e.target.style.backgroundColor = theme.colors.primary[600];
              e.target.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = theme.colors.primary[500];
            e.target.style.transform = 'scale(1)';
          }}
        >
          {isLoading ? (
            <div 
              style={{
                width: '16px',
                height: '16px',
                border: `2px solid ${theme.colors.white}`,
                borderTop: '2px solid transparent',
                borderRadius: theme.borderRadius.full,
                animation: 'spin 1s linear infinite'
              }}
            />
          ) : (
            <BsSend size={16} />
          )}
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

export default MessageInput;

