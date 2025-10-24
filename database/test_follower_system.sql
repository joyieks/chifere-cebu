-- Test script to verify the follower system is working correctly
-- Run this after setting up the review and follow system

-- 1. Check if tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name = 'reviews' THEN '✅ Reviews table exists'
        WHEN table_name = 'follows' THEN '✅ Follows table exists' 
        WHEN table_name = 'seller_stats' THEN '✅ Seller stats table exists'
        ELSE '❌ Unknown table'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('reviews', 'follows', 'seller_stats');

-- 2. Check if triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    CASE 
        WHEN trigger_name = 'trigger_update_follower_count' THEN '✅ Follower count trigger exists'
        WHEN trigger_name = 'trigger_update_review_stats' THEN '✅ Review stats trigger exists'
        ELSE '❌ Unknown trigger'
    END as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name IN ('trigger_update_follower_count', 'trigger_update_review_stats');

-- 3. Check if functions exist
SELECT 
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name = 'update_seller_follower_count' THEN '✅ Follower count function exists'
        WHEN routine_name = 'update_seller_review_stats' THEN '✅ Review stats function exists'
        ELSE '❌ Unknown function'
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_seller_follower_count', 'update_seller_review_stats');

-- 4. Check current seller stats (if any exist)
SELECT 
    seller_id,
    total_followers,
    total_reviews,
    average_rating,
    updated_at
FROM public.seller_stats 
ORDER BY total_followers DESC, total_reviews DESC
LIMIT 10;

-- 5. Check current follows (if any exist)
SELECT 
    f.buyer_id,
    f.seller_id,
    f.created_at,
    up_buyer.display_name as buyer_name,
    up_seller.business_name as seller_name
FROM public.follows f
LEFT JOIN public.user_profiles up_buyer ON f.buyer_id = up_buyer.id
LEFT JOIN public.user_profiles up_seller ON f.seller_id = up_seller.id
ORDER BY f.created_at DESC
LIMIT 10;

-- 6. Test the system (uncomment and modify with real user IDs to test)
/*
-- Example test (replace with real user IDs from your auth.users table):
-- This will test the follow system by creating a follow relationship

-- Step 1: Insert a test follow (replace buyer_id and seller_id with real IDs)
INSERT INTO public.follows (buyer_id, seller_id) 
VALUES ('REPLACE_WITH_REAL_BUYER_ID', 'REPLACE_WITH_REAL_SELLER_ID');

-- Step 2: Check if seller_stats was updated
SELECT * FROM public.seller_stats WHERE seller_id = 'REPLACE_WITH_REAL_SELLER_ID';

-- Step 3: Remove the test follow
DELETE FROM public.follows 
WHERE buyer_id = 'REPLACE_WITH_REAL_BUYER_ID' 
AND seller_id = 'REPLACE_WITH_REAL_SELLER_ID';

-- Step 4: Check if seller_stats was updated again
SELECT * FROM public.seller_stats WHERE seller_id = 'REPLACE_WITH_REAL_SELLER_ID';
*/
