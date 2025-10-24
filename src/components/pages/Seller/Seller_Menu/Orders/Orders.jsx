import React from 'react';
import SellerLayout from '../Seller_Layout/SellerLayout';
import OrderManagement from '../../OrderManagement/OrderManagement';

const Orders = () => {
  return (
    <SellerLayout>
      <OrderManagement />
    </SellerLayout>
  );
};

export default Orders;