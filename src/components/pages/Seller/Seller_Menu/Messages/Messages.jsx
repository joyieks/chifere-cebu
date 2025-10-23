import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import SellerLayout from '../Seller_Layout/SellerLayout';
import Messages from '../../../Shared/Message/Messages';
import { MessagingProvider } from '../../../../../contexts/MessagingContext';

const SellerMessages = () => {
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  
  // Get conversation and product from URL params
  const buyerId = searchParams.get('conversation');
  const productId = searchParams.get('product');
  
  return (
    <MessagingProvider>
      <SellerLayout>
        <div className="h-screen bg-gray-50">
          <Messages 
            initialConversationId={conversationId}
            buyerId={buyerId}
            productId={productId}
            userRole="seller"
          />
        </div>
      </SellerLayout>
    </MessagingProvider>
  );
};

export default SellerMessages;