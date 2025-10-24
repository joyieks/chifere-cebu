-- Update all orders to use the current seller's ID
-- The current seller ID from the logs is: 126fa7e4-1b27-4818-8915-0fb479ee1553

-- Step 1: Check current seller IDs in orders
SELECT 
    seller_id, 
    COUNT(*) as order_count
FROM buyer_orders 
GROUP BY seller_id
ORDER BY order_count DESC;

-- Step 2: Update all orders to use the current seller's ID
UPDATE buyer_orders 
SET seller_id = '126fa7e4-1b27-4818-8915-0fb479ee1553'
WHERE seller_id IS NOT NULL;

-- Step 3: Update all order items to use the current seller's ID
UPDATE buyer_order_items 
SET seller_id = '126fa7e4-1b27-4818-8915-0fb479ee1553'
WHERE seller_id IS NOT NULL;

-- Step 4: Verify the update
SELECT 
    seller_id, 
    COUNT(*) as order_count
FROM buyer_orders 
GROUP BY seller_id
ORDER BY order_count DESC;

-- Step 5: Check order items
SELECT 
    seller_id, 
    COUNT(*) as item_count
FROM buyer_order_items 
GROUP BY seller_id
ORDER BY item_count DESC;

-- Step 6: Check total orders for the current seller
SELECT COUNT(*) as total_orders_for_current_seller
FROM buyer_orders 
WHERE seller_id = '126fa7e4-1b27-4818-8915-0fb479ee1553';
