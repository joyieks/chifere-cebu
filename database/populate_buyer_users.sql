-- Populate buyer_users table with data from auth.users
-- This will help fix the customer name display issue

-- 1. Create buyer_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.buyer_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    first_name TEXT,
    last_name TEXT,
    middle_name TEXT,
    user_type TEXT DEFAULT 'buyer',
    phone TEXT,
    address TEXT,
    profile_image TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert buyer users from auth.users (only if they don't exist)
INSERT INTO public.buyer_users (
    id, 
    email, 
    display_name, 
    first_name, 
    last_name, 
    phone, 
    address
)
SELECT 
    au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'name',
        SPLIT_PART(au.email, '@', 1)
    ) as display_name,
    au.raw_user_meta_data->>'first_name' as first_name,
    au.raw_user_meta_data->>'last_name' as last_name,
    au.raw_user_meta_data->>'phone' as phone,
    au.raw_user_meta_data->>'address' as address
FROM auth.users au
WHERE au.id IN (
    SELECT DISTINCT buyer_id 
    FROM public.buyer_orders 
    WHERE buyer_id IS NOT NULL
)
AND NOT EXISTS (
    SELECT 1 FROM public.buyer_users bu 
    WHERE bu.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- 3. Update existing buyer_users with better data if available
UPDATE public.buyer_users 
SET 
    display_name = COALESCE(
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'name',
        buyer_users.display_name,
        SPLIT_PART(au.email, '@', 1)
    ),
    first_name = COALESCE(
        au.raw_user_meta_data->>'first_name',
        buyer_users.first_name
    ),
    last_name = COALESCE(
        au.raw_user_meta_data->>'last_name',
        buyer_users.last_name
    ),
    phone = COALESCE(
        au.raw_user_meta_data->>'phone',
        buyer_users.phone
    ),
    address = COALESCE(
        au.raw_user_meta_data->>'address',
        buyer_users.address
    )
FROM auth.users au
WHERE buyer_users.id = au.id
AND au.raw_user_meta_data IS NOT NULL;

-- 4. Verify the results
SELECT 
    id,
    email,
    display_name,
    first_name,
    last_name,
    phone,
    address
FROM public.buyer_users
ORDER BY created_at DESC;
