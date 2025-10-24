-- Fix the specific missing user that's causing the foreign key constraint violation
-- User ID: d7f43ccd-3576-43e3-ac94-ec60c7674df9

-- Step 1: Check if this specific user exists in auth.users
SELECT 
    'Checking specific user in auth.users:' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM auth.users WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9') 
        THEN '✅ User exists in auth.users'
        ELSE '❌ User missing from auth.users'
    END as status;

-- Step 2: Check if this specific user exists in user_profiles
SELECT 
    'Checking specific user in user_profiles:' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM public.user_profiles WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9') 
        THEN '✅ User exists in user_profiles'
        ELSE '❌ User missing from user_profiles'
    END as status;

-- Step 3: Show the user data from auth.users if it exists
SELECT 
    'User data from auth.users:' as source,
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users 
WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9';

-- Step 4: Create the missing user profile for this specific user
-- Only if the user exists in auth.users but not in user_profiles
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
WHERE au.id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9'
AND NOT EXISTS(SELECT 1 FROM public.user_profiles WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9');

-- Step 5: Verify the user profile was created
SELECT 
    'User profile creation result:' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM public.user_profiles WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9') 
        THEN '✅ User profile created successfully'
        ELSE '❌ User profile creation failed'
    END as status;

-- Step 6: Show the created user profile
SELECT 
    'Created user profile:' as info,
    id,
    email,
    display_name,
    user_type,
    is_verified,
    created_at
FROM public.user_profiles 
WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9';

-- Step 7: Check for any other users that might be missing
SELECT 
    'Other users missing from user_profiles:' as issue,
    au.id,
    au.email,
    au.created_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ORDER BY au.created_at DESC;

-- Step 8: Create profiles for any other missing users
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

-- Step 9: Final verification
SELECT 
    'Final user sync status:' as status,
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.user_profiles) as user_profiles_count,
    (SELECT COUNT(*) FROM auth.users au LEFT JOIN public.user_profiles up ON au.id = up.id WHERE up.id IS NULL) as missing_profiles_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM auth.users au LEFT JOIN public.user_profiles up ON au.id = up.id WHERE up.id IS NULL) = 0 
        THEN '✅ All users synced'
        ELSE '❌ Some users still missing profiles'
    END as overall_status;

-- Step 10: Test the follow functionality (uncomment to test)
/*
-- Test follow with the specific user
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
