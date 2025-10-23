import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useMessaging } from '../../../../contexts/MessagingContext';
import { FiArrowLeft, FiSend, FiMoreVertical, FiPhone, FiVideo } from 'react-icons/fi';
import OfferMessage from './OfferMessage';

const ChatInterface = ({ conversation, onBack }) => {
  const { user } = useAuth();
  const { sendMessage, messages, markMessagesAsRead, getConversationMessages } = useMessaging();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const conversationMessages = messages[conversation?.id] || [];
  
  // Debug: Log messages when they change
  useEffect(() => {
    console.log('🔄 [ChatInterface] Messages for conversation', conversation?.id, ':', conversationMessages);
  }, [conversation?.id, conversationMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  // Load messages and mark as read when conversation is opened
  useEffect(() => {
    if (conversation?.id && user?.id) {
      // Load messages for this conversation
      getConversationMessages(conversation.id);
      // Mark messages as read
      markMessagesAsRead(conversation.id, user.id);
    }
  }, [conversation?.id, user?.id, getConversationMessages, markMessagesAsRead]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || isSending || !conversation?.id) return;

    setIsSending(true);
    try {
      const result = await sendMessage(
        conversation.id,
        newMessage.trim(),
        'text'
      );
      
      if (result.success) {
        setNewMessage('');
      } else {
        console.error('Failed to send message:', result.error);
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getOtherParticipant = () => {
    if (!conversation?.participants || !Array.isArray(conversation.participants)) return { name: 'Unknown User', avatar: null };
    
    const otherId = conversation.participants.find(id => id !== user?.id);
    return conversation.participantInfo?.[otherId] || { name: 'Unknown User', avatar: null };
  };

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">💬</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
          <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
        </div>
      </div>
    );
  }

  const otherParticipant = getOtherParticipant();
    
    return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
            {onBack && (
          <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full lg:hidden"
              >
                <FiArrowLeft className="h-5 w-5" />
          </button>
            )}
            
            {/* Avatar */}
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
              {otherParticipant?.avatar ? (
                <img 
                  src={otherParticipant.avatar} 
                  alt={otherParticipant.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-gray-600 font-medium">
                  {otherParticipant?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
          </div>

          <div>
              <h3 className="text-sm font-medium text-gray-900">
                {otherParticipant?.name || 'Unknown User'}
              </h3>
              <p className="text-xs text-gray-500">Online</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <FiPhone className="h-5 w-5 text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <FiVideo className="h-5 w-5 text-gray-500" />
          </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <FiMoreVertical className="h-5 w-5 text-gray-500" />
          </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversationMessages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">💬</div>
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          conversationMessages.map((message) => {
            // Use the normalized senderId field
            const senderId = message.senderId;
            const isOwnMessage = senderId === user?.id;
            
            // Determine if sender is buyer or seller based on conversation participants
            // Check if the sender is the buyer_id or seller_id in the conversation
            const isBuyerMessage = isOwnMessage && conversation?.buyer_id === user?.id;
            const isSellerMessage = isOwnMessage && conversation?.seller_id === user?.id;
            
            // For the other participant's messages, determine their role
            const otherParticipantIsBuyer = !isOwnMessage && conversation?.buyer_id === senderId;
            const otherParticipantIsSeller = !isOwnMessage && conversation?.seller_id === senderId;
            
            // Debug logging for role detection
            console.log('🔄 [ChatInterface] Message role detection:', {
              messageId: message.id,
              senderId: senderId,
              userId: user?.id,
              isOwnMessage,
              conversationBuyerId: conversation?.buyer_id,
              conversationSellerId: conversation?.seller_id,
              isBuyerMessage,
              isSellerMessage,
              otherParticipantIsBuyer,
              otherParticipantIsSeller,
              messageContent: message.content?.substring(0, 50) + '...'
            });
            
            // Check if this is an offer message
            const isOfferMessage = message.type === 'offer' || 
              (message.content && message.content.includes('**MAKE OFFER REQUEST**'));

            // Render offer message with special component
            if (isOfferMessage) {
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
                >
                  <OfferMessage 
                    message={message} 
                    isOwnMessage={isOwnMessage}
                  />
                </div>
              );
            }

            // Render regular message
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    (isBuyerMessage || otherParticipantIsBuyer)
                      ? 'bg-blue-500 text-white' // Buyer messages in blue
                      : (isSellerMessage || otherParticipantIsSeller)
                      ? 'bg-white text-gray-900 border border-gray-200 shadow-sm' // Seller messages in white with border
                      : 'bg-gray-100 text-gray-900' // Fallback for unknown roles
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    (isBuyerMessage || otherParticipantIsBuyer) 
                      ? 'text-blue-100' 
                      : 'text-gray-500'
                  }`}>
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <FiSend className="h-4 w-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;