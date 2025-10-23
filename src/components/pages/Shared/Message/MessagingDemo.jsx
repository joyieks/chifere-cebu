/**
 * MessagingDemo Component
 * 
 * A standalone demo component that showcases the ChiFere messaging system
 * with sample data and all features working.
 * 
 * @version 1.0.0
 */

import React from 'react';
import ChatInterface from './ChatInterface';
import { MessagingProvider } from '../../../../contexts/MessagingContext';
import theme from '../../../../styles/designSystem';

const MessagingDemo = () => {
  return (
    <MessagingProvider>
      <div 
        style={{
          height: '100vh',
          backgroundColor: theme.colors.white,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        
        {/* Demo Header */}
        <div 
          style={{
            padding: theme.spacing[4],
            borderBottom: `1px solid ${theme.colors.gray[200]}`,
            backgroundColor: theme.colors.primary[50]
          }}
        >
          <div className="max-w-7xl mx-auto">
            <h1 
              style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.primary[800],
                marginBottom: theme.spacing[2]
              }}
            >
              🚀 ChiFere Messaging System Demo
            </h1>
            <p 
              style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.primary[700]
              }}
            >
              Complete messaging interface with real-time chat, barter offers, file sharing, and more!
            </p>
            
            {/* Features List */}
            <div 
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4"
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.primary[600]
              }}
            >
              <div>✅ Real-time messaging</div>
              <div>✅ Barter negotiations</div>
              <div>✅ File attachments</div>
              <div>✅ Emoji picker</div>
              <div>✅ Typing indicators</div>
              <div>✅ Read receipts</div>
              <div>✅ Mobile responsive</div>
              <div>✅ Design system</div>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1">
          <div className="max-w-7xl mx-auto h-full">
            <ChatInterface className="h-full" />
          </div>
        </div>
      </div>
    </MessagingProvider>
  );
};

export default MessagingDemo;
