-- FIX USER ROLE DETECTION ISSUE
-- This script will fix the user role detection problem

-- Step 1: Check current state
SELECT 
    'Current state - user_profiles' as table_name,
    id,
    email,
    user_type,
    seller_status,
    is_active
FROM public.user_profiles
WHERE email = 'godol70865@haotuwu.com'
UNION ALL
SELECT 
    'Current state - buyer_users' as table_name,
    id,
    email,
    user_type,
    NULL as seller_status,
    is_active
FROM public.buyer_users
WHERE email = 'godol70865@haotuwu.com';

-- Step 2: If user exists in user_profiles with wrong type, fix it
UPDATE public.user_profiles 
SET 
    user_type = 'buyer',
    seller_status = NULL
WHERE email = 'godol70865@haotuwu.com' 
AND user_type != 'buyer';

-- Step 3: If user exists in user_profiles but should be in buyer_users, move them
-- First, insert into buyer_users if not exists
INSERT INTO public.buyer_users (
    id, email, display_name, first_name, last_name, middle_name, 
    user_type, phone, address, profile_image, is_verified, is_active
)
SELECT 
    id, email, display_name, first_name, last_name, middle_name,
    'buyer', phone, address, profile_image, is_verified, is_active
FROM public.user_profiles
WHERE email = 'godol70865@haotuwu.com'
AND NOT EXISTS (
    SELECT 1 FROM public.buyer_users WHERE email = 'godol70865@haotuwu.com'
);

-- Step 4: Remove from user_profiles if they should only be in buyer_users
-- (Only do this if you're sure they should be a buyer only)
-- DELETE FROM public.user_profiles 
-- WHERE email = 'godol70865@haotuwu.com' 
-- AND user_type = 'buyer';

-- Step 5: Verify the fix
SELECT 
    'After fix - user_profiles' as table_name,
    id,
    email,
    user_type,
    seller_status,
    is_active
FROM public.user_profiles
WHERE email = 'godol70865@haotuwu.com'
UNION ALL
SELECT 
    'After fix - buyer_users' as table_name,
    id,
    email,
    user_type,
    NULL as seller_status,
    is_active
FROM public.buyer_users
WHERE email = 'godol70865@haotuwu.com';

SELECT 'USER ROLE DETECTION FIXED!' as status;
