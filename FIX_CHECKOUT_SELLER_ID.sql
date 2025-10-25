-- FIX CHECKOUT SELLER_ID ISSUE
-- This will fix the seller_id problem in the checkout process

-- Step 1: Show current problematic orders
SELECT '=== ORDERS WITH ZERO UUID SELLER_ID ===' as info;
SELECT 
    id,
    order_number,
    buyer_id,
    seller_id,
    status,
    total_amount,
    created_at
FROM buyer_orders
WHERE seller_id = '00000000-0000-0000-0000-000000000000'::uuid
ORDER BY created_at DESC;

-- Step 2: Fix order items first - get seller_id from products
UPDATE buyer_order_items 
SET seller_id = (
    SELECT p.seller_id::text
    FROM products p
    WHERE p.id = buyer_order_items.product_id
    AND p.seller_id IS NOT NULL
)
WHERE (seller_id IS NULL OR seller_id = '' OR seller_id = '00000000-0000-0000-0000-000000000000')
AND EXISTS (
    SELECT 1 
    FROM products p
    WHERE p.id = buyer_order_items.product_id
    AND p.seller_id IS NOT NULL
);

-- Step 3: Fix orders - get seller_id from order items
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
WHERE seller_id = '00000000-0000-0000-0000-000000000000'::uuid
AND EXISTS (
    SELECT 1 
    FROM buyer_order_items boi
    WHERE boi.order_id = buyer_orders.id
    AND boi.seller_id IS NOT NULL
    AND boi.seller_id != ''
    AND boi.seller_id != '00000000-0000-0000-0000-000000000000'
);

-- Step 4: Show results after fix
SELECT '=== ORDERS AFTER FIX ===' as info;
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

-- Step 6: Show order items with seller_id
SELECT '=== ORDER ITEMS WITH SELLER_ID ===' as info;
SELECT 
    order_id,
    product_id,
    seller_id,
    product_name,
    quantity,
    total_price
FROM buyer_order_items
WHERE seller_id IS NOT NULL
AND seller_id != ''
AND seller_id != '00000000-0000-0000-0000-000000000000'
ORDER BY created_at DESC;

SELECT '=== CHECKOUT SELLER_ID FIX COMPLETE ===' as status;
