-- Fix the create_buyer_user trigger function that's causing the first_name error
-- The trigger is trying to insert into buyer_users with columns that don't exist

-- Step 1: Check the current trigger function definition
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'create_buyer_user';

-- Step 2: Check what triggers are using this function
SELECT 
    trigger_name,
    event_object_table,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE action_statement LIKE '%create_buyer_user%';

-- Step 3: Drop the problematic trigger completely
DROP TRIGGER IF EXISTS create_buyer_user_trigger ON public.user_profiles;
DROP TRIGGER IF EXISTS trigger_create_buyer_user ON public.user_profiles;
DROP TRIGGER IF EXISTS create_buyer_user ON public.user_profiles;
DROP TRIGGER IF EXISTS on_user_profile_created ON public.user_profiles;

-- Step 4: Drop the problematic function with CASCADE to remove dependent objects
DROP FUNCTION IF EXISTS create_buyer_user() CASCADE;

-- Step 5: Verify the trigger and function are gone
SELECT 
    'Triggers remaining on user_profiles:' as check_type,
    COUNT(*) as count
FROM information_schema.triggers 
WHERE event_object_table = 'user_profiles'
AND event_object_schema = 'public';

SELECT 
    'Functions named create_buyer_user:' as check_type,
    COUNT(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'create_buyer_user';

-- Step 6: Now create the missing user profiles without trigger interference
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

-- Step 7: Verify the fix worked
SELECT 
    'Users still missing from user_profiles:' as status,
    COUNT(*) as count
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Step 8: Show the newly created profiles
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

-- Step 9: Check if the problematic user now exists
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

-- Step 10: Test the follow functionality (uncomment to test)
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

-- Step 11: Final status check
SELECT 
    'Final user sync status:' as status,
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.user_profiles) as user_profiles_count,
    (SELECT COUNT(*) FROM auth.users au LEFT JOIN public.user_profiles up ON au.id = up.id WHERE up.id IS NULL) as missing_profiles_count;
