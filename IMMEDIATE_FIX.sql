-- IMMEDIATE FIX - NO MORE PROBLEMS
-- This will fix your orders RIGHT NOW

-- Step 1: Let's see what we have
SELECT 'CURRENT ORDERS:' as info;
SELECT id, order_number, seller_id, status FROM buyer_orders;

-- Step 2: Let's see what order items we have
SELECT 'ORDER ITEMS:' as info;
SELECT order_id, seller_id, product_name FROM buyer_order_items;

-- Step 3: FIX ALL ORDERS AT ONCE - NO EXCEPTIONS
UPDATE buyer_orders 
SET seller_id = (
    SELECT boi.seller_id::uuid
    FROM buyer_order_items boi 
    WHERE boi.order_id = buyer_orders.id 
    AND boi.seller_id IS NOT NULL
    LIMIT 1
)
WHERE seller_id IS NULL OR seller_id = '00000000-0000-0000-0000-000000000000';

-- Step 4: Show the results
SELECT 'FIXED ORDERS:' as info;
SELECT id, order_number, seller_id, status FROM buyer_orders;

-- Step 5: Show which seller has which orders
SELECT 'ORDERS BY SELLER:' as info;
SELECT 
    seller_id,
    COUNT(*) as order_count,
    STRING_AGG(order_number, ', ') as order_numbers
FROM buyer_orders 
WHERE seller_id IS NOT NULL
GROUP BY seller_id;

SELECT 'DONE! ORDERS ARE FIXED!' as status;
