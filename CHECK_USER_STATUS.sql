-- Check current user status in both tables
-- This will help us understand the current state

-- Check user_profiles table
SELECT 
    'user_profiles' as table_name,
    id,
    email,
    display_name,
    business_name,
    is_active,
    disabled_at,
    disabled_reason,
    created_at
FROM user_profiles 
ORDER BY created_at DESC
LIMIT 10;

-- Check buyer_users table
SELECT 
    'buyer_users' as table_name,
    id,
    email,
    display_name,
    is_active,
    disabled_at,
    disabled_reason,
    created_at
FROM buyer_users 
ORDER BY created_at DESC
LIMIT 10;

-- Check if there are any users with is_active = false
SELECT 
    'Disabled users in user_profiles' as info,
    COUNT(*) as count
FROM user_profiles 
WHERE is_active = false;

SELECT 
    'Disabled users in buyer_users' as info,
    COUNT(*) as count
FROM buyer_users 
WHERE is_active = false;

-- Check if there are any users with is_active = null
SELECT 
    'Users with null is_active in user_profiles' as info,
    COUNT(*) as count
FROM user_profiles 
WHERE is_active IS NULL;

SELECT 
    'Users with null is_active in buyer_users' as info,
    COUNT(*) as count
FROM buyer_users 
WHERE is_active IS NULL;
