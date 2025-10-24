-- FIX ORDERS BY PRODUCT OWNER
-- This script will only assign orders to sellers if the products actually belong to them

-- Step 1: Check what products belong to the current seller
SELECT 'Products belonging to current seller:' as info;
SELECT 
    'products' as table_name,
    id,
    name,
    seller_id,
    created_at
FROM products 
WHERE seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
UNION ALL
SELECT 
    'seller_add_item_preloved' as table_name,
    id,
    name,
    seller_id,
    created_at
FROM seller_add_item_preloved 
WHERE seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
UNION ALL
SELECT 
    'seller_add_barter_item' as table_name,
    id,
    name,
    seller_id,
    created_at
FROM seller_add_barter_item 
WHERE seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e';

-- Step 2: Check which orders contain products from the current seller
SELECT 'Orders containing products from current seller:' as info;
SELECT DISTINCT
    bo.order_number,
    bo.seller_id as current_seller_id,
    boi.product_id,
    boi.product_name,
    p.seller_id as product_seller_id,
    bo.created_at,
    CASE 
        WHEN p.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e' THEN 'MATCH'
        ELSE 'NO_MATCH'
    END as seller_match
FROM buyer_orders bo
JOIN buyer_order_items boi ON bo.id = boi.order_id
LEFT JOIN products p ON boi.product_id::uuid = p.id
WHERE p.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
ORDER BY bo.created_at DESC;

-- Step 3: Check seller_add_item_preloved
SELECT 'Orders containing preloved items from current seller:' as info;
SELECT DISTINCT
    bo.order_number,
    bo.seller_id as current_seller_id,
    boi.product_id,
    boi.product_name,
    sap.seller_id as product_seller_id,
    bo.created_at,
    CASE 
        WHEN sap.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e' THEN 'MATCH'
        ELSE 'NO_MATCH'
    END as seller_match
FROM buyer_orders bo
JOIN buyer_order_items boi ON bo.id = boi.order_id
LEFT JOIN seller_add_item_preloved sap ON boi.product_id::uuid = sap.id
WHERE sap.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
ORDER BY bo.created_at DESC;

-- Step 4: Check seller_add_barter_item
SELECT 'Orders containing barter items from current seller:' as info;
SELECT DISTINCT
    bo.order_number,
    bo.seller_id as current_seller_id,
    boi.product_id,
    boi.product_name,
    sab.seller_id as product_seller_id,
    bo.created_at,
    CASE 
        WHEN sab.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e' THEN 'MATCH'
        ELSE 'NO_MATCH'
    END as seller_match
FROM buyer_orders bo
JOIN buyer_order_items boi ON bo.id = boi.order_id
LEFT JOIN seller_add_barter_item sab ON boi.product_id::uuid = sab.id
WHERE sab.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
ORDER BY bo.created_at DESC;

-- Step 5: Update orders to have correct seller_id based on product ownership
UPDATE buyer_orders 
SET seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
WHERE id IN (
    SELECT DISTINCT bo.id
    FROM buyer_orders bo
    JOIN buyer_order_items boi ON bo.id = boi.order_id
    LEFT JOIN products p ON boi.product_id::uuid = p.id
    WHERE p.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
    
    UNION
    
    SELECT DISTINCT bo.id
    FROM buyer_orders bo
    JOIN buyer_order_items boi ON bo.id = boi.order_id
    LEFT JOIN seller_add_item_preloved sap ON boi.product_id::uuid = sap.id
    WHERE sap.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
    
    UNION
    
    SELECT DISTINCT bo.id
    FROM buyer_orders bo
    JOIN buyer_order_items boi ON bo.id = boi.order_id
    LEFT JOIN seller_add_barter_item sab ON boi.product_id::uuid = sab.id
    WHERE sab.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
);

-- Step 6: Do the same for orders table
UPDATE orders 
SET seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
WHERE id IN (
    SELECT DISTINCT o.id
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id::uuid = p.id
    WHERE p.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
    
    UNION
    
    SELECT DISTINCT o.id
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN seller_add_item_preloved sap ON oi.product_id::uuid = sap.id
    WHERE sap.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
    
    UNION
    
    SELECT DISTINCT o.id
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN seller_add_barter_item sab ON oi.product_id::uuid = sab.id
    WHERE sab.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
);

-- Step 7: Show final results
SELECT 'Final orders for current seller:' as info;
SELECT 
    'buyer_orders' as table_name,
    order_number,
    seller_id,
    buyer_id,
    status,
    total_amount,
    created_at
FROM buyer_orders 
WHERE seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
ORDER BY created_at DESC;

SELECT 
    'orders' as table_name,
    order_number,
    seller_id,
    buyer_id,
    status,
    total_amount,
    created_at
FROM orders 
WHERE seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
ORDER BY created_at DESC;

SELECT 'Orders fixed based on product ownership!' as status;
