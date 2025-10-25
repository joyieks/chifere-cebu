-- DEBUG USER METADATA ISSUE
-- This script will help identify why a buyer is being treated as a seller

-- Step 1: Check if the user exists in both tables
SELECT 
    'user_profiles' as table_name,
    id,
    email,
    user_type,
    seller_status,
    is_active,
    created_at
FROM public.user_profiles
WHERE email = 'godol70865@haotuwu.com'
UNION ALL
SELECT 
    'buyer_users' as table_name,
    id,
    email,
    user_type,
    NULL as seller_status,
    is_active,
    created_at
FROM public.buyer_users
WHERE email = 'godol70865@haotuwu.com';

-- Step 2: Check auth.users table (if accessible)
-- Note: This might not be accessible depending on RLS policies
-- SELECT 
--     'auth.users' as table_name,
--     id,
--     email,
--     raw_user_meta_data
-- FROM auth.users
-- WHERE email = 'godol70865@haotuwu.com';

-- Step 3: Show the issue
SELECT 'ISSUE: User might exist in both tables or have wrong user_type in metadata!' as diagnosis;

-- Step 4: Check for duplicate users
SELECT 
    'Duplicate check' as check_type,
    email,
    COUNT(*) as count,
    STRING_AGG(table_name, ', ') as tables
FROM (
    SELECT email, 'user_profiles' as table_name FROM public.user_profiles WHERE email = 'godol70865@haotuwu.com'
    UNION ALL
    SELECT email, 'buyer_users' as table_name FROM public.buyer_users WHERE email = 'godol70865@haotuwu.com'
) as all_users
GROUP BY email
HAVING COUNT(*) > 1;
