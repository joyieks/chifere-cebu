-- CORRECT SELLER ASSIGNMENT
-- Let's fix this properly by checking which items actually belong to you

-- Step 1: Check what products you actually own
SELECT 'YOUR PRODUCTS:' as info;
SELECT id, name, seller_id FROM products WHERE seller_id = '417258dc-3b1d-4818-9091-d581aa3f6d00';

-- Step 2: Check what order items exist and who they belong to
SELECT 'ORDER ITEMS AND THEIR SELLERS:' as info;
SELECT 
    boi.order_id,
    boi.product_id,
    boi.product_name,
    boi.seller_id as item_seller_id,
    p.seller_id as product_seller_id,
    p.name as product_name_from_products
FROM buyer_order_items boi
LEFT JOIN products p ON boi.product_id::uuid = p.id
ORDER BY boi.order_id;

-- Step 3: Check current orders and their seller_id
SELECT 'CURRENT ORDERS:' as info;
SELECT id, order_number, seller_id, status FROM buyer_orders;

-- Step 4: Fix orders to only show items that belong to you
-- First, let's see which orders have items that belong to you
SELECT 'ORDERS WITH YOUR ITEMS:' as info;
SELECT DISTINCT 
    boi.order_id,
    bo.order_number,
    boi.product_name,
    boi.seller_id
FROM buyer_order_items boi
JOIN buyer_orders bo ON boi.order_id = bo.id
WHERE boi.seller_id = '417258dc-3b1d-4818-9091-d581aa3f6d00'
   OR boi.product_id::uuid IN (
       SELECT id FROM products WHERE seller_id = '417258dc-3b1d-4818-9091-d581aa3f6d00'
   );

-- Step 5: Update orders to only show your items
-- Remove seller_id from orders that don't have your items
UPDATE buyer_orders 
SET seller_id = NULL
WHERE id NOT IN (
    SELECT DISTINCT boi.order_id
    FROM buyer_order_items boi
    WHERE boi.seller_id = '417258dc-3b1d-4818-9091-d581aa3f6d00'
       OR boi.product_id::uuid IN (
           SELECT id FROM products WHERE seller_id = '417258dc-3b1d-4818-9091-d581aa3f6d00'
       )
);

-- Step 6: Assign your seller_id only to orders with your items
UPDATE buyer_orders 
SET seller_id = '417258dc-3b1d-4818-9091-d581aa3f6d00'::uuid
WHERE id IN (
    SELECT DISTINCT boi.order_id
    FROM buyer_order_items boi
    WHERE boi.seller_id = '417258dc-3b1d-4818-9091-d581aa3f6d00'
       OR boi.product_id::uuid IN (
           SELECT id FROM products WHERE seller_id = '417258dc-3b1d-4818-9091-d581aa3f6d00'
       )
);

-- Step 7: Show final results
SELECT 'FINAL ORDERS FOR YOU:' as info;
SELECT 
    bo.id,
    bo.order_number,
    bo.seller_id,
    bo.status,
    boi.product_name,
    boi.seller_id as item_seller_id
FROM buyer_orders bo
LEFT JOIN buyer_order_items boi ON bo.id = boi.order_id
WHERE bo.seller_id = '417258dc-3b1d-4818-9091-d581aa3f6d00'
ORDER BY bo.created_at DESC;

SELECT 'ORDERS NOT FOR YOU (should be NULL seller_id):' as info;
SELECT 
    bo.id,
    bo.order_number,
    bo.seller_id,
    bo.status,
    boi.product_name,
    boi.seller_id as item_seller_id
FROM buyer_orders bo
LEFT JOIN buyer_order_items boi ON bo.id = boi.order_id
WHERE bo.seller_id IS NULL
ORDER BY bo.created_at DESC;
