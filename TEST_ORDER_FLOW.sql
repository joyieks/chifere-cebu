-- TEST ORDER FLOW
-- This script will test if the order flow is working correctly

-- Step 1: Check if there are any products with sellers
SELECT '=== PRODUCTS WITH SELLERS ===' as info;
SELECT 
    id,
    name,
    seller_id,
    price,
    status
FROM products
WHERE seller_id IS NOT NULL
LIMIT 10;

-- Step 2: Check if there are any users who are sellers
SELECT '=== SELLER USERS ===' as info;
SELECT 
    id,
    email,
    user_type,
    seller_status,
    business_name
FROM user_profiles
WHERE user_type = 'seller' OR seller_status IS NOT NULL
LIMIT 10;

-- Step 3: Check if there are any buyers
SELECT '=== BUYER USERS ===' as info;
SELECT 
    id,
    email,
    user_type
FROM user_profiles
WHERE user_type = 'buyer'
LIMIT 10;

-- Step 4: Test cart functionality
SELECT '=== CART ITEMS TEST ===' as info;
SELECT 
    user_id,
    product_id,
    seller_id,
    product_name,
    quantity
FROM buyer_add_to_cart
LIMIT 10;

-- Step 5: Test order creation
SELECT '=== RECENT ORDERS ===' as info;
SELECT 
    bo.id,
    bo.order_number,
    bo.buyer_id,
    bo.seller_id,
    bo.status,
    bo.total_amount,
    bo.created_at,
    COUNT(boi.id) as item_count
FROM buyer_orders bo
LEFT JOIN buyer_order_items boi ON bo.id = boi.order_id
GROUP BY bo.id, bo.order_number, bo.buyer_id, bo.seller_id, bo.status, bo.total_amount, bo.created_at
ORDER BY bo.created_at DESC
LIMIT 10;

-- Step 6: Test order items
SELECT '=== ORDER ITEMS TEST ===' as info;
SELECT 
    boi.order_id,
    boi.product_id,
    boi.seller_id,
    boi.product_name,
    boi.quantity,
    boi.total_price
FROM buyer_order_items boi
ORDER BY boi.created_at DESC
LIMIT 10;

-- Step 7: Check for any NULL seller_ids
SELECT '=== NULL SELLER_ID CHECK ===' as info;

SELECT 'Orders with NULL seller_id:' as info;
SELECT COUNT(*) as count FROM buyer_orders WHERE seller_id IS NULL;

SELECT 'Order items with NULL/empty seller_id:' as info;
SELECT COUNT(*) as count FROM buyer_order_items WHERE seller_id IS NULL OR seller_id = '';

SELECT 'Cart items with NULL/empty seller_id:' as info;
SELECT COUNT(*) as count FROM buyer_add_to_cart WHERE seller_id IS NULL OR seller_id = '';

SELECT '=== TEST COMPLETE ===' as status;
