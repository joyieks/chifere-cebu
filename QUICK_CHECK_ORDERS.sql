-- QUICK CHECK ORDERS - Run this first to see what's happening

-- 1. Check all orders in both tables
SELECT 'buyer_orders table:' as table_name, COUNT(*) as order_count FROM buyer_orders
UNION ALL
SELECT 'orders table:' as table_name, COUNT(*) as order_count FROM orders;

-- 2. Show recent orders with their seller_id
SELECT 'Recent buyer_orders:' as info;
SELECT 
    order_number,
    buyer_id,
    seller_id,
    status,
    total_amount,
    created_at
FROM buyer_orders 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 'Recent orders:' as info;
SELECT 
    order_number,
    buyer_id,
    seller_id,
    status,
    total_amount,
    created_at
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check if seller_id is NULL in orders
SELECT 'Orders with NULL seller_id:' as info;
SELECT 
    'buyer_orders' as table_name,
    order_number,
    buyer_id,
    seller_id,
    created_at
FROM buyer_orders 
WHERE seller_id IS NULL
UNION ALL
SELECT 
    'orders' as table_name,
    order_number,
    buyer_id,
    seller_id,
    created_at
FROM orders 
WHERE seller_id IS NULL;

-- 4. Check what sellers exist
SELECT 'Available sellers:' as info;
SELECT 
    id,
    email,
    user_type,
    seller_status
FROM user_profiles 
WHERE user_type = 'seller';
