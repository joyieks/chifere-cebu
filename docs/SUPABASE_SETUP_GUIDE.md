# Supabase Setup Guide for ChiFere App

## 🚀 Quick Setup

Your Supabase project is already configured! Here's what you need to do:

### 1. Database Setup

1. **Go to your [Supabase Dashboard](https://app.supabase.com)**
2. **Navigate to SQL Editor**
3. **Copy and paste the entire content from `docs/SUPABASE_SCHEMA.sql`**
4. **Click "Run" to execute the schema**

### 2. Test Connection

The app is now running with a Supabase test component on the homepage. You should see:
- ✅ **Connection Status**: Shows if Supabase is connected
- 🔑 **Environment Variables**: Confirms your keys are loaded
- 🧪 **Test Buttons**: Test connection and authentication

### 3. Environment Variables

Your `.env` file is configured with:
```env
REACT_APP_SUPABASE_URL=https://msaeanvstzgrzphslcjz.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Database Tables Created

After running the schema, you'll have these tables:
- `buyer_users` - Buyer accounts
- `seller_users` - Seller accounts with KYC
- `seller_add_item_preloved` - Items for sale
- `seller_add_barter_item` - Barter-only items
- `buyer_add_to_cart` - Shopping carts
- `buyer_order_item` - Orders
- `buyer_barter_offer` - Barter offers
- `conversations` - Chat conversations
- `messages` - Individual messages
- `notifications` - User notifications
- `delivery` - Delivery tracking
- `buyer_payment_method` - Payment methods
- `seller_payment_method` - Seller payment methods

### 5. Enable Realtime (Optional)

For real-time features like messaging:
1. Go to **Database → Replication** in Supabase Dashboard
2. Enable Realtime for these tables:
   - `conversations`
   - `messages`
   - `buyer_add_to_cart`
   - `buyer_barter_offer`
   - `notifications`
   - `delivery`

### 6. Storage Setup (Optional)

For file uploads (images, documents):
1. Go to **Storage** in Supabase Dashboard
2. Create these buckets:
   - `items` (public) - Product images
   - `sellers` (private) - KYC documents
   - `avatars` (public) - User profile images

## 🔧 Troubleshooting

### Connection Issues
- Check that your `.env` file has the correct variables
- Verify your Supabase project is active
- Check browser console for error messages

### Database Issues
- Ensure you've run the complete schema
- Check table permissions in Supabase Dashboard
- Verify RLS policies are enabled

### Authentication Issues
- Check if Supabase Auth is enabled
- Verify email templates are configured
- Check authentication settings in Supabase Dashboard

## 📱 Next Steps

1. **Remove Test Component**: Once confirmed working, remove `SupabaseTest` from `App.jsx`
2. **Update Services**: Convert service files to use Supabase instead of localStorage
3. **Add Authentication**: Implement Supabase Auth in your auth service
4. **Add Real-time**: Enable real-time features for messaging and notifications

## 🎉 You're Ready!

Your ChiFere app is now connected to Supabase and ready for development!



## 🚀 Quick Setup

Your Supabase project is already configured! Here's what you need to do:

### 1. Database Setup

1. **Go to your [Supabase Dashboard](https://app.supabase.com)**
2. **Navigate to SQL Editor**
3. **Copy and paste the entire content from `docs/SUPABASE_SCHEMA.sql`**
4. **Click "Run" to execute the schema**

### 2. Test Connection

The app is now running with a Supabase test component on the homepage. You should see:
- ✅ **Connection Status**: Shows if Supabase is connected
- 🔑 **Environment Variables**: Confirms your keys are loaded
- 🧪 **Test Buttons**: Test connection and authentication

### 3. Environment Variables

Your `.env` file is configured with:
```env
REACT_APP_SUPABASE_URL=https://msaeanvstzgrzphslcjz.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Database Tables Created

After running the schema, you'll have these tables:
- `buyer_users` - Buyer accounts
- `seller_users` - Seller accounts with KYC
- `seller_add_item_preloved` - Items for sale
- `seller_add_barter_item` - Barter-only items
- `buyer_add_to_cart` - Shopping carts
- `buyer_order_item` - Orders
- `buyer_barter_offer` - Barter offers
- `conversations` - Chat conversations
- `messages` - Individual messages
- `notifications` - User notifications
- `delivery` - Delivery tracking
- `buyer_payment_method` - Payment methods
- `seller_payment_method` - Seller payment methods

### 5. Enable Realtime (Optional)

For real-time features like messaging:
1. Go to **Database → Replication** in Supabase Dashboard
2. Enable Realtime for these tables:
   - `conversations`
   - `messages`
   - `buyer_add_to_cart`
   - `buyer_barter_offer`
   - `notifications`
   - `delivery`

### 6. Storage Setup (Optional)

For file uploads (images, documents):
1. Go to **Storage** in Supabase Dashboard
2. Create these buckets:
   - `items` (public) - Product images
   - `sellers` (private) - KYC documents
   - `avatars` (public) - User profile images

## 🔧 Troubleshooting

### Connection Issues
- Check that your `.env` file has the correct variables
- Verify your Supabase project is active
- Check browser console for error messages

### Database Issues
- Ensure you've run the complete schema
- Check table permissions in Supabase Dashboard
- Verify RLS policies are enabled

### Authentication Issues
- Check if Supabase Auth is enabled
- Verify email templates are configured
- Check authentication settings in Supabase Dashboard

## 📱 Next Steps

1. **Remove Test Component**: Once confirmed working, remove `SupabaseTest` from `App.jsx`
2. **Update Services**: Convert service files to use Supabase instead of localStorage
3. **Add Authentication**: Implement Supabase Auth in your auth service
4. **Add Real-time**: Enable real-time features for messaging and notifications

## 🎉 You're Ready!

Your ChiFere app is now connected to Supabase and ready for development!


























