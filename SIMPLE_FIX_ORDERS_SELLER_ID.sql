-- SIMPLE FIX ORDERS SELLER_ID
-- This script will fix orders that were created without proper seller_id

-- Step 1: Show current situation
SELECT 'Current orders with NULL seller_id:' as info;
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

-- Step 2: Show what seller_ids exist in order items
SELECT 'Seller IDs in buyer_order_items:' as info;
SELECT DISTINCT seller_id, COUNT(*) as order_count
FROM buyer_order_items 
WHERE seller_id IS NOT NULL
GROUP BY seller_id;

SELECT 'Seller IDs in order_items:' as info;
SELECT DISTINCT seller_id, COUNT(*) as order_count
FROM order_items 
WHERE seller_id IS NOT NULL
GROUP BY seller_id;

-- Step 3: Show orders that need fixing
SELECT 'Orders that need seller_id fix:' as info;
SELECT 
    'buyer_orders' as table_name,
    id,
    order_number,
    buyer_id,
    seller_id,
    created_at
FROM buyer_orders 
WHERE seller_id IS NULL
ORDER BY created_at DESC;

-- Step 4: Simple fix - set seller_id to the first available seller from order items
-- For buyer_orders
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

-- For orders
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

-- Step 5: Show results after fix
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

-- Step 6: Show all orders with their seller_id
SELECT 'All orders after fix:' as info;
SELECT 
    'buyer_orders' as table_name,
    order_number,
    buyer_id,
    seller_id,
    status,
    total_amount,
    created_at
FROM buyer_orders 
ORDER BY created_at DESC;

SELECT 
    'orders' as table_name,
    order_number,
    buyer_id,
    seller_id,
    status,
    total_amount,
    created_at
FROM orders 
ORDER BY created_at DESC;

SELECT 'Simple fix completed!' as status;
