-- FIX ORDER SELLER_ID FLOW
-- This script will fix the entire order flow to ensure seller_id is properly set

-- Step 1: Check current state of cart items
SELECT '=== CURRENT CART ITEMS ===' as info;
SELECT 
    user_id,
    product_id,
    seller_id,
    product_name,
    quantity
FROM buyer_add_to_cart
WHERE seller_id IS NOT NULL AND seller_id != '';

-- Step 2: Check current state of orders
SELECT '=== CURRENT ORDERS ===' as info;
SELECT 
    id,
    order_number,
    buyer_id,
    seller_id,
    status,
    created_at
FROM buyer_orders
ORDER BY created_at DESC;

-- Step 3: Check current state of order items
SELECT '=== CURRENT ORDER ITEMS ===' as info;
SELECT 
    order_id,
    product_id,
    seller_id,
    product_name,
    quantity
FROM buyer_order_items
ORDER BY created_at DESC;

-- Step 4: Fix cart items that have empty seller_id
-- Get seller_id from products table
UPDATE buyer_add_to_cart 
SET seller_id = (
    SELECT p.seller_id::text
    FROM products p
    WHERE p.id::text = buyer_add_to_cart.product_id
    AND p.seller_id IS NOT NULL
)
WHERE (seller_id IS NULL OR seller_id = '')
AND EXISTS (
    SELECT 1 
    FROM products p
    WHERE p.id::text = buyer_add_to_cart.product_id
    AND p.seller_id IS NOT NULL
);

-- Step 5: Fix order items that have empty seller_id
UPDATE buyer_order_items 
SET seller_id = (
    SELECT p.seller_id::text
    FROM products p
    WHERE p.id = buyer_order_items.product_id
    AND p.seller_id IS NOT NULL
)
WHERE (seller_id IS NULL OR seller_id = '')
AND EXISTS (
    SELECT 1 
    FROM products p
    WHERE p.id = buyer_order_items.product_id
    AND p.seller_id IS NOT NULL
);

-- Step 6: Fix orders that have NULL seller_id
UPDATE buyer_orders 
SET seller_id = (
    SELECT DISTINCT boi.seller_id::uuid
    FROM buyer_order_items boi
    WHERE boi.order_id = buyer_orders.id
    AND boi.seller_id IS NOT NULL
    AND boi.seller_id != ''
    LIMIT 1
)
WHERE seller_id IS NULL
AND EXISTS (
    SELECT 1 
    FROM buyer_order_items boi
    WHERE boi.order_id = buyer_orders.id
    AND boi.seller_id IS NOT NULL
    AND boi.seller_id != ''
);

-- Step 7: Show results after fix
SELECT '=== RESULTS AFTER FIX ===' as info;

SELECT 'Cart items with seller_id:' as info;
SELECT 
    user_id,
    product_id,
    seller_id,
    product_name
FROM buyer_add_to_cart
WHERE seller_id IS NOT NULL AND seller_id != ''
ORDER BY user_id;

SELECT 'Orders with seller_id:' as info;
SELECT 
    id,
    order_number,
    buyer_id,
    seller_id,
    status
FROM buyer_orders
WHERE seller_id IS NOT NULL
ORDER BY created_at DESC;

SELECT 'Order items with seller_id:' as info;
SELECT 
    order_id,
    product_id,
    seller_id,
    product_name
FROM buyer_order_items
WHERE seller_id IS NOT NULL AND seller_id != ''
ORDER BY created_at DESC;

-- Step 8: Show orders by seller
SELECT '=== ORDERS BY SELLER ===' as info;
SELECT 
    seller_id,
    COUNT(*) as order_count,
    STRING_AGG(order_number, ', ') as order_numbers
FROM buyer_orders 
WHERE seller_id IS NOT NULL
GROUP BY seller_id
ORDER BY order_count DESC;

SELECT '=== FIX COMPLETE ===' as status;
