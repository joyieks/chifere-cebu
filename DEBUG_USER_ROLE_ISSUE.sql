-- DEBUG USER ROLE ISSUE
-- This script will help identify why a buyer account is showing seller application review

-- Step 1: Check all users and their roles/statuses
SELECT 
    'All Users' as table_name,
    id,
    email,
    user_type,
    seller_status,
    is_active,
    created_at
FROM public.user_profiles
UNION ALL
SELECT 
    'Buyer Users' as table_name,
    id,
    email,
    user_type,
    NULL as seller_status,
    is_active,
    created_at
FROM public.buyer_users
ORDER BY email, table_name;

-- Step 2: Check for users with conflicting data
SELECT 
    'Conflicting Users' as issue,
    email,
    user_type,
    seller_status,
    'Has seller_status but is buyer' as problem
FROM public.user_profiles
WHERE user_type = 'buyer' AND seller_status IS NOT NULL
UNION ALL
SELECT 
    'Conflicting Users' as issue,
    email,
    user_type,
    seller_status,
    'Has seller_status but is buyer' as problem
FROM public.buyer_users
WHERE user_type = 'buyer' AND seller_status IS NOT NULL;

-- Step 3: Check specific user by email (replace with actual email)
-- SELECT 
--     'Specific User Check' as check_type,
--     id,
--     email,
--     user_type,
--     seller_status,
--     is_active,
--     created_at
-- FROM public.user_profiles
-- WHERE email = 'godol70865@haotuwu.com'
-- UNION ALL
-- SELECT 
--     'Specific User Check' as check_type,
--     id,
--     email,
--     user_type,
--     NULL as seller_status,
--     is_active,
--     created_at
-- FROM public.buyer_users
-- WHERE email = 'godol70865@haotuwu.com';

-- Step 4: Show the issue
SELECT 'ISSUE IDENTIFIED: Buyer accounts should not have seller_status set!' as diagnosis;
