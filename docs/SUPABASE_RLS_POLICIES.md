# Supabase Row Level Security (RLS) Policies

## Overview

This document outlines the Row Level Security policies for the ChiFere App database. RLS ensures that users can only access data they're authorized to see.

## Important: Enable RLS

Before applying policies, enable RLS for all tables in Supabase Dashboard:

```sql
ALTER TABLE buyer_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_add_item_preloved ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_add_barter_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_add_to_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_order_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_barter_offer ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_payment_method ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_payment_method ENABLE ROW LEVEL SECURITY;
```

## User Tables

### Buyer Users

```sql
-- Users can view their own profile
CREATE POLICY "Users can view own buyer profile"
  ON buyer_users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own buyer profile"
  ON buyer_users FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (registration)
CREATE POLICY "Users can create own buyer profile"
  ON buyer_users FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### Seller Users

```sql
-- Users can view their own seller profile
CREATE POLICY "Users can view own seller profile"
  ON seller_users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own seller profile
CREATE POLICY "Users can update own seller profile"
  ON seller_users FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own seller profile
CREATE POLICY "Users can create own seller profile"
  ON seller_users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Public can view verified sellers (for seller listings)
CREATE POLICY "Public can view verified sellers"
  ON seller_users FOR SELECT
  USING (is_business_verified = true AND kyc_status = 'approved');
```

## Item/Product Tables

### Preloved Items

```sql
-- Anyone can view active items
CREATE POLICY "Anyone can view active preloved items"
  ON seller_add_item_preloved FOR SELECT
  USING (status = 'active');

-- Sellers can view their own items (any status)
CREATE POLICY "Sellers can view own items"
  ON seller_add_item_preloved FOR SELECT
  USING (auth.uid() = seller_id);

-- Sellers can create items
CREATE POLICY "Sellers can create items"
  ON seller_add_item_preloved FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- Sellers can update own items
CREATE POLICY "Sellers can update own items"
  ON seller_add_item_preloved FOR UPDATE
  USING (auth.uid() = seller_id);

-- Sellers can delete own items
CREATE POLICY "Sellers can delete own items"
  ON seller_add_item_preloved FOR DELETE
  USING (auth.uid() = seller_id);
```

### Barter Items

```sql
-- Anyone can view active barter items
CREATE POLICY "Anyone can view active barter items"
  ON seller_add_barter_item FOR SELECT
  USING (status = 'active');

-- Sellers can view their own items
CREATE POLICY "Sellers can view own barter items"
  ON seller_add_barter_item FOR SELECT
  USING (auth.uid() = seller_id);

-- Sellers can create barter items
CREATE POLICY "Sellers can create barter items"
  ON seller_add_barter_item FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- Sellers can update own barter items
CREATE POLICY "Sellers can update own barter items"
  ON seller_add_barter_item FOR UPDATE
  USING (auth.uid() = seller_id);

-- Sellers can delete own barter items
CREATE POLICY "Sellers can delete own barter items"
  ON seller_add_barter_item FOR DELETE
  USING (auth.uid() = seller_id);
```

## Cart and Orders

### Shopping Cart

```sql
-- Users can view own cart
CREATE POLICY "Users can view own cart"
  ON buyer_add_to_cart FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create own cart
CREATE POLICY "Users can create own cart"
  ON buyer_add_to_cart FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own cart
CREATE POLICY "Users can update own cart"
  ON buyer_add_to_cart FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete own cart
CREATE POLICY "Users can delete own cart"
  ON buyer_add_to_cart FOR DELETE
  USING (auth.uid() = user_id);
```

### Orders

```sql
-- Buyers can view their own orders
CREATE POLICY "Buyers can view own orders"
  ON buyer_order_item FOR SELECT
  USING (auth.uid() = buyer_id);

-- Sellers can view orders for their items
CREATE POLICY "Sellers can view orders for their items"
  ON buyer_order_item FOR SELECT
  USING (auth.uid() = seller_id);

-- Buyers can create orders
CREATE POLICY "Buyers can create orders"
  ON buyer_order_item FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Sellers can update order status
CREATE POLICY "Sellers can update order status"
  ON buyer_order_item FOR UPDATE
  USING (auth.uid() = seller_id);
```

## Barter System

### Barter Offers

```sql
-- Requesters can view their sent offers
CREATE POLICY "Requesters can view sent offers"
  ON buyer_barter_offer FOR SELECT
  USING (auth.uid() = requester_id);

-- Owners can view received offers
CREATE POLICY "Owners can view received offers"
  ON buyer_barter_offer FOR SELECT
  USING (auth.uid() = owner_id);

-- Users can create barter offers
CREATE POLICY "Users can create barter offers"
  ON buyer_barter_offer FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Requesters and owners can update offers
CREATE POLICY "Participants can update barter offers"
  ON buyer_barter_offer FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = owner_id);
```

## Messaging

### Conversations

```sql
-- Participants can view their conversations
CREATE POLICY "Participants can view conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = ANY(participants));

-- Users can create conversations
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = ANY(participants));

-- Participants can update conversations
CREATE POLICY "Participants can update conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = ANY(participants));
```

### Messages

```sql
-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND auth.uid() = ANY(conversations.participants)
    )
  );

-- Users can send messages in their conversations
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND auth.uid() = ANY(conversations.participants)
    )
  );

-- Senders can update their own messages
CREATE POLICY "Senders can update own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id);
```

## Notifications

```sql
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- System can insert notifications (service role)
-- This requires service role key, not user JWT
```

## Delivery

```sql
-- Buyers can view delivery for their orders
CREATE POLICY "Buyers can view delivery for their orders"
  ON delivery FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM buyer_order_item
      WHERE buyer_order_item.id = delivery.order_id
      AND buyer_order_item.buyer_id = auth.uid()
    )
  );

-- Sellers can view delivery for their orders
CREATE POLICY "Sellers can view delivery for their orders"
  ON delivery FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM buyer_order_item
      WHERE buyer_order_item.id = delivery.order_id
      AND buyer_order_item.seller_id = auth.uid()
    )
  );

-- Sellers can update delivery status
CREATE POLICY "Sellers can update delivery status"
  ON delivery FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM buyer_order_item
      WHERE buyer_order_item.id = delivery.order_id
      AND buyer_order_item.seller_id = auth.uid()
    )
  );
```

## Payment Methods

### Buyer Payment Methods

```sql
-- Buyers can view their own payment methods
CREATE POLICY "Buyers can view own payment methods"
  ON buyer_payment_method FOR SELECT
  USING (auth.uid() = user_id);

-- Buyers can create payment methods
CREATE POLICY "Buyers can create payment methods"
  ON buyer_payment_method FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Buyers can update own payment methods
CREATE POLICY "Buyers can update own payment methods"
  ON buyer_payment_method FOR UPDATE
  USING (auth.uid() = user_id);

-- Buyers can delete own payment methods
CREATE POLICY "Buyers can delete own payment methods"
  ON buyer_payment_method FOR DELETE
  USING (auth.uid() = user_id);
```

### Seller Payment Methods

```sql
-- Sellers can view their own payment methods
CREATE POLICY "Sellers can view own payment methods"
  ON seller_payment_method FOR SELECT
  USING (auth.uid() = user_id);

-- Sellers can create payment methods
CREATE POLICY "Sellers can create payment methods"
  ON seller_payment_method FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Sellers can update own payment methods
CREATE POLICY "Sellers can update own payment methods"
  ON seller_payment_method FOR UPDATE
  USING (auth.uid() = user_id);

-- Sellers can delete own payment methods
CREATE POLICY "Sellers can delete own payment methods"
  ON seller_payment_method FOR DELETE
  USING (auth.uid() = user_id);
```

## Storage Policies

### Items Bucket (public)

```sql
-- Anyone can read item images
CREATE POLICY "Public read access to items"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'items');

-- Authenticated users can upload item images
CREATE POLICY "Authenticated users can upload items"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'items' AND
    auth.role() = 'authenticated'
  );

-- Sellers can delete their own item images
CREATE POLICY "Sellers can delete own item images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'items' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### Sellers Bucket (private - KYC documents)

```sql
-- Sellers can read their own KYC documents
CREATE POLICY "Sellers can read own KYC documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'sellers' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Sellers can upload their own KYC documents
CREATE POLICY "Sellers can upload own KYC documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'sellers' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Sellers can delete their own documents
CREATE POLICY "Sellers can delete own documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'sellers' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### Avatars Bucket (public)

```sql
-- Anyone can read avatars
CREATE POLICY "Public read access to avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Admin/Service Role Access

For admin operations, use the Supabase service role key (server-side only):

- Full access to all tables
- Can bypass RLS policies
- Can create notifications
- Can approve/reject KYC
- Can manage user accounts

**⚠️ Never expose service role key to client-side code!**

## Testing RLS Policies

Test your policies with different user roles:

```sql
-- Test as authenticated user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'user-uuid-here';

-- Test queries
SELECT * FROM buyer_users; -- Should only see own profile
SELECT * FROM seller_add_item_preloved; -- Should see all active items

-- Reset
RESET ROLE;
```

## Troubleshooting

### Common Issues

1. **"permission denied for table" error**
   - Ensure RLS is enabled on the table
   - Check that appropriate policy exists
   - Verify user is authenticated (`auth.uid()` returns value)

2. **Policies not working**
   - Check policy conditions match your data
   - Verify `auth.uid()` matches the user ID in your data
   - Test with service role to bypass RLS and confirm data exists

3. **Can't insert/update data**
   - Check INSERT/UPDATE policies exist
   - Verify WITH CHECK conditions are met
   - Ensure foreign key constraints are satisfied

## Security Best Practices

1. **Always enable RLS** on all tables containing user data
2. **Use auth.uid()** to ensure users only access their own data
3. **Test policies** thoroughly with different user roles
4. **Limit public access** - only expose what's necessary
5. **Use service role sparingly** - only for trusted backend operations
6. **Audit policies regularly** - review and update as features evolve

---

**Last Updated**: October 14, 2025
**Version**: 2.0.0
