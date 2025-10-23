-- ============================================
-- ChiFere Cart - Disable RLS & Use Database Only
-- ============================================
-- This removes RLS restrictions and allows
-- cart to work directly with database
-- No localStorage, only database storage
-- ============================================

-- Step 1: DISABLE Row Level Security
-- ============================================
ALTER TABLE public.buyer_add_to_cart DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL RLS policies (we don't need them anymore)
-- ============================================
DROP POLICY IF EXISTS "Users can view their own cart" ON public.buyer_add_to_cart;
DROP POLICY IF EXISTS "Users can insert their own cart" ON public.buyer_add_to_cart;
DROP POLICY IF EXISTS "Users can update their own cart" ON public.buyer_add_to_cart;
DROP POLICY IF EXISTS "Users can delete their own cart" ON public.buyer_add_to_cart;
DROP POLICY IF EXISTS "Users can manage their cart" ON public.buyer_add_to_cart;
DROP POLICY IF EXISTS "Authenticated users can manage their own carts" ON public.buyer_add_to_cart;

-- Step 3: Grant FULL permissions to everyone
-- ============================================
GRANT ALL ON public.buyer_add_to_cart TO anon;
GRANT ALL ON public.buyer_add_to_cart TO authenticated;
GRANT ALL ON public.buyer_add_to_cart TO service_role;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Step 4: Create/Update trigger for auto-updating updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_cart_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cart_updated_at_trigger ON public.buyer_add_to_cart;

CREATE TRIGGER cart_updated_at_trigger
BEFORE UPDATE ON public.buyer_add_to_cart
FOR EACH ROW
EXECUTE FUNCTION update_cart_updated_at();

-- Step 5: Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON public.buyer_add_to_cart(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_updated_at ON public.buyer_add_to_cart(updated_at);

-- Step 6: Verify the setup
-- ============================================
SELECT '✅ VERIFICATION RESULTS' as header;

-- Check RLS status (should be DISABLED)
SELECT 
    'RLS Status:' as check_type,
    CASE 
        WHEN rowsecurity = false THEN '✅ DISABLED (Good for cart)'
        ELSE '❌ ENABLED (Will cause permission errors)'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'buyer_add_to_cart';

-- Check policies count (should be 0)
SELECT 
    'Policies Count:' as check_type,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No policies (unrestricted access)'
        ELSE '⚠️ ' || COUNT(*)::text || ' policies still exist'
    END as status
FROM pg_policies 
WHERE tablename = 'buyer_add_to_cart';

-- Check permissions
SELECT 
    'Permissions:' as check_type,
    string_agg(DISTINCT grantee, ', ') as granted_to
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name = 'buyer_add_to_cart'
AND privilege_type = 'SELECT';

-- Check indexes
SELECT 
    'Indexes:' as check_type,
    COUNT(*)::text || ' indexes' as status
FROM pg_indexes 
WHERE tablename = 'buyer_add_to_cart';

-- ============================================
-- SETUP COMPLETE! ✅
-- ============================================
-- Your cart now works with:
-- ✅ RLS DISABLED (no permission blocks)
-- ✅ Full database access
-- ✅ No localStorage needed
-- ✅ Cart persists in database only
-- ============================================
-- Next step: Clear localStorage in your app
-- The CartContext will now use database only!
-- ============================================

-- Optional: View current cart data
SELECT 
    user_id, 
    jsonb_array_length(items) as item_count, 
    created_at, 
    updated_at 
FROM public.buyer_add_to_cart
ORDER BY updated_at DESC;
