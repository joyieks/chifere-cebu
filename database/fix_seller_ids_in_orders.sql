-- Fix seller IDs in buyer_orders table
-- This script updates all orders to have the correct seller ID instead of the demo seller ID

-- First, let's see what seller IDs we currently have
SELECT 
    seller_id, 
    COUNT(*) as order_count,
    MIN(created_at) as first_order,
    MAX(created_at) as last_order
FROM buyer_orders 
GROUP BY seller_id
ORDER BY order_count DESC;

-- Check if we have any orders with the demo seller ID
SELECT COUNT(*) as demo_seller_orders
FROM buyer_orders 
WHERE seller_id = '00000000-0000-0000-0000-000000000001';

-- Get a list of actual seller users
-- Check the raw_user_meta_data for role information
SELECT 
    id, 
    email, 
    raw_user_meta_data,
    created_at
FROM auth.users 
WHERE 
    raw_user_meta_data->>'role' = 'seller' 
    OR raw_user_meta_data->>'user_type' = 'seller'
ORDER BY created_at;

-- Alternative: If you have a separate profiles table, check there
-- SELECT id, email, role, user_type, created_at
-- FROM public.user_profiles 
-- WHERE role = 'seller' OR user_type = 'seller'
-- ORDER BY created_at;

-- Update orders to use the first available seller ID
-- Replace 'YOUR_ACTUAL_SELLER_ID_HERE' with the actual seller's user ID
-- You can get this from the query above

-- Example update (uncomment and modify with actual seller ID):
-- UPDATE buyer_orders 
-- SET seller_id = 'YOUR_ACTUAL_SELLER_ID_HERE'
-- WHERE seller_id = '00000000-0000-0000-0000-000000000001';

-- Verify the update
SELECT 
    seller_id, 
    COUNT(*) as order_count
FROM buyer_orders 
GROUP BY seller_id
ORDER BY order_count DESC;
