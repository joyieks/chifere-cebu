-- Diagnose the foreign key constraint issue with follows table
-- The error indicates the buyer_id doesn't exist in auth.users table

-- Step 1: Check what buyer_id is being used (from the error log)
-- The error shows buyer_id: 'd7f43ccd-3576-43e3-ac94-ec60c7674df9'
SELECT 'Checking if buyer exists in auth.users' as step;

-- Step 2: Check if this specific buyer exists in auth.users
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    CASE 
        WHEN id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9' THEN '✅ This is the buyer from error log'
        ELSE 'Other user'
    END as status
FROM auth.users 
WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9';

-- Step 3: Check if this buyer exists in user_profiles table
SELECT 
    id,
    display_name,
    email,
    user_type,
    CASE 
        WHEN id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9' THEN '✅ This buyer exists in user_profiles'
        ELSE 'Other user'
    END as status
FROM public.user_profiles 
WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9';

-- Step 4: Check all users in auth.users table
SELECT 
    'Total users in auth.users' as description,
    COUNT(*) as count
FROM auth.users;

-- Step 5: Check all users in user_profiles table
SELECT 
    'Total users in user_profiles' as description,
    COUNT(*) as count
FROM public.user_profiles;

-- Step 6: Find users that exist in user_profiles but NOT in auth.users
SELECT 
    up.id,
    up.display_name,
    up.email,
    up.user_type,
    '❌ Missing from auth.users' as issue
FROM public.user_profiles up
LEFT JOIN auth.users au ON up.id = au.id
WHERE au.id IS NULL
LIMIT 10;

-- Step 7: Find users that exist in auth.users but NOT in user_profiles
SELECT 
    au.id,
    au.email,
    au.created_at,
    '❌ Missing from user_profiles' as issue
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL
LIMIT 10;

-- Step 8: Check the foreign key constraint definition
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'follows'
    AND kcu.column_name = 'buyer_id';

-- Step 9: Check current user authentication (if you're logged in)
-- This will show which user is currently authenticated
SELECT 
    'Current authenticated user' as description,
    auth.uid() as current_user_id;

-- Step 10: Test with a known good user ID (replace with a real user ID from your system)
/*
-- Uncomment and replace with a real user ID that exists in both tables
SELECT 
    'Testing with known good user' as test,
    au.id as auth_user_id,
    up.id as profile_user_id,
    up.display_name,
    up.user_type
FROM auth.users au
JOIN public.user_profiles up ON au.id = up.id
WHERE au.id = 'REPLACE_WITH_REAL_USER_ID'
LIMIT 1;
*/
