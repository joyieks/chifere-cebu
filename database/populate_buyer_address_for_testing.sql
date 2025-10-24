-- Create a proper address entry for the buyer to test the address display
-- This will create a structured address like the one shown in the seller's view

-- First, check if the buyer already has an address
SELECT 
    ba.id,
    ba.user_id,
    ba.name,
    ba.address_line_1,
    ba.city,
    ba.province
FROM public.buyer_addresses ba
WHERE ba.user_id = 'c50fcde7-37f5-4d5e-999d-69cf5cba496c';

-- If no address exists, create one with proper structure
-- (This will only insert if no address exists for this user)
INSERT INTO public.buyer_addresses (
    id,
    user_id,
    name,
    type,
    address_line_1,
    address_line_2,
    barangay,
    city,
    province,
    zip_code,
    country,
    is_default,
    is_active,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    'c50fcde7-37f5-4d5e-999d-69cf5cba496c',
    'KKK', -- Name from the seller's view
    'home',
    'Banilad Cebu', -- First address line
    '', -- Second address line
    'banilad', -- Barangay
    'Cebu', -- City
    'Cebu', -- Province
    '6000', -- Zip code
    'Philippines', -- Country
    true, -- Default address
    true, -- Active
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.buyer_addresses 
    WHERE user_id = 'c50fcde7-37f5-4d5e-999d-69cf5cba496c' 
    AND is_active = true
);

-- Verify the address was created
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
    ba.is_active
FROM public.buyer_addresses ba
WHERE ba.user_id = 'c50fcde7-37f5-4d5e-999d-69cf5cba496c'
AND ba.is_active = true;
