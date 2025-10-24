-- Fix Foreign Key Constraint Issue for Admin Disable User
-- The issue is that disabled_by field references users table but admin IDs are in admin_users table

-- Option 1: Drop the foreign key constraint (Recommended for quick fix)
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_disabled_by_fkey;
ALTER TABLE public.buyer_users DROP CONSTRAINT IF EXISTS buyer_users_disabled_by_fkey;

-- Option 2: Make disabled_by field nullable (if not already)
ALTER TABLE public.user_profiles ALTER COLUMN disabled_by DROP NOT NULL;
ALTER TABLE public.buyer_users ALTER COLUMN disabled_by DROP NOT NULL;

-- Option 3: Update the constraint to reference admin_users table instead
-- (This is more complex and requires careful consideration)

-- Verify the changes
SELECT 
    tc.table_name,
    kcu.column_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('user_profiles', 'buyer_users')
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'disabled_by';
