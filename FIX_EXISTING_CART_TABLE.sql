-- ============================================
-- ChiFere Cart - Fix Existing Table
-- ============================================
-- This script fixes the existing buyer_add_to_cart table
-- to ensure proper RLS policies and permissions
-- ============================================

-- Step 1: Check current table structure
-- ============================================
SELECT 
    'Current Table Structure' as info,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'buyer_add_to_cart'
ORDER BY ordinal_position;

-- Step 2: Enable Row Level Security (if not enabled)
-- ============================================
ALTER TABLE public.buyer_add_to_cart ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop old policies (clean slate)
-- ============================================
DROP POLICY IF EXISTS "Users can view their own cart" ON public.buyer_add_to_cart;
DROP POLICY IF EXISTS "Users can insert their own cart" ON public.buyer_add_to_cart;
DROP POLICY IF EXISTS "Users can update their own cart" ON public.buyer_add_to_cart;
DROP POLICY IF EXISTS "Users can delete their own cart" ON public.buyer_add_to_cart;
DROP POLICY IF EXISTS "Users can manage their cart" ON public.buyer_add_to_cart;
DROP POLICY IF EXISTS "Authenticated users can manage their own carts" ON public.buyer_add_to_cart;

-- Step 4: Create NEW RLS Policies
-- ============================================

-- Policy 1: SELECT - Users can view their own cart
CREATE POLICY "Users can view their own cart"
ON public.buyer_add_to_cart
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: INSERT - Users can create their own cart
CREATE POLICY "Users can insert their own cart"
ON public.buyer_add_to_cart
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 3: UPDATE - Users can update their own cart
CREATE POLICY "Users can update their own cart"
ON public.buyer_add_to_cart
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: DELETE - Users can delete their own cart
CREATE POLICY "Users can delete their own cart"
ON public.buyer_add_to_cart
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Step 5: Ensure proper permissions
-- ============================================
GRANT ALL ON public.buyer_add_to_cart TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 6: Create/Update trigger for auto-updating updated_at
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

-- Step 7: Create indexes if they don't exist
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON public.buyer_add_to_cart(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_updated_at ON public.buyer_add_to_cart(updated_at);

-- Step 8: Verify the setup
-- ============================================
SELECT '✅ VERIFICATION RESULTS' as header;

-- Check RLS status
SELECT 
    'RLS Status:' as check_type,
    CASE 
        WHEN rowsecurity = true THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'buyer_add_to_cart';

-- Check policies count
SELECT 
    'Policies Count:' as check_type,
    COUNT(*)::text || ' policies' as status
FROM pg_policies 
WHERE tablename = 'buyer_add_to_cart';

-- List all policies
SELECT 
    'Policy Details' as info,
    policyname,
    cmd as operation,
    CASE 
        WHEN qual::text LIKE '%auth.uid()%' THEN '✅ Secure'
        ELSE '⚠️ Check security'
    END as security_status
FROM pg_policies 
WHERE tablename = 'buyer_add_to_cart'
ORDER BY cmd;

-- Check indexes
SELECT 
    'Indexes:' as check_type,
    COUNT(*)::text || ' indexes' as status
FROM pg_indexes 
WHERE tablename = 'buyer_add_to_cart';

-- ============================================
-- SETUP COMPLETE! ✅
-- ============================================
-- Your existing cart table is now fixed with:
-- ✅ Proper RLS policies
-- ✅ Correct permissions
-- ✅ Auto-update trigger
-- ✅ Performance indexes
-- ============================================

-- Optional: View current cart data
-- SELECT user_id, jsonb_array_length(items) as item_count, created_at, updated_at 
-- FROM public.buyer_add_to_cart;
