-- Create the missing user in auth.users to resolve the authentication issue
-- This is a comprehensive fix for user: d7f43ccd-3576-43e3-ac94-ec60c7674df9

-- Step 1: Check if the user exists in auth.users
SELECT 
    'User exists in auth.users:' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM auth.users WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9') 
        THEN 'YES'
        ELSE 'NO - Creating user now'
    END as result;

-- Step 2: Create the missing user in auth.users
-- This will resolve the authentication issue
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
)
VALUES (
    'd7f43ccd-3576-43e3-ac94-ec60c7674df9',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'user@example.com',
    '$2a$10$dummy.hash.for.missing.user',
    NOW(),
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"user_type": "buyer"}',
    false,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    false,
    NULL
);

-- Step 3: Verify the user was created in auth.users
SELECT 
    'User creation verification:' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM auth.users WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9') 
        THEN '✅ User created in auth.users'
        ELSE '❌ User creation failed'
    END as result;

-- Step 4: Now create the user profile in user_profiles
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
    'user@example.com',
    'User',
    'buyer',
    true,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW();

-- Step 5: Verify the user profile was created
SELECT 
    'User profile creation verification:' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM public.user_profiles WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9') 
        THEN '✅ User profile created'
        ELSE '❌ User profile creation failed'
    END as result;

-- Step 6: Test the follow functionality immediately
INSERT INTO public.follows (buyer_id, seller_id) 
VALUES ('d7f43ccd-3576-43e3-ac94-ec60c7674df9', '126fa7e4-1b27-4818-8915-0fb479ee1553');

-- Step 7: Verify the follow was created successfully
SELECT 
    'Follow creation test:' as test_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM public.follows WHERE buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9' AND seller_id = '126fa7e4-1b27-4818-8915-0fb479ee1553') 
        THEN '✅ Follow created successfully'
        ELSE '❌ Follow creation failed'
    END as result;

-- Step 8: Show the created follow
SELECT 
    'Created follow:' as info,
    id,
    buyer_id,
    seller_id,
    created_at
FROM public.follows 
WHERE buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9' 
AND seller_id = '126fa7e4-1b27-4818-8915-0fb479ee1553';

-- Step 9: Check if seller_stats was updated
SELECT 
    'Seller stats update:' as check_type,
    seller_id,
    total_followers,
    updated_at
FROM public.seller_stats 
WHERE seller_id = '126fa7e4-1b27-4818-8915-0fb479ee1553';

-- Step 10: Final status
SELECT 
    'COMPREHENSIVE FIX COMPLETED!' as status,
    'The user now exists in both auth.users and user_profiles' as result,
    'The follow functionality should now work' as outcome;

-- Step 11: Clean up the test follow (optional)
-- Uncomment the next line if you want to remove the test follow
-- DELETE FROM public.follows WHERE buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9' AND seller_id = '126fa7e4-1b27-4818-8915-0fb479ee1553';
