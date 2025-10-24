-- Check if buyer_users table exists and has data
-- This will help us understand why customer names are not showing

-- 1. Check if buyer_users table exists
SELECT 
    table_name, 
    table_schema 
FROM information_schema.tables 
WHERE table_name = 'buyer_users' 
AND table_schema = 'public';

-- 2. If table exists, check its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'buyer_users'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if there are any buyer_users records
SELECT COUNT(*) as buyer_users_count
FROM public.buyer_users;

-- 4. Check what buyer_ids exist in orders
SELECT 
    buyer_id, 
    COUNT(*) as order_count
FROM public.buyer_orders 
WHERE buyer_id IS NOT NULL
GROUP BY buyer_id
ORDER BY order_count DESC;

-- 5. Check if buyer_ids in orders match buyer_users
SELECT 
    bo.buyer_id,
    bu.display_name,
    bu.email,
    bu.phone,
    COUNT(*) as order_count
FROM public.buyer_orders bo
LEFT JOIN public.buyer_users bu ON bo.buyer_id = bu.id
WHERE bo.buyer_id IS NOT NULL
GROUP BY bo.buyer_id, bu.display_name, bu.email, bu.phone
ORDER BY order_count DESC;
