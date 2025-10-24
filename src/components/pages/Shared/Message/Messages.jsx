import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useMessaging } from '../../../../contexts/MessagingContext';
import MessagesPage from './MessagesPage';
import ChatInterface from './ChatInterface';
import messagingService from '../../../../services/messagingService';

const Messages = ({ 
  initialConversationId = null, 
  sellerId = null, 
  buyerId = null, 
  productId = null, 
  userRole = 'buyer' 
}) => {
  const { user } = useAuth();
  const { createConversation, fetchParticipantDetails } = useMessaging();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  // Create conversation if sellerId/buyerId provided
  useEffect(() => {
    const createNewConversation = async () => {
      if (!user?.id || isCreatingConversation) return;
      
      const targetUserId = userRole === 'buyer' ? sellerId : buyerId;
      if (!targetUserId) return;

      setIsCreatingConversation(true);
      try {
        const result = await messagingService.createConversation(
          userRole === 'buyer' ? user.id : targetUserId,
          userRole === 'buyer' ? targetUserId : user.id,
          productId
        );
        
        if (result.success) {
          // Find the created conversation
          const conversations = await messagingService.getUserConversations(user.id);
          if (conversations.success) {
            const newConversation = conversations.data.find(conv => conv.id === result.conversationId);
            if (newConversation) {
              // Ensure participant details are fetched for the new conversation
              if (fetchParticipantDetails && newConversation.participants) {
                await fetchParticipantDetails(newConversation.participants);
              }
              
              setSelectedConversation(newConversation);
              setShowMobileChat(true);
            }
          }
        }
      } catch (error) {
        console.error('Error creating conversation:', error);
      } finally {
        setIsCreatingConversation(false);
      }
    };

    createNewConversation();
  }, [user?.id, sellerId, buyerId, productId, userRole, isCreatingConversation]);

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    setShowMobileChat(true);
  };

  const handleBackToConversations = () => {
    setShowMobileChat(false);
  };

  return (
    <div className="h-screen bg-gray-50">
      <div className="flex h-full">
        {/* Desktop Layout */}
        <div className="hidden lg:flex flex-1">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-gray-200">
            <MessagesPage onConversationSelect={handleConversationSelect} />
          </div>
          
          {/* Chat Interface */}
          <div className="flex-1">
            <ChatInterface conversation={selectedConversation} />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden flex-1">
          {!showMobileChat ? (
            <MessagesPage onConversationSelect={handleConversationSelect} />
          ) : (
            <ChatInterface 
              conversation={selectedConversation} 
              onBack={handleBackToConversations}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
