-- Fix missing user profiles for users that exist in auth.users but not in user_profiles
-- This will resolve the foreign key constraint violation in the follows table

-- Step 1: Check the current situation
SELECT 
    'Users missing from user_profiles:' as status,
    COUNT(*) as count
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Step 2: Create missing user profiles for users in auth.users
-- This will create user_profiles entries for users that exist in auth.users but not in user_profiles
-- Note: Only using columns that actually exist in the user_profiles table

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

-- Step 3: Verify the fix
SELECT 
    'After fix - Users still missing from user_profiles:' as status,
    COUNT(*) as count
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Step 4: Show the newly created profiles
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

-- Step 5: Test the follow functionality with the fixed user
-- The user c50fcde7-37f5-4d5e-999d-69cf5cba496c should now work

-- Check if the user now exists in both tables
SELECT 
    'User sync check:' as check_type,
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

-- Step 6: Test the follow functionality (uncomment to test)
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

-- Step 7: Show final user sync status
SELECT 
    'Final user sync status:' as status,
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.user_profiles) as user_profiles_count,
    (SELECT COUNT(*) FROM auth.users au LEFT JOIN public.user_profiles up ON au.id = up.id WHERE up.id IS NULL) as missing_profiles_count;
