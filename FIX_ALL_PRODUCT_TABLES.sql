-- FIX ALL PRODUCT TABLES
-- This will fix seller_id for products from all product tables

-- Step 1: Fix order items by looking in all product tables
UPDATE buyer_order_items 
SET seller_id = (
    -- Try products table first
    SELECT p.seller_id::text
    FROM products p
    WHERE p.id = buyer_order_items.product_id
    AND p.seller_id IS NOT NULL
    
    UNION ALL
    
    -- Try seller_add_item_preloved table
    SELECT sap.seller_id::text
    FROM seller_add_item_preloved sap
    WHERE sap.id = buyer_order_items.product_id
    AND sap.seller_id IS NOT NULL
    
    UNION ALL
    
    -- Try seller_add_barter_item table
    SELECT sab.seller_id::text
    FROM seller_add_barter_item sab
    WHERE sab.id = buyer_order_items.product_id
    AND sab.seller_id IS NOT NULL
    
    LIMIT 1
)
WHERE (seller_id IS NULL OR seller_id = '' OR seller_id = '00000000-0000-0000-0000-000000000000')
AND EXISTS (
    SELECT 1 FROM products p WHERE p.id = buyer_order_items.product_id
    UNION ALL
    SELECT 1 FROM seller_add_item_preloved sap WHERE sap.id = buyer_order_items.product_id
    UNION ALL
    SELECT 1 FROM seller_add_barter_item sab WHERE sab.id = buyer_order_items.product_id
);

-- Step 2: Fix orders by getting seller_id from order items
UPDATE buyer_orders 
SET seller_id = (
    SELECT DISTINCT boi.seller_id::uuid
    FROM buyer_order_items boi
    WHERE boi.order_id = buyer_orders.id
    AND boi.seller_id IS NOT NULL
    AND boi.seller_id != ''
    AND boi.seller_id != '00000000-0000-0000-0000-000000000000'
    LIMIT 1
)
WHERE (seller_id IS NULL OR seller_id = '00000000-0000-0000-0000-000000000000'::uuid)
AND EXISTS (
    SELECT 1 
    FROM buyer_order_items boi
    WHERE boi.order_id = buyer_orders.id
    AND boi.seller_id IS NOT NULL
    AND boi.seller_id != ''
    AND boi.seller_id != '00000000-0000-0000-0000-000000000000'
);

-- Step 3: Show results after fix
SELECT '=== ORDER ITEMS AFTER FIX ===' as info;
SELECT 
    order_id,
    product_id,
    seller_id,
    product_name,
    quantity
FROM buyer_order_items
WHERE seller_id IS NOT NULL
AND seller_id != ''
AND seller_id != '00000000-0000-0000-0000-000000000000'
ORDER BY created_at DESC;

-- Step 4: Show orders after fix
SELECT '=== ORDERS AFTER FIX ===' as info;
SELECT 
    id,
    order_number,
    buyer_id,
    seller_id,
    status,
    total_amount
FROM buyer_orders
WHERE seller_id IS NOT NULL
AND seller_id != '00000000-0000-0000-0000-000000000000'::uuid
ORDER BY created_at DESC;

-- Step 5: Show orders by seller
SELECT '=== ORDERS BY SELLER ===' as info;
SELECT 
    seller_id,
    COUNT(*) as order_count,
    STRING_AGG(order_number, ', ') as order_numbers
FROM buyer_orders 
WHERE seller_id IS NOT NULL
AND seller_id != '00000000-0000-0000-0000-000000000000'::uuid
GROUP BY seller_id
ORDER BY order_count DESC;

SELECT '=== ALL PRODUCT TABLES FIX COMPLETE ===' as status;
