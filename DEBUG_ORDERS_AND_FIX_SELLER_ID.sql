-- DEBUG ORDERS AND FIX SELLER_ID ISSUES
-- This script will help us find and fix the order visibility issues

-- Step 1: Check what orders exist in both tables
SELECT '=== ALL ORDERS IN buyer_orders TABLE ===' as info;
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

SELECT '=== ALL ORDERS IN orders TABLE ===' as info;
SELECT 
    id,
    order_number,
    buyer_id,
    seller_id,
    status,
    total_amount,
    created_at
FROM orders 
ORDER BY created_at DESC;

-- Step 2: Check what users exist and their roles
SELECT '=== ALL USERS AND THEIR ROLES ===' as info;
SELECT 
    id,
    email,
    user_type,
    seller_status
FROM user_profiles 
ORDER BY created_at DESC;

-- Step 3: Check if orders have valid seller_id references
SELECT '=== ORDERS WITH INVALID SELLER_ID ===' as info;
SELECT 
    'buyer_orders' as table_name,
    id,
    order_number,
    seller_id,
    buyer_id
FROM buyer_orders 
WHERE seller_id IS NULL 
   OR seller_id NOT IN (SELECT id FROM user_profiles WHERE user_type = 'seller');

SELECT 
    'orders' as table_name,
    id,
    order_number,
    seller_id,
    buyer_id
FROM orders 
WHERE seller_id IS NULL 
   OR seller_id NOT IN (SELECT id FROM user_profiles WHERE user_type = 'seller');

-- Step 4: Check order items to see which products belong to which sellers
SELECT '=== ORDER ITEMS AND THEIR PRODUCT SELLERS ===' as info;
SELECT 
    oi.id as order_item_id,
    oi.order_id,
    oi.product_id,
    oi.product_name,
    o.order_number,
    o.seller_id as order_seller_id,
    p.seller_id as product_seller_id,
    CASE 
        WHEN o.seller_id = p.seller_id THEN 'MATCH'
        WHEN o.seller_id IS NULL THEN 'ORDER_SELLER_NULL'
        WHEN p.seller_id IS NULL THEN 'PRODUCT_SELLER_NULL'
        ELSE 'MISMATCH'
    END as seller_match_status
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
LEFT JOIN products p ON oi.product_id = p.id
ORDER BY o.created_at DESC;

-- Step 5: Check buyer_order_items if they exist
SELECT '=== BUYER ORDER ITEMS AND THEIR PRODUCT SELLERS ===' as info;
SELECT 
    boi.id as order_item_id,
    boi.order_id,
    boi.product_id,
    boi.product_name,
    bo.order_number,
    bo.seller_id as order_seller_id,
    p.seller_id as product_seller_id,
    CASE 
        WHEN bo.seller_id = p.seller_id THEN 'MATCH'
        WHEN bo.seller_id IS NULL THEN 'ORDER_SELLER_NULL'
        WHEN p.seller_id IS NULL THEN 'PRODUCT_SELLER_NULL'
        ELSE 'MISMATCH'
    END as seller_match_status
FROM buyer_order_items boi
JOIN buyer_orders bo ON boi.order_id = bo.id
LEFT JOIN products p ON boi.product_id = p.id
ORDER BY bo.created_at DESC;

-- Step 6: Fix orders where seller_id is NULL by setting it from the product
UPDATE orders 
SET seller_id = (
    SELECT p.seller_id 
    FROM order_items oi 
    JOIN products p ON oi.product_id = p.id 
    WHERE oi.order_id = orders.id 
    LIMIT 1
)
WHERE seller_id IS NULL 
  AND EXISTS (
      SELECT 1 
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id 
      WHERE oi.order_id = orders.id
  );

-- Step 7: Fix buyer_orders where seller_id is NULL by setting it from the product
UPDATE buyer_orders 
SET seller_id = (
    SELECT p.seller_id 
    FROM buyer_order_items boi 
    JOIN products p ON boi.product_id = p.id 
    WHERE boi.order_id = buyer_orders.id 
    LIMIT 1
)
WHERE seller_id IS NULL 
  AND EXISTS (
      SELECT 1 
      FROM buyer_order_items boi 
      JOIN products p ON boi.product_id = p.id 
      WHERE boi.order_id = buyer_orders.id
  );

-- Step 8: Show the results after fixes
SELECT '=== ORDERS AFTER FIXES ===' as info;
SELECT 
    'buyer_orders' as table_name,
    id,
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
    id,
    order_number,
    buyer_id,
    seller_id,
    status,
    total_amount,
    created_at
FROM orders 
ORDER BY created_at DESC;

-- Step 9: Check if there are any remaining issues
SELECT '=== REMAINING ISSUES ===' as info;
SELECT 
    'buyer_orders' as table_name,
    COUNT(*) as orders_with_null_seller
FROM buyer_orders 
WHERE seller_id IS NULL;

SELECT 
    'orders' as table_name,
    COUNT(*) as orders_with_null_seller
FROM orders 
WHERE seller_id IS NULL;
