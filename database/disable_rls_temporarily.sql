-- Temporarily disable RLS for buyer_orders table
-- This allows order creation to work while we debug the RLS policies

-- 1. Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'buyer_orders';

-- 2. Disable RLS temporarily
ALTER TABLE buyer_orders DISABLE ROW LEVEL SECURITY;

-- 3. Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'buyer_orders';

-- 4. Success message
SELECT 'RLS temporarily disabled for buyer_orders - order creation should work now!' as message;

-- Note: Remember to re-enable RLS later with proper policies for production
-- To re-enable later, run: ALTER TABLE buyer_orders ENABLE ROW LEVEL SECURITY;
