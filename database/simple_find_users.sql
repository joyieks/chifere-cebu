-- Simple script to find all users and identify the seller
-- This avoids column errors by only using basic columns

-- Get all users (this should work without errors)
SELECT 
    id, 
    email, 
    created_at
FROM auth.users 
ORDER BY created_at;

-- Check what seller IDs are currently in orders
SELECT DISTINCT 
    seller_id, 
    COUNT(*) as order_count
FROM buyer_orders 
WHERE seller_id IS NOT NULL
GROUP BY seller_id
ORDER BY order_count DESC;

-- Check how many orders have the demo seller ID
SELECT COUNT(*) as demo_seller_orders
FROM buyer_orders 
WHERE seller_id = '00000000-0000-0000-0000-000000000001';
