-- Populate buyer_addresses table with proper address data
-- This will help fix the address display issue using the correct table structure

-- 1. First, let's check what's currently in buyer_addresses
SELECT 
    ba.id,
    ba.user_id,
    ba.type,
    ba.address_line_1,
    ba.address_line_2,
    ba.barangay,
    ba.city,
    ba.province,
    ba.zip_code,
    ba.country,
    ba.is_default,
    ba.is_active,
    ba.created_at
FROM public.buyer_addresses ba
ORDER BY ba.created_at DESC;

-- 2. Check which buyers have orders but no addresses
SELECT 
    bo.buyer_id,
    bu.display_name,
    bu.email,
    COUNT(bo.id) as order_count,
    COUNT(ba.id) as address_count
FROM public.buyer_orders bo
LEFT JOIN public.buyer_users bu ON bo.buyer_id = bu.id
LEFT JOIN public.buyer_addresses ba ON bo.buyer_id = ba.user_id AND ba.is_active = true
WHERE bo.buyer_id IS NOT NULL
GROUP BY bo.buyer_id, bu.display_name, bu.email
HAVING COUNT(ba.id) = 0
ORDER BY order_count DESC;

-- 3. Just check what addresses already exist (no inserts)
-- We'll fetch the existing data that you've already filled up

-- 4. Verify the addresses were added
SELECT 
    ba.id,
    ba.user_id,
    bu.display_name,
    ba.type,
    ba.address_line_1,
    ba.address_line_2,
    ba.barangay,
    ba.city,
    ba.province,
    ba.zip_code,
    ba.country,
    ba.is_default,
    ba.is_active
FROM public.buyer_addresses ba
LEFT JOIN public.buyer_users bu ON ba.user_id = bu.id
WHERE ba.is_active = true
ORDER BY ba.created_at DESC;

-- 5. Test the relationship between orders and addresses
SELECT 
    bo.order_number,
    bo.buyer_id,
    bu.display_name as buyer_name,
    ba.address_line_1,
    ba.address_line_2,
    ba.barangay,
    ba.city,
    ba.province,
    ba.zip_code,
    ba.country
FROM public.buyer_orders bo
LEFT JOIN public.buyer_users bu ON bo.buyer_id = bu.id
LEFT JOIN public.buyer_addresses ba ON bo.buyer_id = ba.user_id AND ba.is_default = true AND ba.is_active = true
WHERE bo.buyer_id IS NOT NULL
ORDER BY bo.created_at DESC
LIMIT 10;
