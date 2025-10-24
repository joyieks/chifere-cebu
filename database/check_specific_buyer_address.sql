-- Check address data for the specific buyer from the console logs
-- buyer_id: c50fcde7-37f5-4d5e-999d-69cf5cba496c

-- 1. Check if this buyer has any addresses in buyer_addresses table
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
WHERE ba.user_id = 'c50fcde7-37f5-4d5e-999d-69cf5cba496c'
ORDER BY ba.created_at DESC;

-- 2. Check the buyer's user info
SELECT 
    bu.id,
    bu.display_name,
    bu.email,
    bu.first_name,
    bu.last_name,
    bu.phone
FROM public.buyer_users bu
WHERE bu.id = 'c50fcde7-37f5-4d5e-999d-69cf5cba496c';

-- 3. Check the order's delivery_address data
SELECT 
    bo.order_number,
    bo.buyer_id,
    bo.delivery_address,
    bo.created_at
FROM public.buyer_orders bo
WHERE bo.buyer_id = 'c50fcde7-37f5-4d5e-999d-69cf5cba496c'
ORDER BY bo.created_at DESC
LIMIT 5;
