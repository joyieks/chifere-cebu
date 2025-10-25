-- FIX BUYER SELLER STATUS ISSUE
-- This script will fix buyer accounts that incorrectly have seller_status set

-- Step 1: Check for buyer accounts with seller_status set
SELECT 
    'Buyer accounts with seller_status' as issue,
    id,
    email,
    user_type,
    seller_status,
    'Should be NULL for buyers' as fix_needed
FROM public.user_profiles
WHERE user_type = 'buyer' AND seller_status IS NOT NULL;

-- Step 2: Fix buyer accounts in user_profiles table
UPDATE public.user_profiles 
SET seller_status = NULL 
WHERE user_type = 'buyer' AND seller_status IS NOT NULL;

-- Step 3: Note - buyer_users table doesn't have seller_status column, so no update needed

-- Step 4: Verify the fix
SELECT 
    'After fix - user_profiles' as table_name,
    COUNT(*) as total_buyers,
    COUNT(seller_status) as buyers_with_seller_status
FROM public.user_profiles
WHERE user_type = 'buyer'
UNION ALL
SELECT 
    'After fix - buyer_users' as table_name,
    COUNT(*) as total_buyers,
    0 as buyers_with_seller_status
FROM public.buyer_users
WHERE user_type = 'buyer';

-- Step 5: Show remaining buyer accounts
SELECT 
    'Remaining buyer accounts' as status,
    id,
    email,
    user_type,
    seller_status,
    is_active
FROM public.user_profiles
WHERE user_type = 'buyer'
UNION ALL
SELECT 
    'Remaining buyer accounts' as status,
    id,
    email,
    user_type,
    NULL as seller_status,
    is_active
FROM public.buyer_users
WHERE user_type = 'buyer'
ORDER BY email;

SELECT 'BUYER SELLER_STATUS ISSUE FIXED!' as status;
