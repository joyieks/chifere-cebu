-- Update seller IDs in buyer_orders table
-- Run this AFTER you've identified the correct seller user ID

-- Step 1: Check current seller IDs in orders
SELECT 
    seller_id, 
    COUNT(*) as order_count,
    MIN(created_at) as first_order,
    MAX(created_at) as last_order
FROM buyer_orders 
GROUP BY seller_id
ORDER BY order_count DESC;

-- Step 2: Check how many orders have the demo seller ID
SELECT COUNT(*) as demo_seller_orders
FROM buyer_orders 
WHERE seller_id = '00000000-0000-0000-0000-000000000001';

-- Step 3: Get all user IDs to identify the seller
SELECT id, email, created_at
FROM auth.users 
ORDER BY created_at;

-- Step 4: Update orders with the correct seller ID
-- Replace 'YOUR_SELLER_USER_ID_HERE' with the actual seller's user ID from Step 3
-- Uncomment and modify the line below:

-- UPDATE buyer_orders 
-- SET seller_id = 'YOUR_SELLER_USER_ID_HERE'
-- WHERE seller_id = '00000000-0000-0000-0000-000000000001';

-- Step 5: Verify the update worked
-- Run this after the update to confirm:
-- SELECT 
--     seller_id, 
--     COUNT(*) as order_count
-- FROM buyer_orders 
-- GROUP BY seller_id
-- ORDER BY order_count DESC;
