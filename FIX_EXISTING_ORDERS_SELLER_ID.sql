-- FIX EXISTING ORDERS WITH NULL SELLER_ID
-- This script will fix orders that were created without proper seller_id

-- Step 1: Show orders with NULL seller_id
SELECT 'Orders with NULL seller_id before fix:' as info;
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

-- Step 2: Show specific orders with NULL seller_id
SELECT 'Specific orders with NULL seller_id:' as info;
SELECT 
    'buyer_orders' as table_name,
    id,
    order_number,
    buyer_id,
    seller_id,
    created_at
FROM buyer_orders 
WHERE seller_id IS NULL
UNION ALL
SELECT 
    'orders' as table_name,
    id,
    order_number,
    buyer_id,
    seller_id,
    created_at
FROM orders 
WHERE seller_id IS NULL
ORDER BY created_at DESC;

-- Step 3: Fix buyer_orders by getting seller_id from order items
UPDATE buyer_orders 
SET seller_id = (
    SELECT boi.seller_id::uuid 
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

-- Step 4: Fix orders by getting seller_id from order items
UPDATE orders 
SET seller_id = (
    SELECT oi.seller_id::uuid 
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

-- Step 5: If still NULL, try to get from products table
UPDATE buyer_orders 
SET seller_id = (
    SELECT p.seller_id::uuid 
    FROM buyer_order_items boi 
    JOIN products p ON boi.product_id::uuid = p.id 
    WHERE boi.order_id = buyer_orders.id 
    AND p.seller_id IS NOT NULL
    LIMIT 1
)
WHERE seller_id IS NULL 
AND EXISTS (
    SELECT 1 
    FROM buyer_order_items boi 
    JOIN products p ON boi.product_id::uuid = p.id 
    WHERE boi.order_id = buyer_orders.id 
    AND p.seller_id IS NOT NULL
);

UPDATE orders 
SET seller_id = (
    SELECT p.seller_id::uuid 
    FROM order_items oi 
    JOIN products p ON oi.product_id::uuid = p.id 
    WHERE oi.order_id = orders.id 
    AND p.seller_id IS NOT NULL
    LIMIT 1
)
WHERE seller_id IS NULL 
AND EXISTS (
    SELECT 1 
    FROM order_items oi 
    JOIN products p ON oi.product_id::uuid = p.id 
    WHERE oi.order_id = orders.id 
    AND p.seller_id IS NOT NULL
);

-- Step 6: Try seller_add_item_preloved table
UPDATE buyer_orders 
SET seller_id = (
    SELECT sap.seller_id::uuid 
    FROM buyer_order_items boi 
    JOIN seller_add_item_preloved sap ON boi.product_id::uuid = sap.id 
    WHERE boi.order_id = buyer_orders.id 
    AND sap.seller_id IS NOT NULL
    LIMIT 1
)
WHERE seller_id IS NULL 
AND EXISTS (
    SELECT 1 
    FROM buyer_order_items boi 
    JOIN seller_add_item_preloved sap ON boi.product_id::uuid = sap.id 
    WHERE boi.order_id = buyer_orders.id 
    AND sap.seller_id IS NOT NULL
);

UPDATE orders 
SET seller_id = (
    SELECT sap.seller_id::uuid 
    FROM order_items oi 
    JOIN seller_add_item_preloved sap ON oi.product_id::uuid = sap.id 
    WHERE oi.order_id = orders.id 
    AND sap.seller_id IS NOT NULL
    LIMIT 1
)
WHERE seller_id IS NULL 
AND EXISTS (
    SELECT 1 
    FROM order_items oi 
    JOIN seller_add_item_preloved sap ON oi.product_id::uuid = sap.id 
    WHERE oi.order_id = orders.id 
    AND sap.seller_id IS NOT NULL
);

-- Step 7: Try seller_add_barter_item table
UPDATE buyer_orders 
SET seller_id = (
    SELECT sab.seller_id::uuid 
    FROM buyer_order_items boi 
    JOIN seller_add_barter_item sab ON boi.product_id::uuid = sab.id 
    WHERE boi.order_id = buyer_orders.id 
    AND sab.seller_id IS NOT NULL
    LIMIT 1
)
WHERE seller_id IS NULL 
AND EXISTS (
    SELECT 1 
    FROM buyer_order_items boi 
    JOIN seller_add_barter_item sab ON boi.product_id::uuid = sab.id 
    WHERE boi.order_id = buyer_orders.id 
    AND sab.seller_id IS NOT NULL
);

UPDATE orders 
SET seller_id = (
    SELECT sab.seller_id::uuid 
    FROM order_items oi 
    JOIN seller_add_barter_item sab ON oi.product_id::uuid = sab.id 
    WHERE oi.order_id = orders.id 
    AND sab.seller_id IS NOT NULL
    LIMIT 1
)
WHERE seller_id IS NULL 
AND EXISTS (
    SELECT 1 
    FROM order_items oi 
    JOIN seller_add_barter_item sab ON oi.product_id::uuid = sab.id 
    WHERE oi.order_id = orders.id 
    AND sab.seller_id IS NOT NULL
);

-- Step 8: Show results after fixes
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

-- Step 9: Show all orders with their seller_id
SELECT 'All orders with seller_id after fix:' as info;
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

SELECT 'Orders seller_id fix completed!' as status;
