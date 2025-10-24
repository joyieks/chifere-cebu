-- Check the structure and data of buyer_addresses table
-- This will help us understand how to fetch address information

-- 1. Check the structure of buyer_addresses table
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'buyer_addresses'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 1.5. Check if there's a user_id or buyer_id column
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'buyer_addresses'
AND table_schema = 'public'
AND (column_name LIKE '%user%' OR column_name LIKE '%buyer%')
ORDER BY ordinal_position;

-- 2. Check what data exists in buyer_addresses
SELECT * FROM public.buyer_addresses
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check if buyer_addresses has more detailed address fields
SELECT 
    ba.id,
    ba.user_id,
    ba.type,
    ba.street,
    ba.city,
    ba.province,
    ba.postal_code,
    ba.country,
    ba.is_default,
    ba.created_at
FROM public.buyer_addresses ba
ORDER BY ba.created_at DESC
LIMIT 5;

-- 4. Check the relationship between buyer_orders and buyer_addresses
SELECT 
    bo.id as order_id,
    bo.order_number,
    bo.buyer_id,
    bo.delivery_address,
    ba.id as address_id,
    ba.type as address_type,
    ba.street,
    ba.city,
    ba.province
FROM public.buyer_orders bo
LEFT JOIN public.buyer_addresses ba ON bo.buyer_id = ba.user_id
WHERE bo.buyer_id IS NOT NULL
ORDER BY bo.created_at DESC
LIMIT 5;
