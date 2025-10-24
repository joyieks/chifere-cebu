-- SIMPLE ORDERS FIX
-- This is a simplified approach to fix the orders issue

-- Step 1: First, let's see what we're working with
SELECT '=== CURRENT STATE ===' as info;

-- Check if there are any orders at all
SELECT 'Orders in buyer_orders:' as info;
SELECT COUNT(*) as count FROM buyer_orders;

SELECT 'Orders in orders:' as info;
SELECT COUNT(*) as count FROM orders;

-- Check if there are any order items
SELECT 'Items in buyer_order_items:' as info;
SELECT COUNT(*) as count FROM buyer_order_items;

SELECT 'Items in order_items:' as info;
SELECT COUNT(*) as count FROM order_items;

-- Step 2: If there are no orders, let's check if there are any products and users
SELECT '=== CHECKING DATA AVAILABILITY ===' as info;

SELECT 'Products available:' as info;
SELECT COUNT(*) as count FROM products;

SELECT 'Users available:' as info;
SELECT COUNT(*) as count FROM user_profiles;

SELECT 'Buyers available:' as info;
SELECT COUNT(*) as count FROM buyer_users;

-- Step 3: If there are orders but no seller_id, let's fix them
-- First, let's see what the seller_id looks like in order items
SELECT '=== SELLER_ID IN ORDER ITEMS ===' as info;

SELECT 'Seller IDs in buyer_order_items:' as info;
SELECT 
    seller_id,
    pg_typeof(seller_id) as data_type,
    COUNT(*) as count
FROM buyer_order_items 
WHERE seller_id IS NOT NULL
GROUP BY seller_id, pg_typeof(seller_id);

SELECT 'Seller IDs in order_items:' as info;
SELECT 
    seller_id,
    pg_typeof(seller_id) as data_type,
    COUNT(*) as count
FROM order_items 
WHERE seller_id IS NOT NULL
GROUP BY seller_id, pg_typeof(seller_id);

-- Step 4: Fix buyer_orders if needed
SELECT '=== FIXING BUYER_ORDERS ===' as info;

-- Update buyer_orders with seller_id from buyer_order_items
UPDATE buyer_orders 
SET seller_id = (
    SELECT DISTINCT boi.seller_id::uuid
    FROM buyer_order_items boi 
    WHERE boi.order_id = buyer_orders.id 
    AND boi.seller_id IS NOT NULL
    LIMIT 1
)
WHERE seller_id IS NULL 
AND EXISTS (
    SELECT 1 
    FROM buyer_order_items boi 
    WHERE boi.order_id = buyer_orders.id 
    AND boi.seller_id IS NOT NULL
);

-- Step 5: Fix orders if needed
SELECT '=== FIXING ORDERS ===' as info;

-- Update orders with seller_id from order_items
UPDATE orders 
SET seller_id = (
    SELECT DISTINCT oi.seller_id::uuid
    FROM order_items oi 
    WHERE oi.order_id = orders.id 
    AND oi.seller_id IS NOT NULL
    LIMIT 1
)
WHERE seller_id IS NULL 
AND EXISTS (
    SELECT 1 
    FROM order_items oi 
    WHERE oi.order_id = orders.id 
    AND oi.seller_id IS NOT NULL
);

-- Step 6: Show results
SELECT '=== RESULTS ===' as info;

SELECT 'Orders with seller_id after fix:' as info;
SELECT 
    'buyer_orders' as table_name,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN seller_id IS NOT NULL THEN 1 END) as orders_with_seller_id,
    COUNT(CASE WHEN seller_id IS NULL THEN 1 END) as orders_without_seller_id
FROM buyer_orders
UNION ALL
SELECT 
    'orders' as table_name,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN seller_id IS NOT NULL THEN 1 END) as orders_with_seller_id,
    COUNT(CASE WHEN seller_id IS NULL THEN 1 END) as orders_without_seller_id
FROM orders;

-- Step 7: Show orders by seller
SELECT '=== ORDERS BY SELLER ===' as info;

SELECT 'Orders by seller in buyer_orders:' as info;
SELECT 
    seller_id,
    COUNT(*) as order_count
FROM buyer_orders 
WHERE seller_id IS NOT NULL
GROUP BY seller_id
ORDER BY order_count DESC;

SELECT 'Orders by seller in orders:' as info;
SELECT 
    seller_id,
    COUNT(*) as order_count
FROM orders 
WHERE seller_id IS NOT NULL
GROUP BY seller_id
ORDER BY order_count DESC;

SELECT '=== SIMPLE FIX COMPLETE ===' as status;
