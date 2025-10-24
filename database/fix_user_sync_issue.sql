-- Fix user synchronization issues between auth.users and user_profiles
-- This addresses the foreign key constraint violation in the follows table

-- Step 1: Check the current situation
SELECT 'Current user sync status:' as status;

-- Count users in each table
SELECT 
    'auth.users' as table_name,
    COUNT(*) as user_count
FROM auth.users
UNION ALL
SELECT 
    'user_profiles' as table_name,
    COUNT(*) as user_count
FROM public.user_profiles;

-- Step 2: Find the problematic user from the error log
-- buyer_id: 'd7f43ccd-3576-43e3-ac94-ec60c7674df9'
SELECT 
    'Checking problematic user:' as check_type,
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

-- Step 3: If the user exists in user_profiles but not in auth.users, we need to fix this
-- This can happen if there's a sync issue between the tables

-- Option A: Create the missing user in auth.users (if they exist in user_profiles)
-- WARNING: This is a workaround and may not be the best solution
-- The proper fix would be to ensure user creation is handled correctly in your app

/*
-- Uncomment this section if you want to create the missing user in auth.users
-- This should only be done if you're sure the user should exist

INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    raw_app_meta_data,
    is_super_admin,
    role
)
SELECT 
    up.id,
    up.email,
    '$2a$10$dummy.hash.for.missing.user', -- This is a dummy hash, user will need to reset password
    NOW(),
    up.created_at,
    up.updated_at,
    '{"user_type": "' || up.user_type || '"}',
    '{"provider": "email", "providers": ["email"]}',
    false,
    up.user_type
FROM public.user_profiles up
WHERE up.id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9'
AND NOT EXISTS(SELECT 1 FROM auth.users WHERE id = up.id);
*/

-- Step 4: Alternative approach - Check if the user should be using a different ID
-- Sometimes the frontend might be using a cached or incorrect user ID

-- Get all users that could potentially be the logged-in user
SELECT 
    'Available users for testing:' as info,
    au.id,
    au.email,
    up.display_name,
    up.user_type
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE au.email IS NOT NULL
ORDER BY au.created_at DESC
LIMIT 10;

-- Step 5: Test the follow functionality with a known good user
-- Replace the user IDs below with real IDs from your system

/*
-- Test follow with a user that exists in both tables
-- Replace 'REPLACE_WITH_REAL_BUYER_ID' and 'REPLACE_WITH_REAL_SELLER_ID' with actual IDs

-- First, verify both users exist
SELECT 
    'Buyer check:' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM auth.users WHERE id = 'REPLACE_WITH_REAL_BUYER_ID') 
        THEN '✅ Buyer exists in auth.users'
        ELSE '❌ Buyer missing from auth.users'
    END as status
UNION ALL
SELECT 
    'Seller check:' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM auth.users WHERE id = 'REPLACE_WITH_REAL_SELLER_ID') 
        THEN '✅ Seller exists in auth.users'
        ELSE '❌ Seller missing from auth.users'
    END as status;

-- Test the follow operation
INSERT INTO public.follows (buyer_id, seller_id) 
VALUES ('REPLACE_WITH_REAL_BUYER_ID', 'REPLACE_WITH_REAL_SELLER_ID');

-- Check if it worked
SELECT * FROM public.follows WHERE buyer_id = 'REPLACE_WITH_REAL_BUYER_ID';

-- Check if seller_stats was updated
SELECT * FROM public.seller_stats WHERE seller_id = 'REPLACE_WITH_REAL_SELLER_ID';

-- Clean up test
DELETE FROM public.follows 
WHERE buyer_id = 'REPLACE_WITH_REAL_BUYER_ID' 
AND seller_id = 'REPLACE_WITH_REAL_SELLER_ID';
*/

-- Step 6: Check for any authentication issues
-- The frontend might be using a stale or incorrect user ID
SELECT 
    'Authentication check:' as info,
    'Make sure the user is properly logged in and the user ID is correct' as recommendation;
