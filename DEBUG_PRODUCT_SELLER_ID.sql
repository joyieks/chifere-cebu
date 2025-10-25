-- DEBUG PRODUCT SELLER_ID
-- Let's check if products have seller_id and if the checkout is getting it

-- Step 1: Check if products have seller_id
SELECT '=== PRODUCTS WITH SELLER_ID ===' as info;
SELECT 
    id,
    name,
    seller_id,
    price,
    status,
    created_at
FROM products
WHERE seller_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Step 2: Check if products are missing seller_id
SELECT '=== PRODUCTS WITHOUT SELLER_ID ===' as info;
SELECT 
    id,
    name,
    seller_id,
    price,
    status
FROM products
WHERE seller_id IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- Step 3: Check recent orders and their items
SELECT '=== RECENT ORDERS AND ITEMS ===' as info;
SELECT 
    bo.id as order_id,
    bo.order_number,
    bo.seller_id as order_seller_id,
    bo.buyer_id,
    bo.status,
    bo.total_amount,
    bo.created_at,
    boi.id as item_id,
    boi.product_id,
    boi.seller_id as item_seller_id,
    boi.product_name,
    boi.quantity
FROM buyer_orders bo
LEFT JOIN buyer_order_items boi ON bo.id = boi.order_id
ORDER BY bo.created_at DESC
LIMIT 10;

-- Step 4: Check if order items have seller_id
SELECT '=== ORDER ITEMS SELLER_ID STATUS ===' as info;
SELECT 
    CASE 
        WHEN seller_id IS NULL THEN 'NULL'
        WHEN seller_id = '' THEN 'EMPTY_STRING'
        WHEN seller_id = '00000000-0000-0000-0000-000000000000' THEN 'ZERO_UUID'
        ELSE 'HAS_VALUE'
    END as seller_id_status,
    COUNT(*) as count
FROM buyer_order_items
GROUP BY 
    CASE 
        WHEN seller_id IS NULL THEN 'NULL'
        WHEN seller_id = '' THEN 'EMPTY_STRING'
        WHEN seller_id = '00000000-0000-0000-0000-000000000000' THEN 'ZERO_UUID'
        ELSE 'HAS_VALUE'
    END;

-- Step 5: Check if we can match products to order items
SELECT '=== PRODUCT-ORDER_ITEM MATCHING ===' as info;
SELECT 
    boi.id as item_id,
    boi.product_id,
    boi.seller_id as item_seller_id,
    boi.product_name,
    p.id as product_id_from_products,
    p.seller_id as product_seller_id,
    p.name as product_name_from_products,
    CASE 
        WHEN p.id IS NULL THEN 'PRODUCT_NOT_FOUND'
        WHEN p.seller_id IS NULL THEN 'PRODUCT_NO_SELLER_ID'
        WHEN boi.seller_id IS NULL OR boi.seller_id = '' THEN 'ITEM_NO_SELLER_ID'
        WHEN boi.seller_id = p.seller_id::text THEN 'MATCH'
        ELSE 'MISMATCH'
    END as status
FROM buyer_order_items boi
LEFT JOIN products p ON boi.product_id = p.id
ORDER BY boi.created_at DESC
LIMIT 10;
