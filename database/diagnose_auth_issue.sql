-- Diagnose the authentication issue
-- The user d7f43ccd-3576-43e3-ac94-ec60c7674df9 doesn't exist in auth.users at all

-- Step 1: Check if the user exists in auth.users
SELECT 
    'User exists in auth.users:' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM auth.users WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9') 
        THEN 'YES'
        ELSE 'NO - This is the problem!'
    END as result;

-- Step 2: Show all users in auth.users
SELECT 
    'All users in auth.users:' as info,
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
ORDER BY created_at DESC;

-- Step 3: Check if the user exists in user_profiles
SELECT 
    'User exists in user_profiles:' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM public.user_profiles WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9') 
        THEN 'YES'
        ELSE 'NO'
    END as result;

-- Step 4: Show all users in user_profiles
SELECT 
    'All users in user_profiles:' as info,
    id,
    email,
    display_name,
    user_type,
    created_at
FROM public.user_profiles 
ORDER BY created_at DESC;

-- Step 5: Check the foreign key constraint on user_profiles
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    ccu.table_schema AS foreign_schema_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'user_profiles'
    AND kcu.column_name = 'id';

-- Step 6: Check what user is currently authenticated in the frontend
-- This will help us understand what user ID the frontend is trying to use
SELECT 
    'Current authenticated user:' as check_type,
    auth.uid() as current_user_id;

-- Step 7: Check if there are any users with similar IDs or emails
-- Maybe there's a typo or the user ID is being generated incorrectly
SELECT 
    'Users with similar IDs:' as info,
    id,
    email,
    created_at
FROM auth.users 
WHERE id::text LIKE '%d7f43ccd%' 
OR id::text LIKE '%3576%'
OR id::text LIKE '%43e3%'
OR id::text LIKE '%ac94%'
OR id::text LIKE '%ec60c7674df9%';

-- Step 8: Check if there are any users with similar email patterns
-- Maybe the user exists but with a different ID
SELECT 
    'Recent users in auth.users:' as info,
    id,
    email,
    created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

-- Step 9: Check if the user might exist in a different table
-- Maybe there's a buyer_users table or similar
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema IN ('public', 'auth')
AND (table_name LIKE '%user%' OR table_name LIKE '%buyer%')
ORDER BY table_schema, table_name;

-- Step 10: Summary of the issue
SELECT 
    'ISSUE SUMMARY:' as status,
    'The user d7f43ccd-3576-43e3-ac94-ec60c7674df9 does not exist in auth.users' as problem,
    'This means the frontend is using an invalid user ID' as cause,
    'We need to check the authentication system' as solution;
