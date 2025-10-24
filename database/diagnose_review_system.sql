-- Comprehensive diagnostic script for review system
-- Run this to check if reviews are being saved and displayed correctly

-- 1. Check if reviews table exists and has data
SELECT 'Reviews Table Check' as check_type;
SELECT 
    COUNT(*) as total_reviews,
    COUNT(DISTINCT buyer_id) as unique_buyers,
    COUNT(DISTINCT seller_id) as unique_sellers,
    COUNT(DISTINCT product_id) as unique_products,
    AVG(rating) as average_rating
FROM public.reviews;

-- 2. Show recent reviews
SELECT 'Recent Reviews' as check_type;
SELECT 
    id,
    buyer_id,
    seller_id,
    product_id,
    order_id,
    rating,
    LEFT(comment, 50) as comment_preview,
    is_verified,
    created_at
FROM public.reviews 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check if there are any reviews for specific products
SELECT 'Reviews by Product' as check_type;
SELECT 
    product_id,
    COUNT(*) as review_count,
    AVG(rating) as avg_rating,
    MIN(created_at) as first_review,
    MAX(created_at) as latest_review
FROM public.reviews 
GROUP BY product_id 
ORDER BY review_count DESC;

-- 4. Check RLS policies on reviews table
SELECT 'RLS Policies Check' as check_type;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'reviews';

-- 5. Check if users exist in auth.users
SELECT 'Auth Users Check' as check_type;
SELECT 
    COUNT(*) as total_auth_users,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as recent_users
FROM auth.users;

-- 6. Check if users exist in user_profiles
SELECT 'User Profiles Check' as check_type;
SELECT 
    COUNT(*) as total_user_profiles,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as recent_profiles
FROM public.user_profiles;

-- 7. Check for orphaned reviews (reviews with buyer_id not in auth.users)
SELECT 'Orphaned Reviews Check' as check_type;
SELECT 
    r.id,
    r.buyer_id,
    r.rating,
    r.created_at
FROM public.reviews r
LEFT JOIN auth.users u ON r.buyer_id = u.id
WHERE u.id IS NULL
LIMIT 10;

-- 8. Check for reviews with invalid product_id references
SELECT 'Product References Check' as check_type;
SELECT 
    r.product_id,
    COUNT(*) as review_count
FROM public.reviews r
GROUP BY r.product_id
ORDER BY review_count DESC
LIMIT 10;

-- 9. Test review creation permissions (this will show if RLS is blocking)
SELECT 'Review Creation Test' as check_type;
-- This query will show if the current user can create reviews
SELECT 
    'Current user can create reviews' as test_result,
    auth.uid() as current_user_id;

-- 10. Check seller_stats table
SELECT 'Seller Stats Check' as check_type;
SELECT 
    seller_id,
    total_followers,
    total_reviews,
    average_rating,
    updated_at
FROM public.seller_stats
ORDER BY total_reviews DESC
LIMIT 10;
