-- Find seller users in the system
-- This script helps identify which users are sellers

-- Option 1: Check all users and their metadata
SELECT 
    id, 
    email, 
    raw_user_meta_data,
    user_metadata,
    created_at
FROM auth.users 
ORDER BY created_at;

-- Option 2: If you have a profiles table, check there
-- Uncomment and run this if you have a user_profiles table
-- SELECT 
--     id, 
--     email, 
--     role, 
--     user_type, 
--     created_at
-- FROM public.user_profiles 
-- ORDER BY created_at;

-- Option 3: Check what seller IDs are currently in orders
SELECT DISTINCT 
    seller_id, 
    COUNT(*) as order_count
FROM buyer_orders 
WHERE seller_id IS NOT NULL
GROUP BY seller_id
ORDER BY order_count DESC;

-- Option 4: Simple approach - just get all user IDs
-- You can manually identify which one is the seller
SELECT id, email, created_at
FROM auth.users 
ORDER BY created_at;
