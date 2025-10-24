-- Populate buyer_addresses table with proper address data
-- This will help fix the address display issue

-- 1. First, let's check what's currently in buyer_addresses
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
LEFT JOIN public.buyer_addresses ba ON bo.buyer_id = ba.user_id
WHERE bo.buyer_id IS NOT NULL
GROUP BY bo.buyer_id, bu.display_name, bu.email
HAVING COUNT(ba.id) = 0
ORDER BY order_count DESC;

-- 3. Add sample addresses for buyers who have orders but no addresses
-- This will help test the address display functionality

-- For Joan Joy Diocampo (d7f43ccd-3576-43e3-ac94-ec60c7674df9)
INSERT INTO public.buyer_addresses (
    user_id,
    type,
    street,
    city,
    province,
    postal_code,
    country,
    contact_name,
    contact_phone,
    is_default,
    created_at
) VALUES (
    'd7f43ccd-3576-43e3-ac94-ec60c7674df9',
    'home',
    '123 Main Street, Barangay San Antonio',
    'Makati City',
    'Metro Manila',
    '1234',
    'Philippines',
    'Joan Joy Diocampo',
    '09981921194',
    true,
    NOW()
) ON CONFLICT DO NOTHING;

-- For Joyax D (c50fcde7-37f5-4d5e-999d-69cf5cba496c)
INSERT INTO public.buyer_addresses (
    user_id,
    type,
    street,
    city,
    province,
    postal_code,
    country,
    contact_name,
    contact_phone,
    is_default,
    created_at
) VALUES (
    'c50fcde7-37f5-4d5e-999d-69cf5cba496c',
    'home',
    '456 Oak Avenue, Barangay Poblacion',
    'Quezon City',
    'Metro Manila',
    '1100',
    'Philippines',
    'Joyax D',
    '09636987455',
    true,
    NOW()
) ON CONFLICT DO NOTHING;

-- 4. Verify the addresses were added
SELECT 
    ba.id,
    ba.user_id,
    bu.display_name,
    ba.type,
    ba.street,
    ba.city,
    ba.province,
    ba.postal_code,
    ba.contact_name,
    ba.contact_phone,
    ba.is_default
FROM public.buyer_addresses ba
LEFT JOIN public.buyer_users bu ON ba.user_id = bu.id
ORDER BY ba.created_at DESC;

-- 5. Test the relationship between orders and addresses
SELECT 
    bo.order_number,
    bo.buyer_id,
    bu.display_name as buyer_name,
    ba.street,
    ba.city,
    ba.province,
    ba.contact_name,
    ba.contact_phone
FROM public.buyer_orders bo
LEFT JOIN public.buyer_users bu ON bo.buyer_id = bu.id
LEFT JOIN public.buyer_addresses ba ON bo.buyer_id = ba.user_id AND ba.is_default = true
WHERE bo.buyer_id IS NOT NULL
ORDER BY bo.created_at DESC
LIMIT 10;
