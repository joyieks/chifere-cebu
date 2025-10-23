-- ============================================
-- ChiFere Cart Database Setup
-- ============================================
-- This script sets up the buyer_add_to_cart table
-- with proper RLS policies to persist cart items
-- across sessions and devices.
-- ============================================

-- Step 1: Create the buyer_add_to_cart table
-- ============================================
CREATE TABLE IF NOT EXISTS public.buyer_add_to_cart (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Step 2: Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON public.buyer_add_to_cart(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_updated_at ON public.buyer_add_to_cart(updated_at);

-- Step 3: Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE public.buyer_add_to_cart ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies (clean slate)
-- ============================================
DROP POLICY IF EXISTS "Users can view their own cart" ON public.buyer_add_to_cart;
DROP POLICY IF EXISTS "Users can insert their own cart" ON public.buyer_add_to_cart;
DROP POLICY IF EXISTS "Users can update their own cart" ON public.buyer_add_to_cart;
DROP POLICY IF EXISTS "Users can delete their own cart" ON public.buyer_add_to_cart;
DROP POLICY IF EXISTS "Users can manage their cart" ON public.buyer_add_to_cart;

-- Step 5: Create RLS Policies
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

-- Step 6: Create trigger to auto-update updated_at
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

-- Step 7: Grant necessary permissions
-- ============================================
GRANT ALL ON public.buyer_add_to_cart TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 8: Verify setup
-- ============================================
-- Check if table exists
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'buyer_add_to_cart';

-- Check RLS status
SELECT 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'buyer_add_to_cart';

-- Check policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'buyer_add_to_cart'
ORDER BY policyname;

-- Check indexes
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'buyer_add_to_cart';

-- ============================================
-- SETUP COMPLETE! ✅
-- ============================================
-- Your cart will now persist in the database.
-- Users can:
-- - Add items to cart (saved immediately)
-- - Remove items from cart
-- - Cart persists across logout/login
-- - Cart syncs across devices
-- ============================================

-- Optional: View all carts (for testing)
-- SELECT user_id, items, created_at, updated_at FROM public.buyer_add_to_cart;
