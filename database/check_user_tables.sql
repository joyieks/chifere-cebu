-- Check user table structure and data to understand the authentication issue
-- The problem is that the frontend is using a user ID that doesn't exist in auth.users

-- Step 1: Check what user tables exist
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema IN ('public', 'auth')
AND table_name LIKE '%user%'
ORDER BY table_schema, table_name;

-- Step 2: Check the structure of auth.users table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Step 3: Check the structure of public.user_profiles table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Step 4: Check if buyer_users table exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'buyer_users'
ORDER BY ordinal_position;

-- Step 5: Count users in each table
SELECT 
    'auth.users' as table_name,
    COUNT(*) as user_count
FROM auth.users
UNION ALL
SELECT 
    'public.user_profiles' as table_name,
    COUNT(*) as user_count
FROM public.user_profiles
UNION ALL
SELECT 
    'public.buyer_users' as table_name,
    COUNT(*) as user_count
FROM public.buyer_users;

-- Step 6: Check the problematic user ID from the error log
-- buyer_id: 'd7f43ccd-3576-43e3-ac94-ec60c7674df9'
SELECT 
    'Checking problematic user ID:' as check_type,
    'd7f43ccd-3576-43e3-ac94-ec60c7674df9' as user_id;

-- Check if this ID exists in auth.users
SELECT 
    CASE 
        WHEN EXISTS(SELECT 1 FROM auth.users WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9') 
        THEN '✅ User exists in auth.users'
        ELSE '❌ User missing from auth.users'
    END as auth_users_status;

-- Check if this ID exists in user_profiles
SELECT 
    CASE 
        WHEN EXISTS(SELECT 1 FROM public.user_profiles WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9') 
        THEN '✅ User exists in user_profiles'
        ELSE '❌ User missing from user_profiles'
    END as user_profiles_status;

-- Check if this ID exists in buyer_users
SELECT 
    CASE 
        WHEN EXISTS(SELECT 1 FROM public.buyer_users WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9') 
        THEN '✅ User exists in buyer_users'
        ELSE '❌ User missing from buyer_users'
    END as buyer_users_status;

-- Step 7: Show sample users from each table
SELECT 
    'Sample from auth.users:' as table_info,
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 3;

SELECT 
    'Sample from user_profiles:' as table_info,
    id,
    email,
    display_name,
    user_type,
    created_at
FROM public.user_profiles
ORDER BY created_at DESC
LIMIT 3;

SELECT 
    'Sample from buyer_users:' as table_info,
    id,
    email,
    display_name,
    created_at
FROM public.buyer_users
ORDER BY created_at DESC
LIMIT 3;

-- Step 8: Find users that exist in user_profiles but not in auth.users
SELECT 
    'Users in user_profiles but not in auth.users:' as issue,
    up.id,
    up.email,
    up.display_name,
    up.user_type
FROM public.user_profiles up
LEFT JOIN auth.users au ON up.id = au.id
WHERE au.id IS NULL
LIMIT 5;

-- Step 9: Find users that exist in auth.users but not in user_profiles
SELECT 
    'Users in auth.users but not in user_profiles:' as issue,
    au.id,
    au.email,
    au.created_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL
LIMIT 5;
