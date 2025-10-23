/**
 * Individual Message Component
 * 
 * Renders a single message in the chat interface with proper styling
 * and user information.
 * 
 * @version 1.0.0
 */

import React from 'react';
import theme from '../../../../styles/designSystem';

const Message = ({ message, isOwn = false, showAvatar = true, timestamp }) => {
  return (
    <div className={`flex items-start space-x-3 mb-4 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {showAvatar && (
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
          style={{
            backgroundColor: isOwn ? theme.colors.primary[600] : theme.colors.gray[400],
            color: theme.colors.white
          }}
        >
          {isOwn ? 'You' : message.senderName?.[0] || 'U'}
        </div>
      )}
      
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-xs sm:max-w-md`}>
        {!isOwn && message.senderName && (
          <span 
            className="text-xs mb-1 font-medium"
            style={{ color: theme.colors.gray[600] }}
          >
            {message.senderName}
          </span>
        )}
        
        <div 
          className="px-4 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: isOwn ? theme.colors.primary[600] : theme.colors.gray[100],
            color: isOwn ? theme.colors.white : theme.colors.gray[800]
          }}
        >
          {message.content || message.text || message.message}
        </div>
        
        {timestamp && (
          <span 
            className="text-xs mt-1"
            style={{ color: theme.colors.gray[500] }}
          >
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
};

export default Message;