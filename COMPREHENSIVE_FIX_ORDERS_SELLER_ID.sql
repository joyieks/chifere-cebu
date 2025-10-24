-- COMPREHENSIVE FIX ORDERS SELLER_ID
-- This script will fix orders in BOTH order systems (buyer_orders and orders)
-- The application uses both systems, so we need to fix both

-- Step 1: Show current situation for both order systems
SELECT '=== CURRENT SITUATION ===' as info;

SELECT 'Orders with NULL seller_id in buyer_orders:' as info;
SELECT 
    'buyer_orders' as table_name,
    COUNT(*) as count
FROM buyer_orders 
WHERE seller_id IS NULL
UNION ALL
SELECT 
    'orders' as table_name,
    COUNT(*) as count
FROM orders 
WHERE seller_id IS NULL;

-- Step 2: Show what seller_ids exist in order items for both systems
SELECT '=== SELLER IDs IN ORDER ITEMS ===' as info;

SELECT 'Seller IDs in buyer_order_items:' as info;
SELECT DISTINCT seller_id, COUNT(*) as order_count
FROM buyer_order_items 
WHERE seller_id IS NOT NULL
GROUP BY seller_id
ORDER BY order_count DESC;

SELECT 'Seller IDs in order_items:' as info;
SELECT DISTINCT seller_id, COUNT(*) as order_count
FROM order_items 
WHERE seller_id IS NOT NULL
GROUP BY seller_id
ORDER BY order_count DESC;

-- Step 3: Show orders that need fixing in both systems
SELECT '=== ORDERS THAT NEED FIXING ===' as info;

SELECT 'Orders with NULL seller_id in buyer_orders:' as info;
SELECT 
    id,
    order_number,
    buyer_id,
    seller_id,
    status,
    total_amount,
    created_at
FROM buyer_orders 
WHERE seller_id IS NULL
ORDER BY created_at DESC;

SELECT 'Orders with NULL seller_id in orders:' as info;
SELECT 
    id,
    order_number,
    buyer_id,
    seller_id,
    status,
    total_amount,
    created_at
FROM orders 
WHERE seller_id IS NULL
ORDER BY created_at DESC;

-- Step 4: Fix buyer_orders table
SELECT '=== FIXING BUYER_ORDERS TABLE ===' as info;

-- For buyer_orders - get seller_id from buyer_order_items
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

-- Step 5: Fix orders table
SELECT '=== FIXING ORDERS TABLE ===' as info;

-- For orders - get seller_id from order_items
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

-- Step 6: Show results after fix
SELECT '=== RESULTS AFTER FIX ===' as info;

SELECT 'Orders with NULL seller_id after fix:' as info;
SELECT 
    'buyer_orders' as table_name,
    COUNT(*) as count
FROM buyer_orders 
WHERE seller_id IS NULL
UNION ALL
SELECT 
    'orders' as table_name,
    COUNT(*) as count
FROM orders 
WHERE seller_id IS NULL;

-- Step 7: Show all orders with their seller_id after fix
SELECT '=== ALL ORDERS AFTER FIX ===' as info;

SELECT 'All buyer_orders after fix:' as info;
SELECT 
    order_number,
    buyer_id,
    seller_id,
    status,
    total_amount,
    created_at
FROM buyer_orders 
ORDER BY created_at DESC;

SELECT 'All orders after fix:' as info;
SELECT 
    order_number,
    buyer_id,
    seller_id,
    status,
    total_amount,
    created_at
FROM orders 
ORDER BY created_at DESC;

-- Step 8: Show summary by seller
SELECT '=== SUMMARY BY SELLER ===' as info;

SELECT 'Orders by seller in buyer_orders:' as info;
SELECT 
    seller_id,
    COUNT(*) as order_count,
    SUM(total_amount) as total_sales
FROM buyer_orders 
WHERE seller_id IS NOT NULL
GROUP BY seller_id
ORDER BY order_count DESC;

SELECT 'Orders by seller in orders:' as info;
SELECT 
    seller_id,
    COUNT(*) as order_count,
    SUM(total_amount) as total_sales
FROM orders 
WHERE seller_id IS NOT NULL
GROUP BY seller_id
ORDER BY order_count DESC;

SELECT '=== COMPREHENSIVE FIX COMPLETED! ===' as status;
