# Checkout System Setup Guide

## 🚀 Quick Start

Follow these steps to implement the complete checkout system in your Chifere app.

## 📋 Prerequisites

- Supabase project with database access
- React app with existing authentication
- Basic understanding of React hooks and components

## 🗄️ Step 1: Database Setup

### **1.1 Run Database Schema**
```bash
# Navigate to your project directory
cd "c:\Users\HP\Documents\Chifere Project\chifere-app"

# Run the SQL schema (execute in Supabase SQL editor)
# Copy and paste the contents of: database/checkout_schema.sql
```

### **1.2 Verify Tables Created**
Check that these tables are created in your Supabase database:
- `orders`
- `order_items` 
- `order_status_history`
- `order_notifications`

## 🔧 Step 2: Service Integration

### **2.1 Add CheckoutService**
The service is already created at: `src/services/checkoutService.js`

### **2.2 Import in Your Components**
```javascript
import checkoutService from '../services/checkoutService';
```

## 🎨 Step 3: Component Integration

### **3.1 Add Checkout Modal to Cart**
```javascript
// In your cart component
import CheckoutModal from '../components/pages/Shared/Checkout/CheckoutModal';

const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

// Add checkout button
<button onClick={() => setIsCheckoutOpen(true)}>
  Proceed to Checkout
</button>

// Add checkout modal
<CheckoutModal
  isOpen={isCheckoutOpen}
  onClose={() => setIsCheckoutOpen(false)}
  cartItems={cartItems}
  onOrderSuccess={(orders) => {
    // Handle successful orders
    clearCart();
    showSuccessMessage('Orders placed successfully!');
  }}
/>
```

### **3.2 Add Order Management to Seller Dashboard**
```javascript
// In your seller dashboard
import OrderManagement from '../components/pages/Seller/OrderManagement/OrderManagement';

// Add to your seller routes or dashboard
<OrderManagement />
```

### **3.3 Add Order Tracking for Buyers**
```javascript
// In your orders page or profile
import OrderTracking from '../components/pages/Shared/OrderTracking/OrderTracking';

// Use with order ID
<OrderTracking orderId={orderId} />
```

## 🔄 Step 4: Real-time Setup

### **4.1 Enable Real-time in Supabase**
1. Go to your Supabase dashboard
2. Navigate to Database → Replication
3. Enable real-time for these tables:
   - `orders`
   - `order_status_history`
   - `order_notifications`

### **4.2 Test Real-time Updates**
- Create an order
- Update order status as seller
- Verify buyer sees real-time updates

## 🎯 Step 5: Testing

### **5.1 Test Order Creation**
1. Add items to cart
2. Click "Proceed to Checkout"
3. Fill shipping information
4. Select payment method
5. Review and place order
6. Verify order appears in seller dashboard

### **5.2 Test Status Updates**
1. As seller, open order management
2. Click "Update Status" on an order
3. Select new status (e.g., Processing)
4. Add optional notes
5. Confirm status change
6. Verify buyer sees real-time update

### **5.3 Test Payment Tracking**
1. Create order with payment method
2. Update payment status as seller
3. Verify payment status displays correctly

## 🔧 Step 6: Customization

### **6.1 Payment Methods**
Edit `CheckoutModal.jsx` to add/remove payment methods:
```javascript
const paymentMethods = [
  { value: 'cash_on_delivery', label: 'Cash on Delivery' },
  { value: 'gcash', label: 'GCash' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'bank_transfer', label: 'Bank Transfer' }
];
```

### **6.2 Order Status Workflow**
Modify status transitions in `OrderStatusModal.jsx`:
```javascript
const statusFlow = {
  'review': ['processing', 'cancelled'],
  'processing': ['deliver', 'cancelled'],
  'deliver': ['received', 'cancelled'],
  'received': [],
  'cancelled': []
};
```

### **6.3 Notification Settings**
Customize notifications in `OrderTracking.jsx`:
```javascript
const statusMessages = {
  'review': 'Your order is under review',
  'processing': 'Your order is being processed',
  'deliver': 'Your order is out for delivery',
  'received': 'Your order has been delivered',
  'cancelled': 'Your order has been cancelled'
};
```

## 🎨 Step 7: Styling

### **7.1 Tailwind CSS Classes**
All components use Tailwind CSS. Ensure your project has Tailwind configured.

### **7.2 Custom Styling**
Override styles by modifying the className props in components:
```javascript
// Example: Change primary color
className="bg-blue-600 hover:bg-blue-700"
// Change to:
className="bg-green-600 hover:bg-green-700"
```

## 🔒 Step 8: Security

### **8.1 Row Level Security**
The database schema includes RLS policies. Verify they're active:
```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('orders', 'order_items', 'order_status_history');
```

### **8.2 User Permissions**
Ensure users can only access their own orders:
- Buyers see only their orders
- Sellers see only orders for their products
- Proper authentication checks in place

## 📱 Step 9: Mobile Responsiveness

### **9.1 Test on Mobile**
- Checkout modal should be responsive
- Order management works on mobile
- Real-time updates work on mobile browsers

### **9.2 Touch Interactions**
- Buttons are touch-friendly
- Modals close on backdrop tap
- Swipe gestures work properly

## 🚀 Step 10: Deployment

### **10.1 Environment Variables**
Ensure these are set in production:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **10.2 Database Migrations**
Run the schema in your production database:
```bash
# In production Supabase SQL editor
# Execute: database/checkout_schema.sql
```

## 🎯 Key Features Implemented

✅ **Complete Order Lifecycle**: Review → Processing → Deliver → Received  
✅ **Payment Tracking**: Paid/Not Paid with multiple payment methods  
✅ **Real-time Updates**: Live status changes with notifications  
✅ **Seller Dashboard**: Complete order management interface  
✅ **Confirmation Dialogs**: Prevents accidental status changes  
✅ **Order History**: Complete audit trail of all changes  
✅ **Multi-seller Support**: Handles orders from multiple sellers  
✅ **Responsive Design**: Works on desktop and mobile  
✅ **Security**: Row-level security and proper validation  

## 🆘 Troubleshooting

### **Common Issues**

1. **Orders not creating**: Check database permissions and RLS policies
2. **Real-time not working**: Verify Supabase real-time is enabled
3. **Status updates failing**: Check status transition validation
4. **Payment status not updating**: Verify payment reference format

### **Debug Mode**
Enable debug logging in components:
```javascript
// Add to component
console.log('🔄 [ComponentName] Debug info:', data);
```

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify Supabase logs
3. Test database queries directly
4. Check network requests in DevTools

The checkout system is now ready to use! 🎉