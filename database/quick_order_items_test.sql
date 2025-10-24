-- Quick test to see order items for the specific order
-- This will help us understand if the items exist and are accessible

-- Get the order ID for TEST-1761280538.741841
SELECT 'Order ID for TEST-1761280538.741841:' as info;
SELECT id, order_number, buyer_id FROM buyer_orders 
WHERE order_number = 'TEST-1761280538.741841';

-- Get order items for this order
SELECT 'Order items for TEST-1761280538.741841:' as info;
SELECT oi.id, oi.order_id, oi.product_name, oi.quantity, oi.total_price
FROM buyer_order_items oi
WHERE oi.order_id = '62d0f969-b332-482c-9dbf-a8e96dcf8c47';

-- Test the exact query that the application uses
SELECT 'Testing application query:' as info;
SELECT * FROM buyer_order_items 
WHERE order_id = '62d0f969-b332-482c-9dbf-a8e96dcf8c47';

-- Check if RLS is blocking the query
SELECT 'Testing with auth context:' as info;
SELECT oi.*, bo.order_number, bo.buyer_id
FROM buyer_order_items oi
LEFT JOIN buyer_orders bo ON oi.order_id = bo.id
WHERE bo.order_number = 'TEST-1761280538.741841'
AND bo.buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9';
