-- FIX ORDER SELLER_ID ISSUES
-- This script will fix orders where seller_id is NULL or incorrect

-- Step 1: First, let's see what we're working with
SELECT 'Before fixes - Orders with NULL seller_id:' as info;
SELECT 
    'buyer_orders' as table_name,
    COUNT(*) as count
FROM buyer_orders 
WHERE seller_id IS NULL
UNION ALL
SELECT 
    'orders' as table_name,
    COUNT(*) as count
FROM orders 
WHERE seller_id IS NULL;

-- Step 2: Fix buyer_orders table - set seller_id from product
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

-- Step 3: Fix orders table - set seller_id from product
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

-- Step 4: Alternative fix - if products don't have seller_id, try to get from seller_add_item_preloved
UPDATE buyer_orders 
SET seller_id = (
    SELECT sap.seller_id 
    FROM buyer_order_items boi 
    JOIN seller_add_item_preloved sap ON boi.product_id = sap.id 
    WHERE boi.order_id = buyer_orders.id 
    LIMIT 1
)
WHERE seller_id IS NULL 
  AND EXISTS (
      SELECT 1 
      FROM buyer_order_items boi 
      JOIN seller_add_item_preloved sap ON boi.product_id = sap.id 
      WHERE boi.order_id = buyer_orders.id
  );

UPDATE orders 
SET seller_id = (
    SELECT sap.seller_id 
    FROM order_items oi 
    JOIN seller_add_item_preloved sap ON oi.product_id = sap.id 
    WHERE oi.order_id = orders.id 
    LIMIT 1
)
WHERE seller_id IS NULL 
  AND EXISTS (
      SELECT 1 
      FROM order_items oi 
      JOIN seller_add_item_preloved sap ON oi.product_id = sap.id 
      WHERE oi.order_id = orders.id
  );

-- Step 5: Alternative fix - try seller_add_barter_item
UPDATE buyer_orders 
SET seller_id = (
    SELECT sab.seller_id 
    FROM buyer_order_items boi 
    JOIN seller_add_barter_item sab ON boi.product_id = sab.id 
    WHERE boi.order_id = buyer_orders.id 
    LIMIT 1
)
WHERE seller_id IS NULL 
  AND EXISTS (
      SELECT 1 
      FROM buyer_order_items boi 
      JOIN seller_add_barter_item sab ON boi.product_id = sab.id 
      WHERE boi.order_id = buyer_orders.id
  );

UPDATE orders 
SET seller_id = (
    SELECT sab.seller_id 
    FROM order_items oi 
    JOIN seller_add_barter_item sab ON oi.product_id = sab.id 
    WHERE oi.order_id = orders.id 
    LIMIT 1
)
WHERE seller_id IS NULL 
  AND EXISTS (
      SELECT 1 
      FROM order_items oi 
      JOIN seller_add_barter_item sab ON oi.product_id = sab.id 
      WHERE oi.order_id = orders.id
  );

-- Step 6: Show results after fixes
SELECT 'After fixes - Orders with NULL seller_id:' as info;
SELECT 
    'buyer_orders' as table_name,
    COUNT(*) as count
FROM buyer_orders 
WHERE seller_id IS NULL
UNION ALL
SELECT 
    'orders' as table_name,
    COUNT(*) as count
FROM orders 
WHERE seller_id IS NULL;

-- Step 7: Show all orders with their seller_id now
SELECT 'All orders after fixes:' as info;
SELECT 
    'buyer_orders' as table_name,
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
    order_number,
    buyer_id,
    seller_id,
    status,
    total_amount,
    created_at
FROM orders 
ORDER BY created_at DESC;
