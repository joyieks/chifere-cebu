-- Fix all seller IDs in buyer_orders table
-- Based on the results, we have one real seller: 4e515ace-e853-4f63-badf-34fc62cabdee

-- Step 1: Check current state
SELECT 
    seller_id, 
    COUNT(*) as order_count
FROM buyer_orders 
GROUP BY seller_id
ORDER BY order_count DESC;

-- Step 2: Update NULL seller_ids to the real seller
UPDATE buyer_orders 
SET seller_id = '4e515ace-e853-4f63-badf-34fc62cabdee'
WHERE seller_id IS NULL;

-- Step 3: Update demo seller_ids to the real seller
UPDATE buyer_orders 
SET seller_id = '4e515ace-e853-4f63-badf-34fc62cabdee'
WHERE seller_id = '00000000-0000-0000-0000-000000000001';

-- Step 4: Verify the fix worked
SELECT 
    seller_id, 
    COUNT(*) as order_count
FROM buyer_orders 
GROUP BY seller_id
ORDER BY order_count DESC;

-- Step 5: Check total orders now assigned to the seller
SELECT COUNT(*) as total_orders_for_seller
FROM buyer_orders 
WHERE seller_id = '4e515ace-e853-4f63-badf-34fc62cabdee';
