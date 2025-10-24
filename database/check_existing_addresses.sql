-- Just check what addresses already exist in your buyer_addresses table
-- No inserts, just fetching existing data

-- 1. Check all existing addresses
SELECT 
    ba.id,
    ba.user_id,
    ba.name,
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
WHERE ba.is_active = true
ORDER BY ba.created_at DESC;

-- 2. Check which buyers have addresses
SELECT 
    ba.user_id,
    bu.display_name,
    bu.email,
    COUNT(ba.id) as address_count
FROM public.buyer_addresses ba
LEFT JOIN public.buyer_users bu ON ba.user_id = bu.id
WHERE ba.is_active = true
GROUP BY ba.user_id, bu.display_name, bu.email
ORDER BY address_count DESC;

-- 3. Check the relationship between orders and existing addresses
SELECT 
    bo.order_number,
    bo.buyer_id,
    bu.display_name as buyer_name,
    ba.name as address_name,
    ba.address_line_1,
    ba.address_line_2,
    ba.barangay,
    ba.city,
    ba.province,
    ba.zip_code,
    ba.country,
    ba.type
FROM public.buyer_orders bo
LEFT JOIN public.buyer_users bu ON bo.buyer_id = bu.id
LEFT JOIN public.buyer_addresses ba ON bo.buyer_id = ba.user_id AND ba.is_default = true AND ba.is_active = true
WHERE bo.buyer_id IS NOT NULL
ORDER BY bo.created_at DESC
LIMIT 10;
