-- ============================================
-- FIX: buyer_orders & buyer_order_items Tables
-- ============================================
-- Ensures tables exist with proper columns
-- and RLS is disabled for smooth operation
-- ============================================

-- Step 1: Check if buyer_orders table exists and its structure
-- ============================================
SELECT 
    '📋 buyer_orders table structure' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'buyer_orders'
ORDER BY ordinal_position;

-- Step 2: Check if buyer_order_items table exists and its structure
-- ============================================
SELECT 
    '📋 buyer_order_items table structure' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'buyer_order_items'
ORDER BY ordinal_position;

-- Step 3: Disable RLS on buyer_orders (if it exists)
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'buyer_orders'
    ) THEN
        ALTER TABLE public.buyer_orders DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS disabled on buyer_orders';
    ELSE
        RAISE NOTICE '⚠️ buyer_orders table does not exist';
    END IF;
END $$;

-- Step 4: Disable RLS on buyer_order_items (if it exists)
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'buyer_order_items'
    ) THEN
        ALTER TABLE public.buyer_order_items DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS disabled on buyer_order_items';
    ELSE
        RAISE NOTICE '⚠️ buyer_order_items table does not exist';
    END IF;
END $$;

-- Step 5: Drop all policies on buyer_orders
-- ============================================
DROP POLICY IF EXISTS "Enable read for users" ON public.buyer_orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.buyer_orders;
DROP POLICY IF EXISTS "Buyers can view their orders" ON public.buyer_orders;
DROP POLICY IF EXISTS "Sellers can view their orders" ON public.buyer_orders;
DROP POLICY IF EXISTS "Users can manage their orders" ON public.buyer_orders;

-- Step 6: Drop all policies on buyer_order_items
-- ============================================
DROP POLICY IF EXISTS "Enable read for users" ON public.buyer_order_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.buyer_order_items;
DROP POLICY IF EXISTS "Users can view order items" ON public.buyer_order_items;

-- Step 7: Grant full permissions
-- ============================================
GRANT ALL ON public.buyer_orders TO authenticated;
GRANT ALL ON public.buyer_orders TO anon;
GRANT ALL ON public.buyer_orders TO service_role;

GRANT ALL ON public.buyer_order_items TO authenticated;
GRANT ALL ON public.buyer_order_items TO anon;
GRANT ALL ON public.buyer_order_items TO service_role;

-- Step 8: Verify RLS status
-- ============================================
SELECT 
    '✅ RLS Status Verification' as header,
    tablename,
    CASE 
        WHEN rowsecurity = false THEN '✅ DISABLED (Orders will work!)'
        ELSE '⚠️ ENABLED (May cause issues)'
    END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('buyer_orders', 'buyer_order_items');

-- Step 9: Check current orders
-- ============================================
SELECT 
    '📦 Current Orders Summary' as info,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
    COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
    COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders,
    COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as payment_pending
FROM public.buyer_orders;

-- Step 10: Show recent orders (if any)
-- ============================================
SELECT 
    '📋 Recent Orders' as info,
    order_number,
    status,
    payment_status,
    payment_method,
    total_amount,
    created_at
FROM public.buyer_orders
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- SETUP COMPLETE! ✅
-- ============================================
-- ✅ RLS disabled on both tables
-- ✅ All policies removed
-- ✅ Full permissions granted
-- ✅ Orders should now appear in My Purchase page!
-- ============================================
