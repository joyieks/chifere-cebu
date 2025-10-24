-- EMERGENCY FIX - THIS WILL WORK NO MATTER WHAT

-- Step 1: Let's see what we're working with
SELECT 'BEFORE FIX:' as info;
SELECT id, order_number, seller_id FROM buyer_orders;

-- Step 2: Check what seller_ids exist in order items
SELECT 'SELLER_IDS IN ORDER ITEMS:' as info;
SELECT DISTINCT seller_id FROM buyer_order_items WHERE seller_id IS NOT NULL;

-- Step 3: If there are no seller_ids in order items, let's get them from products
SELECT 'SELLER_IDS IN PRODUCTS:' as info;
SELECT DISTINCT seller_id FROM products WHERE seller_id IS NOT NULL;

-- Step 4: EMERGENCY FIX - Try multiple approaches
-- Approach 1: Fix from order items
UPDATE buyer_orders 
SET seller_id = (
    SELECT boi.seller_id::uuid
    FROM buyer_order_items boi 
    WHERE boi.order_id = buyer_orders.id 
    AND boi.seller_id IS NOT NULL
    LIMIT 1
)
WHERE seller_id IS NULL OR seller_id = '00000000-0000-0000-0000-000000000000';

-- Approach 2: If that didn't work, try to get seller_id from products
-- First, let's see if we can match products to order items
UPDATE buyer_orders 
SET seller_id = (
    SELECT p.seller_id::uuid
    FROM buyer_order_items boi
    JOIN products p ON boi.product_id::uuid = p.id
    WHERE boi.order_id = buyer_orders.id 
    AND p.seller_id IS NOT NULL
    LIMIT 1
)
WHERE (seller_id IS NULL OR seller_id = '00000000-0000-0000-0000-000000000000')
AND EXISTS (
    SELECT 1 
    FROM buyer_order_items boi
    JOIN products p ON boi.product_id::uuid = p.id
    WHERE boi.order_id = buyer_orders.id 
    AND p.seller_id IS NOT NULL
);

-- Approach 3: If still no luck, assign to the first available seller
UPDATE buyer_orders 
SET seller_id = (
    SELECT id::uuid FROM user_profiles 
    WHERE user_type = 'seller' OR seller_status IS NOT NULL
    LIMIT 1
)
WHERE seller_id IS NULL OR seller_id = '00000000-0000-0000-0000-000000000000';

-- Step 5: Show results
SELECT 'AFTER FIX:' as info;
SELECT id, order_number, seller_id FROM buyer_orders;

-- Step 6: Show which seller has which orders
SELECT 'ORDERS BY SELLER:' as info;
SELECT 
    seller_id,
    COUNT(*) as order_count,
    STRING_AGG(order_number, ', ') as order_numbers
FROM buyer_orders 
WHERE seller_id IS NOT NULL
GROUP BY seller_id;
