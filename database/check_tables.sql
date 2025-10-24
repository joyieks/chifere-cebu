-- Check what tables exist in the database
-- This will help us understand the correct table structure

SELECT 'Checking existing tables:' as info;
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%order%'
ORDER BY table_name;

-- Check the structure of buyer_orders table
SELECT 'Checking buyer_orders table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'buyer_orders' 
ORDER BY ordinal_position;

-- Check the structure of buyer_order_items table
SELECT 'Checking buyer_order_items table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'buyer_order_items' 
ORDER BY ordinal_position;

-- Check if there are any orders in buyer_orders
SELECT 'Checking orders in buyer_orders:' as info;
SELECT COUNT(*) as order_count FROM buyer_orders;

-- Check if there are any order items in buyer_order_items
SELECT 'Checking order items in buyer_order_items:' as info;
SELECT COUNT(*) as item_count FROM buyer_order_items;

-- Show recent orders
SELECT 'Recent orders:' as info;
SELECT id, order_number, buyer_id, total_amount, status, created_at
FROM buyer_orders 
ORDER BY created_at DESC 
LIMIT 5;

-- Show recent order items
SELECT 'Recent order items:' as info;
SELECT oi.id, oi.order_id, oi.product_name, oi.quantity, oi.total_price, bo.order_number
FROM buyer_order_items oi
LEFT JOIN buyer_orders bo ON oi.order_id = bo.id
ORDER BY oi.created_at DESC 
LIMIT 5;
