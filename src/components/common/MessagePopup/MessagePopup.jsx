import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSend, FiUser, FiMessageCircle } from 'react-icons/fi';
import { useMessaging } from '../../../contexts/MessagingContext';
import { useAuth } from '../../../contexts/AuthContext';

const MessagePopup = ({ 
  isOpen, 
  onClose, 
  recipientId, 
  recipientName, 
  recipientType = 'seller', // 'seller' or 'buyer'
  productId = null,
  productName = null
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const { createConversation, sendMessage } = useMessaging();
  const { user } = useAuth();

  // Debug logging
  console.log('🔄 [MessagePopup] Component rendered with props:', {
    isOpen,
    recipientId,
    recipientName,
    recipientType,
    productId,
    productName,
    user: user?.id
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);
    setError(null);
    setSuccess(false);

    try {
      // Ensure IDs are strings
      const buyerId = recipientType === 'seller' ? String(user.id) : String(recipientId);
      const sellerId = recipientType === 'seller' ? String(recipientId) : String(user.id);

      console.log('🔄 [MessagePopup] Sending message:', {
        recipientId: String(recipientId),
        recipientName,
        recipientType,
        productId,
        productName,
        message: message.trim(),
        user_id: String(user.id),
        buyerId,
        sellerId
      });

      // Create or get conversation
      const conversationResult = await createConversation(
        [buyerId, sellerId], // participants array
        productId, // itemId
        message.trim() // initialMessage
      );

      if (conversationResult.success) {
        console.log('🔄 [MessagePopup] Conversation created/found:', conversationResult);
        
        // Get the conversation ID from the result
        const conversationId = conversationResult.conversationId || conversationResult.data?.id;
        
        if (!conversationId) {
          console.error('🔄 [MessagePopup] No conversation ID in result:', conversationResult);
          setError('Failed to get conversation ID');
          return;
        }
        
        // Send the message
        const messageResult = await sendMessage(
          conversationId,
          message.trim(),
          'text'
        );

        if (messageResult.success) {
          console.log('🔄 [MessagePopup] Message sent successfully');
          setSuccess(true);
          setMessage('');
          
          // Close popup after a short delay
          setTimeout(() => {
            onClose();
            setSuccess(false);
          }, 1500);
        } else {
          console.error('🔄 [MessagePopup] Failed to send message:', messageResult.error);
          setError(messageResult.error || 'Failed to send message');
        }
      } else {
        console.error('🔄 [MessagePopup] Failed to create conversation:', conversationResult.error);
        setError(conversationResult.error || 'Failed to create conversation');
      }
    } catch (error) {
      console.error('🔄 [MessagePopup] Error sending message:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      setMessage('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backdropFilter: 'blur(8px)' }}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <FiMessageCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Send Message
                </h3>
                <p className="text-sm text-gray-500">
                  to {recipientName}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSending}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <FiX className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiSend className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Message Sent!
                </h4>
                <p className="text-gray-500">
                  Your message has been sent to {recipientName}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Product Info (if applicable) */}
                {productName && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">About:</span> {productName}
                    </p>
                  </div>
                )}

                {/* Message Input */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Message
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Type your message to ${recipientName}...`}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                    disabled={isSending}
                    required
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSending}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!message.trim() || isSending}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {isSending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <FiSend className="h-4 w-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MessagePopup;
