-- ============================================================================
-- DATABASE TABLE CHECKER
-- This script checks what tables exist in your database
-- ============================================================================

-- Check all tables in the current database
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
ORDER BY table_schema, table_name;

-- Check specifically for user-related tables
SELECT 
  table_name,
  'EXISTS' as status
FROM information_schema.tables 
WHERE table_name IN ('buyer_users', 'seller_users', 'user_profiles', 'users')
ORDER BY table_name;

-- Check for checkout-related tables
SELECT 
  table_name,
  'EXISTS' as status
FROM information_schema.tables 
WHERE table_name IN ('buyer_addresses', 'buyer_orders', 'order_items', 'payment_transactions', 'delivery_tracking')
ORDER BY table_name;

-- Show table counts
SELECT 
  'Total Tables' as description,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema NOT IN ('information_schema', 'pg_catalog')

UNION ALL

SELECT 
  'User Tables' as description,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_name IN ('buyer_users', 'seller_users', 'user_profiles', 'users')

UNION ALL

SELECT 
  'Checkout Tables' as description,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_name IN ('buyer_addresses', 'buyer_orders', 'order_items', 'payment_transactions', 'delivery_tracking');