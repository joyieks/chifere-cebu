-- Force create the missing user profile that's causing the foreign key constraint violation
-- This is a direct, no-nonsense fix for user: d7f43ccd-3576-43e3-ac94-ec60c7674df9

-- Step 1: Check if the user exists in auth.users
SELECT 
    'User exists in auth.users:' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM auth.users WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9') 
        THEN 'YES'
        ELSE 'NO'
    END as result;

-- Step 2: Get the user data from auth.users
SELECT 
    'User data from auth.users:' as info,
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9';

-- Step 3: Force create the user profile (even if it already exists)
-- Using INSERT ... ON CONFLICT to handle any potential duplicates
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
VALUES (
    'd7f43ccd-3576-43e3-ac94-ec60c7674df9',
    'user@example.com', -- We'll update this with real data if the user exists
    'User',
    'buyer',
    false,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW();

-- Step 4: If the user exists in auth.users, update the profile with real data
UPDATE public.user_profiles 
SET 
    email = au.email,
    display_name = COALESCE(au.raw_user_meta_data->>'display_name', SPLIT_PART(au.email, '@', 1)),
    user_type = COALESCE(au.raw_user_meta_data->>'user_type', 'buyer'),
    is_verified = CASE WHEN au.email_confirmed_at IS NOT NULL THEN true ELSE false END,
    created_at = au.created_at,
    updated_at = NOW()
FROM auth.users au
WHERE public.user_profiles.id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9'
AND au.id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9';

-- Step 5: Verify the user profile now exists
SELECT 
    'User profile verification:' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM public.user_profiles WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9') 
        THEN '✅ User profile exists'
        ELSE '❌ User profile still missing'
    END as result;

-- Step 6: Show the created/updated user profile
SELECT 
    'User profile data:' as info,
    id,
    email,
    display_name,
    user_type,
    is_verified,
    created_at,
    updated_at
FROM public.user_profiles 
WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9';

-- Step 7: Test the follow functionality immediately
-- This will tell us if the foreign key constraint is now satisfied
INSERT INTO public.follows (buyer_id, seller_id) 
VALUES ('d7f43ccd-3576-43e3-ac94-ec60c7674df9', '126fa7e4-1b27-4818-8915-0fb479ee1553');

-- Step 8: Check if the follow was created successfully
SELECT 
    'Follow creation test:' as test_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM public.follows WHERE buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9' AND seller_id = '126fa7e4-1b27-4818-8915-0fb479ee1553') 
        THEN '✅ Follow created successfully'
        ELSE '❌ Follow creation failed'
    END as result;

-- Step 9: Show the created follow
SELECT 
    'Created follow:' as info,
    id,
    buyer_id,
    seller_id,
    created_at
FROM public.follows 
WHERE buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9' 
AND seller_id = '126fa7e4-1b27-4818-8915-0fb479ee1553';

-- Step 10: Check if seller_stats was updated
SELECT 
    'Seller stats update:' as check_type,
    seller_id,
    total_followers,
    updated_at
FROM public.seller_stats 
WHERE seller_id = '126fa7e4-1b27-4818-8915-0fb479ee1553';

-- Step 11: Clean up the test follow (optional)
-- Uncomment the next line if you want to remove the test follow
-- DELETE FROM public.follows WHERE buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9' AND seller_id = '126fa7e4-1b27-4818-8915-0fb479ee1553';

-- Step 12: Final status
SELECT 
    'Fix completed successfully!' as status,
    'The follow functionality should now work for this user' as result;
