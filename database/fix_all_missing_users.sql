-- Comprehensive fix for all users with sync issues
-- This addresses the new foreign key constraint violation with user d7f43ccd-3576-43e3-ac94-ec60c7674df9

-- Step 1: Check the current problematic user
SELECT 
    'Checking new problematic user:' as check_type,
    'd7f43ccd-3576-43e3-ac94-ec60c7674df9' as user_id;

-- Check if this user exists in auth.users
SELECT 
    CASE 
        WHEN EXISTS(SELECT 1 FROM auth.users WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9') 
        THEN '✅ User exists in auth.users'
        ELSE '❌ User missing from auth.users'
    END as auth_users_status;

-- Check if this user exists in user_profiles
SELECT 
    CASE 
        WHEN EXISTS(SELECT 1 FROM public.user_profiles WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9') 
        THEN '✅ User exists in user_profiles'
        ELSE '❌ User missing from user_profiles'
    END as user_profiles_status;

-- Step 2: Check for ALL users that might have sync issues
SELECT 
    'Users in auth.users but missing from user_profiles:' as issue,
    au.id,
    au.email,
    au.created_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ORDER BY au.created_at DESC;

-- Step 3: Create user profiles for ALL missing users
-- This will ensure no user is left behind
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

-- Step 4: Verify the fix worked for the new problematic user
SELECT 
    'User sync check for new problematic user:' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM auth.users WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9') 
        THEN '✅ User exists in auth.users'
        ELSE '❌ User missing from auth.users'
    END as auth_users_status,
    CASE 
        WHEN EXISTS(SELECT 1 FROM public.user_profiles WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9') 
        THEN '✅ User exists in user_profiles'
        ELSE '❌ User missing from user_profiles'
    END as user_profiles_status;

-- Step 5: Check for any remaining sync issues
SELECT 
    'Remaining users with sync issues:' as status,
    COUNT(*) as count
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Step 6: Show all users and their sync status
SELECT 
    'All users sync status:' as info,
    au.id,
    au.email,
    CASE 
        WHEN up.id IS NOT NULL THEN '✅ Synced'
        ELSE '❌ Missing profile'
    END as sync_status,
    up.display_name,
    up.user_type
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
ORDER BY au.created_at DESC;

-- Step 7: Test the follow functionality with the new problematic user (uncomment to test)
/*
-- Test follow with the new problematic user
-- Replace 'REPLACE_WITH_REAL_SELLER_ID' with an actual seller ID

-- Test 1: Insert a follow
INSERT INTO public.follows (buyer_id, seller_id) 
VALUES ('d7f43ccd-3576-43e3-ac94-ec60c7674df9', 'REPLACE_WITH_REAL_SELLER_ID');

-- Test 2: Check if seller_stats was updated
SELECT * FROM public.seller_stats WHERE seller_id = 'REPLACE_WITH_REAL_SELLER_ID';

-- Test 3: Delete the test follow
DELETE FROM public.follows 
WHERE buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9' 
AND seller_id = 'REPLACE_WITH_REAL_SELLER_ID';

-- Test 4: Check if seller_stats was updated again
SELECT * FROM public.seller_stats WHERE seller_id = 'REPLACE_WITH_REAL_SELLER_ID';
*/

-- Step 8: Final comprehensive status check
SELECT 
    'Final comprehensive user sync status:' as status,
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.user_profiles) as user_profiles_count,
    (SELECT COUNT(*) FROM auth.users au LEFT JOIN public.user_profiles up ON au.id = up.id WHERE up.id IS NULL) as missing_profiles_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM auth.users au LEFT JOIN public.user_profiles up ON au.id = up.id WHERE up.id IS NULL) = 0 
        THEN '✅ All users synced'
        ELSE '❌ Some users still missing profiles'
    END as overall_status;
