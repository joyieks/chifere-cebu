/**
 * Buyer Messages Component
 * 
 * Dedicated messaging interface for buyers that uses the shared ChatInterface
 * with buyer-specific layout and styling.
 * 
 * @version 1.0.0 - Buyer-specific messaging implementation
 */

import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import BuyerLayout from '../Buyer_Layout/Buyer_layout';
import Messages from '../../../Shared/Message/Messages';
import { MessagingProvider } from '../../../../../contexts/MessagingContext';

const BuyerMessages = () => {
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  
  // Get conversation and product from URL params
  const sellerId = searchParams.get('conversation');
  const productId = searchParams.get('product');
  
  return (
    <MessagingProvider>
      <BuyerLayout>
        <div className="h-screen bg-gray-50">
          <Messages 
            initialConversationId={conversationId}
            sellerId={sellerId}
            productId={productId}
            userRole="buyer"
          />
        </div>
      </BuyerLayout>
    </MessagingProvider>
  );
};

export default BuyerMessages;