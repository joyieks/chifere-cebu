-- ============================================================================
-- DELETE HARDCODED TEST DATA
-- This script removes hardcoded test users and sample data
-- ============================================================================

-- Delete in correct order to handle foreign key constraints
-- First, delete all dependent records that reference the hardcoded user

-- Delete test orders (this table has foreign key to buyer_users)
DELETE FROM buyer_orders 
WHERE buyer_id = '00000000-0000-0000-0000-000000000001';

-- Delete test order items
DELETE FROM buyer_order_item 
WHERE buyer_id = '00000000-0000-0000-0000-000000000001';

-- Delete test addresses
DELETE FROM buyer_addresses 
WHERE user_id = '00000000-0000-0000-0000-000000000001'
   OR address_line1 LIKE '%Test%'
   OR address_line1 LIKE '%Sample%'
   OR address_line1 LIKE '%Demo%';

-- Delete test cart items
DELETE FROM buyer_add_to_cart 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Delete test notifications
DELETE FROM buyer_notifications 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Delete test payment methods
DELETE FROM buyer_payment_methods 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Delete test reviews/ratings (if they exist)
DELETE FROM buyer_reviews 
WHERE buyer_id = '00000000-0000-0000-0000-000000000001';

-- Delete test wishlist items (if they exist)
DELETE FROM buyer_wishlist 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Delete test messages (if they exist)
DELETE FROM messages 
WHERE sender_id = '00000000-0000-0000-0000-000000000001' 
   OR receiver_id = '00000000-0000-0000-0000-000000000001';

-- Now delete the hardcoded test buyer user "Joan Joy Diocampo"
DELETE FROM buyer_users 
WHERE id = '00000000-0000-0000-0000-000000000001' 
   OR email = 'joan.diocampo@example.com'
   OR display_name = 'Joan Joy Diocampo';

-- Delete any other hardcoded test users from buyer_users table
DELETE FROM buyer_users 
WHERE email LIKE '%@example.com'
   OR email LIKE '%@test.com'
   OR display_name IN ('Test Buyer', 'Sample Buyer', 'Demo Buyer');

-- Delete any hardcoded test users from user_profiles table
DELETE FROM user_profiles 
WHERE email LIKE '%@example.com'
   OR email LIKE '%@test.com'
   OR display_name IN ('Test Seller', 'Sample Seller', 'Demo Seller', 'Test Buyer', 'Sample Buyer', 'Demo Buyer');

-- Delete test items from sellers (if they exist)
DELETE FROM seller_add_item_preloved 
WHERE seller_id IN (
  SELECT id FROM user_profiles 
  WHERE email LIKE '%@example.com' OR email LIKE '%@test.com'
);

DELETE FROM seller_add_barter_item 
WHERE seller_id IN (
  SELECT id FROM user_profiles 
  WHERE email LIKE '%@example.com' OR email LIKE '%@test.com'
);

-- Show summary of what was deleted
SELECT 
  'buyer_users' as table_name,
  COUNT(*) as remaining_records
FROM buyer_users
UNION ALL
SELECT 
  'user_profiles' as table_name,
  COUNT(*) as remaining_records
FROM user_profiles
UNION ALL
SELECT 
  'buyer_addresses' as table_name,
  COUNT(*) as remaining_records
FROM buyer_addresses
UNION ALL
SELECT 
  'buyer_add_to_cart' as table_name,
  COUNT(*) as remaining_records
FROM buyer_add_to_cart;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Hardcoded test data has been deleted successfully!';
  RAISE NOTICE 'The admin users list should now only show real users.';
END $$;
