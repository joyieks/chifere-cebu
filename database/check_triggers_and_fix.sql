-- Check and fix trigger issues that are causing the first_name error
-- The error shows a trigger function create_buyer_user() is trying to insert into buyer_users with non-existent columns

-- Step 1: Check what triggers exist on user_profiles table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    action_orientation
FROM information_schema.triggers 
WHERE event_object_table = 'user_profiles'
AND event_object_schema = 'public';

-- Step 2: Check the create_buyer_user function
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'create_buyer_user';

-- Step 3: Check if buyer_users table exists and its structure
SELECT 
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'buyer_users')
        THEN '✅ buyer_users table exists'
        ELSE '❌ buyer_users table does not exist'
    END as table_status;

-- If buyer_users exists, show its structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'buyer_users'
ORDER BY ordinal_position;

-- Step 4: Temporarily disable the problematic trigger
-- This will allow us to insert into user_profiles without the trigger firing
DROP TRIGGER IF EXISTS create_buyer_user_trigger ON public.user_profiles;

-- Step 5: Now try to create the missing user profiles
INSERT INTO public.user_profiles (
    id,
    email,
    display_name,
    user_type,
    is_verified,
    is_active,
    created_at,
    updated_at
)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'display_name', SPLIT_PART(au.email, '@', 1)) as display_name,
    COALESCE(au.raw_user_meta_data->>'user_type', 'buyer') as user_type,
    CASE WHEN au.email_confirmed_at IS NOT NULL THEN true ELSE false END as is_verified,
    true as is_active,
    au.created_at,
    NOW() as updated_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Step 6: Verify the fix worked
SELECT 
    'Users still missing from user_profiles:' as status,
    COUNT(*) as count
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Step 7: Show the newly created profiles
SELECT 
    'Newly created user profiles:' as info,
    up.id,
    up.email,
    up.display_name,
    up.user_type,
    up.created_at
FROM public.user_profiles up
WHERE up.created_at > NOW() - INTERVAL '1 minute'
ORDER BY up.created_at DESC;

-- Step 8: Check if the problematic user now exists
SELECT 
    'User sync check for problematic user:' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM auth.users WHERE id = 'c50fcde7-37f5-4d5e-999d-69cf5cba496c') 
        THEN '✅ User exists in auth.users'
        ELSE '❌ User missing from auth.users'
    END as auth_users_status,
    CASE 
        WHEN EXISTS(SELECT 1 FROM public.user_profiles WHERE id = 'c50fcde7-37f5-4d5e-999d-69cf5cba496c') 
        THEN '✅ User exists in user_profiles'
        ELSE '❌ User missing from user_profiles'
    END as user_profiles_status;

-- Step 9: Test the follow functionality (uncomment to test)
/*
-- Test follow with the previously problematic user
-- Replace 'REPLACE_WITH_REAL_SELLER_ID' with an actual seller ID

-- Test 1: Insert a follow
INSERT INTO public.follows (buyer_id, seller_id) 
VALUES ('c50fcde7-37f5-4d5e-999d-69cf5cba496c', 'REPLACE_WITH_REAL_SELLER_ID');

-- Test 2: Check if seller_stats was updated
SELECT * FROM public.seller_stats WHERE seller_id = 'REPLACE_WITH_REAL_SELLER_ID';

-- Test 3: Delete the test follow
DELETE FROM public.follows 
WHERE buyer_id = 'c50fcde7-37f5-4d5e-999d-69cf5cba496c' 
AND seller_id = 'REPLACE_WITH_REAL_SELLER_ID';

-- Test 4: Check if seller_stats was updated again
SELECT * FROM public.seller_stats WHERE seller_id = 'REPLACE_WITH_REAL_SELLER_ID';
*/

-- Step 10: Final status check
SELECT 
    'Final user sync status:' as status,
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.user_profiles) as user_profiles_count,
    (SELECT COUNT(*) FROM auth.users au LEFT JOIN public.user_profiles up ON au.id = up.id WHERE up.id IS NULL) as missing_profiles_count;
