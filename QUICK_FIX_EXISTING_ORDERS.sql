-- QUICK FIX FOR EXISTING ORDERS
-- Based on the screenshots, you have 3 orders that need seller_id fixed

-- Step 1: Check the current seller_id values in your existing orders
SELECT '=== CURRENT SELLER_ID VALUES ===' as info;

SELECT 
    id,
    order_number,
    buyer_id,
    seller_id,
    status,
    total_amount,
    created_at
FROM buyer_orders 
ORDER BY created_at DESC;

-- Step 2: Check what seller_ids exist in buyer_order_items for these orders
SELECT '=== SELLER_IDs IN ORDER ITEMS ===' as info;

SELECT 
    boi.order_id,
    boi.seller_id,
    boi.product_name,
    boi.quantity,
    boi.total_price
FROM buyer_order_items boi
WHERE boi.order_id IN (
    '7018e3aa-78d3-4fba-a2f6-b9fe4388e7b3',
    'f215255e-e184-4515-8ed0-822adea15da4', 
    'f6795a78-5fc7-4b24-a66f-5c12b4042b03'
)
ORDER BY boi.order_id;

-- Step 3: Fix the seller_id for each order
SELECT '=== FIXING SELLER_ID FOR EACH ORDER ===' as info;

-- Fix order 1: 7018e3aa-78d3-4fba-a2f6-b9fe4388e7b3
UPDATE buyer_orders 
SET seller_id = (
    SELECT DISTINCT boi.seller_id::uuid
    FROM buyer_order_items boi 
    WHERE boi.order_id = '7018e3aa-78d3-4fba-a2f6-b9fe4388e7b3'
    AND boi.seller_id IS NOT NULL
    LIMIT 1
)
WHERE id = '7018e3aa-78d3-4fba-a2f6-b9fe4388e7b3'
AND seller_id IS NULL;

-- Fix order 2: f215255e-e184-4515-8ed0-822adea15da4
UPDATE buyer_orders 
SET seller_id = (
    SELECT DISTINCT boi.seller_id::uuid
    FROM buyer_order_items boi 
    WHERE boi.order_id = 'f215255e-e184-4515-8ed0-822adea15da4'
    AND boi.seller_id IS NOT NULL
    LIMIT 1
)
WHERE id = 'f215255e-e184-4515-8ed0-822adea15da4'
AND seller_id IS NULL;

-- Fix order 3: f6795a78-5fc7-4b24-a66f-5c12b4042b03
UPDATE buyer_orders 
SET seller_id = (
    SELECT DISTINCT boi.seller_id::uuid
    FROM buyer_order_items boi 
    WHERE boi.order_id = 'f6795a78-5fc7-4b24-a66f-5c12b4042b03'
    AND boi.seller_id IS NOT NULL
    LIMIT 1
)
WHERE id = 'f6795a78-5fc7-4b24-a66f-5c12b4042b03'
AND seller_id IS NULL;

-- Step 4: Show the results after fix
SELECT '=== RESULTS AFTER FIX ===' as info;

SELECT 
    id,
    order_number,
    buyer_id,
    seller_id,
    status,
    total_amount,
    created_at
FROM buyer_orders 
ORDER BY created_at DESC;

-- Step 5: Show orders grouped by seller
SELECT '=== ORDERS BY SELLER ===' as info;

SELECT 
    seller_id,
    COUNT(*) as order_count,
    SUM(total_amount) as total_sales
FROM buyer_orders 
WHERE seller_id IS NOT NULL
GROUP BY seller_id
ORDER BY order_count DESC;

SELECT '=== QUICK FIX COMPLETE ===' as status;
