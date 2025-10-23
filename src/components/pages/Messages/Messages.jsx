/**
 * Messages Page Component
 * 
 * Main messaging page for ChiFere that provides the complete messaging
 * experience within the buyer layout.
 * 
 * @version 1.0.0
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import BuyerLayout from '../Buyer/Buyer_Menu/Buyer_Layout/Buyer_layout';
import ChatInterface from '../Shared/Message/ChatInterface';
import { MessagingProvider } from '../../../contexts/MessagingContext';
import theme from '../../../styles/designSystem';

const Messages = () => {
  const { conversationId } = useParams();
  return (
    <MessagingProvider>
      <BuyerLayout>
        <div 
          style={{
            height: 'calc(100vh - 64px)', // Subtract navigation height
            backgroundColor: theme.colors.white,
            overflow: 'hidden'
          }}
        >
          
          {/* Page Header */}
          <div 
            style={{
              padding: `${theme.spacing[6]} ${theme.spacing[6]} ${theme.spacing[4]}`,
              borderBottom: `1px solid ${theme.colors.gray[200]}`,
              backgroundColor: theme.colors.white
            }}
          >
            <div className="max-w-7xl mx-auto">
              <h1 
                style={{
                  fontSize: theme.typography.fontSize['3xl'],
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.gray[900],
                  marginBottom: theme.spacing[2]
                }}
              >
                Messages
              </h1>
              <p 
                style={{
                  fontSize: theme.typography.fontSize.lg,
                  color: theme.colors.gray[600]
                }}
              >
                Chat with buyers and sellers, negotiate deals, and manage your conversations
              </p>
            </div>
          </div>

          {/* Chat Interface */}
          <div 
            style={{
              height: 'calc(100% - 120px)', // Subtract header height
              backgroundColor: theme.colors.white
            }}
          >
            <div className="max-w-7xl mx-auto h-full">
              <ChatInterface 
                initialConversationId={conversationId}
                className="h-full" 
              />
            </div>
          </div>
        </div>
      </BuyerLayout>
    </MessagingProvider>
  );
};

export default Messages;
