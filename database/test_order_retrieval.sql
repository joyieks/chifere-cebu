-- Test order retrieval to debug the My Purchases issue
-- This will help us understand why orders aren't showing up

-- First, let's see what orders exist
SELECT 'All orders in buyer_orders:' as info;
SELECT id, order_number, buyer_id, seller_id, status, total_amount, created_at
FROM buyer_orders 
ORDER BY created_at DESC;

-- Check if there are any order items
SELECT 'All order items:' as info;
SELECT oi.id, oi.order_id, oi.product_name, oi.quantity, oi.total_price, bo.order_number, bo.buyer_id
FROM buyer_order_items oi
LEFT JOIN buyer_orders bo ON oi.order_id = bo.id
ORDER BY oi.created_at DESC;

-- Test with a specific buyer ID (replace with actual user ID)
-- Let's check what buyer IDs exist
SELECT 'Distinct buyer IDs:' as info;
SELECT DISTINCT buyer_id FROM buyer_orders;

-- Test the exact query that MyPurchase component uses
-- Replace 'd7f43ccd-3576-43e3-ac94-ec60c7674df9' with the actual user ID
SELECT 'Testing MyPurchase query for specific user:' as info;
SELECT * FROM buyer_orders 
WHERE buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9'
ORDER BY created_at DESC;

-- Test order items query for the same user
SELECT 'Testing order items for specific user:' as info;
SELECT oi.*, bo.order_number, bo.buyer_id
FROM buyer_order_items oi
LEFT JOIN buyer_orders bo ON oi.order_id = bo.id
WHERE bo.buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9'
ORDER BY oi.created_at DESC;

-- Check RLS policies on buyer_orders
SELECT 'RLS policies on buyer_orders:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'buyer_orders';

-- Check RLS policies on buyer_order_items
SELECT 'RLS policies on buyer_order_items:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'buyer_order_items';
