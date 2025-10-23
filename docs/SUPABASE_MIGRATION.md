# Firebase to Supabase Migration Guide

## Overview

This document outlines the complete migration of the ChiFere App from Firebase to Supabase, completed on October 14, 2025. The migration maintains all business logic while replacing the backend infrastructure.

## What Changed

### Backend Infrastructure
- **Database**: Firebase Firestore → Supabase PostgreSQL
- **Authentication**: Firebase Auth → Supabase Auth
- **Storage**: Firebase Storage → Supabase Storage
- **Real-time**: Firebase Realtime Database → Supabase Realtime (PostgreSQL changes)
- **Payment Gateway**: Removed Stripe, kept PayMongo only

### Dependencies Removed
```json
{
  "firebase": "^12.2.1",
  "firebase-admin": "^12.0.0",
  "firebase-functions": "^4.5.0",
  "@stripe/react-stripe-js": "^3.9.1",
  "@stripe/stripe-js": "^7.8.0"
}
```

### Dependencies Added
```json
{
  "@supabase/supabase-js": "^2.75.0"
}
```

## Database Schema

### Table Structure (PostgreSQL)

All tables use **snake_case** naming convention:

#### User Tables
- **`buyer_users`** - Buyer user profiles
- **`seller_users`** - Seller user profiles with KYC fields

#### E-commerce Tables
- **`seller_add_item_preloved`** - Items for sale
- **`seller_add_barter_item`** - Barter-only items
- **`buyer_add_to_cart`** - Shopping cart items
- **`buyer_order_item`** - Order records
- **`buyer_barter_offer`** - Barter offers and negotiations

#### Messaging Tables
- **`conversations`** - Chat conversations
- **`messages`** - Individual messages

#### Support Tables
- **`notifications`** - User notifications
- **`delivery`** - Delivery tracking
- **`buyer_payment_method`** - Buyer payment methods
- **`seller_payment_method`** - Seller payment methods

### Field Naming Convention

All database fields use **snake_case**:
- `user_id`, `seller_id`, `buyer_id`
- `created_at`, `updated_at`
- `is_active`, `is_verified`, `is_read`
- `first_name`, `last_name`, `display_name`
- `payment_status`, `delivery_status`
- `kyc_status`, `kyc_documents`

## Setup Instructions

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project
3. Note your project URL and anon/public key

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# PayMongo
VITE_PAYMONGO_PUBLIC_KEY=pk_test_your_key_here
```

### 3. Run Database Migration

Execute the SQL schema in your Supabase SQL Editor:
- See `docs/SUPABASE_SCHEMA.sql` for complete schema
- See `docs/SUPABASE_RLS_POLICIES.md` for Row Level Security policies

### 4. Configure Storage Buckets

Create the following storage buckets in Supabase:
- `items` - Product images
- `sellers` - Seller KYC documents and business images
- `avatars` - User profile images

Set appropriate public/private access for each bucket.

### 5. Enable Realtime

Enable Realtime for these tables in Supabase Dashboard:
- `conversations`
- `messages`
- `buyer_add_to_cart`
- `buyer_barter_offer`
- `notifications`
- `delivery`

## Code Changes Summary

### Services Converted

All service files migrated to Supabase:

1. ✅ **authService.js** - Authentication and user management
2. ✅ **barterService.js** - Barter trading system
3. ✅ **cartService.js** - Shopping cart operations
4. ✅ **itemService.js** - Item/product management
5. ✅ **messagingService.js** - Real-time messaging
6. ✅ **notificationService.js** - Notification system
7. ✅ **orderService.js** - Order processing
8. ✅ **deliveryService.js** - Delivery tracking
9. ✅ **kycService.js** - KYC verification
10. ✅ **paymentMethodService.js** - Payment method management
11. ✅ **paymentService.js** - PayMongo integration (Stripe removed)

### Contexts Updated

1. ✅ **AuthContext.jsx** - Supabase Auth integration
2. ✅ **MessagingContext.jsx** - Supabase Realtime channels
3. ✅ **CartContext.jsx** - Supabase cart sync

### Configuration Files

- ✅ **src/config/supabase.js** - Supabase client configuration
- ❌ **src/config/firebase.js** - Removed
- ❌ **firebase.json** - Removed
- ❌ **.firebaserc** - Removed

## Migration Patterns

### Firestore → Supabase Queries

```javascript
// BEFORE (Firebase)
import { collection, query, where, getDocs } from 'firebase/firestore';
const q = query(collection(db, 'items'), where('status', '==', 'active'));
const snapshot = await getDocs(q);

// AFTER (Supabase)
import { supabase } from '../config/supabase';
const { data, error } = await supabase
  .from('items')
  .select('*')
  .eq('status', 'active');
```

### Real-time Listeners

```javascript
// BEFORE (Firebase)
onSnapshot(doc(db, 'items', id), (doc) => {
  callback(doc.data());
});

// AFTER (Supabase)
const channel = supabase
  .channel(`item:${id}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'items',
    filter: `id=eq.${id}`
  }, (payload) => {
    callback(payload.new);
  })
  .subscribe();
```

### Storage Operations

```javascript
// BEFORE (Firebase)
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
const imageRef = ref(storage, `items/${id}/image.jpg`);
await uploadBytes(imageRef, file);
const url = await getDownloadURL(imageRef);

// AFTER (Supabase)
const { error } = await supabase.storage
  .from('items')
  .upload(`${id}/image.jpg`, file);

const { data } = supabase.storage
  .from('items')
  .getPublicUrl(`${id}/image.jpg`);
const url = data.publicUrl;
```

## Breaking Changes

### ⚠️ Important: Data Structure Changes

1. **Field Names**: All database fields now use `snake_case`
2. **Collection Names**: Tables renamed with underscores (e.g., `buyer_barterOffer` → `buyer_barter_offer`)
3. **Timestamps**: ISO strings instead of Firebase Timestamps
4. **IDs**: UUID-based instead of Firebase document IDs

### Backward Compatibility

The service layer handles field name conversion:
- Frontend still uses `camelCase` (e.g., `userId`, `createdAt`)
- Services convert to `snake_case` for database operations
- Data returned to frontend is normalized back to `camelCase`

## Testing Checklist

After migration, test these features:

### Authentication
- [ ] User registration (buyer and seller)
- [ ] User login
- [ ] Password reset
- [ ] Role switching (buyer ↔ seller)
- [ ] KYC verification flow

### E-commerce
- [ ] Browse items
- [ ] Add to cart
- [ ] Checkout process
- [ ] Order creation
- [ ] Order tracking

### Barter System
- [ ] Create barter offer
- [ ] Counter-offer negotiation
- [ ] Accept/reject offers
- [ ] Complete barter exchange

### Messaging
- [ ] Start conversation
- [ ] Send/receive messages
- [ ] Real-time message updates
- [ ] Unread count

### Notifications
- [ ] Receive notifications
- [ ] Mark as read
- [ ] Action buttons

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**
   - Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`
   - Ensure anon key is the public/anon key, not the service role key

2. **Permission denied errors**
   - Review RLS policies in `docs/SUPABASE_RLS_POLICIES.md`
   - Ensure policies are enabled for all tables

3. **Real-time not working**
   - Enable Realtime in Supabase Dashboard for required tables
   - Check browser console for WebSocket connection errors

4. **Storage upload fails**
   - Verify storage buckets exist
   - Check bucket policies (public vs private)
   - Ensure correct file size limits

## Performance Considerations

### Optimizations

1. **Indexed Fields**: Ensure proper indexes on frequently queried fields
2. **Connection Pooling**: Supabase handles this automatically
3. **Query Optimization**: Use `select('specific,fields')` instead of `select('*')`
4. **Realtime Channels**: Unsubscribe when components unmount

### Best Practices

1. Always use `handleSupabaseError()` for consistent error handling
2. Use prepared statements to prevent SQL injection (Supabase does this automatically)
3. Implement pagination for large datasets
4. Cache frequently accessed data on the client side

## Security

### Row Level Security (RLS)

All tables have RLS policies enabled. See `docs/SUPABASE_RLS_POLICIES.md` for details.

Key security features:
- Users can only access their own data
- Sellers can only modify their own items
- Buyers can only see active items
- KYC documents are private to the seller and admins

### Authentication

- JWT-based authentication
- Automatic token refresh
- Session persistence
- Secure password hashing (bcrypt)

## Support

### Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Migration Team

For questions about this migration, contact the development team.

---

**Migration completed**: October 14, 2025
**ChiFere App Version**: 2.0.0 (Supabase)
