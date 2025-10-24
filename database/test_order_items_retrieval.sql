-- Test order items retrieval specifically
-- This will help us see if order items are being loaded correctly

-- First, let's see the specific order that's showing up
SELECT 'Order details for TEST-1761280538.741841:' as info;
SELECT id, order_number, buyer_id, seller_id, status, total_amount, created_at
FROM buyer_orders 
WHERE order_number = 'TEST-1761280538.741841';

-- Now let's see the order items for this specific order
SELECT 'Order items for TEST-1761280538.741841:' as info;
SELECT oi.id, oi.order_id, oi.product_id, oi.product_name, oi.quantity, oi.total_price, oi.created_at
FROM buyer_order_items oi
LEFT JOIN buyer_orders bo ON oi.order_id = bo.id
WHERE bo.order_number = 'TEST-1761280538.741841';

-- Test the exact query that orderService uses to get order items
-- Replace the order_id with the actual ID from the first query
SELECT 'Testing order items query for specific order:' as info;
SELECT * FROM buyer_order_items 
WHERE order_id = '62d0f969-b332-482c-9dbf-a8e96dcf8c47'  -- This is the order_id from the first result
ORDER BY created_at DESC;

-- Check if there are any RLS issues with order items specifically
SELECT 'Testing RLS on order items:' as info;
SELECT oi.*, bo.order_number, bo.buyer_id
FROM buyer_order_items oi
LEFT JOIN buyer_orders bo ON oi.order_id = bo.id
WHERE bo.buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9'
ORDER BY oi.created_at DESC;

-- Check the order items count for this user
SELECT 'Order items count for user:' as info;
SELECT COUNT(*) as total_items
FROM buyer_order_items oi
LEFT JOIN buyer_orders bo ON oi.order_id = bo.id
WHERE bo.buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9';
