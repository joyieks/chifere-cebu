-- ============================================
-- FIX: Update "User" display names from buyer_users
-- ============================================
-- This script updates user_profiles where display_name is "User"
-- with the actual names from buyer_users table
-- ============================================

-- Step 1: Check which users have "User" as display name
-- ============================================
SELECT 
    '❌ Users with "User" as display name' as info,
    up.id,
    up.display_name,
    up.user_type,
    up.email,
    bu.display_name as buyer_actual_name
FROM public.user_profiles up
LEFT JOIN public.buyer_users bu ON up.id = bu.id
WHERE up.display_name = 'User'
OR up.display_name IS NULL
OR up.display_name = '';

-- Step 2: Update user_profiles with actual names from buyer_users
-- ============================================
UPDATE public.user_profiles up
SET 
    display_name = COALESCE(bu.display_name, up.display_name),
    email = COALESCE(bu.email, up.email),
    updated_at = NOW()
FROM public.buyer_users bu
WHERE up.id = bu.id
AND (
    up.display_name = 'User' 
    OR up.display_name IS NULL 
    OR up.display_name = ''
);

-- Step 3: Verify the update
-- ============================================
SELECT 
    '✅ Updated User Profiles' as info,
    up.id,
    up.display_name,
    up.user_type,
    up.email
FROM public.user_profiles up
WHERE up.id IN (
    SELECT id FROM public.buyer_users
)
ORDER BY up.created_at DESC;

-- Step 4: Check specific user that was showing as "User"
-- ============================================
SELECT 
    '🔍 Specific User Check' as info,
    id,
    display_name,
    user_type,
    email
FROM public.user_profiles
WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9';

-- Step 5: Show all profiles to verify
-- ============================================
SELECT 
    '📋 All User Profiles' as info,
    id,
    display_name,
    user_type,
    business_name,
    email
FROM public.user_profiles
ORDER BY created_at DESC;

-- ============================================
-- COMPLETE! ✅
-- ============================================
-- ✅ All "User" display names updated from buyer_users
-- ✅ Now refresh your messages page!
-- ============================================
