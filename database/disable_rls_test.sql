-- Temporarily disable RLS to test if that's causing the issue
-- This is a quick test to confirm RLS is the problem

-- Disable RLS on buyer_orders
ALTER TABLE buyer_orders DISABLE ROW LEVEL SECURITY;

-- Disable RLS on buyer_order_items  
ALTER TABLE buyer_order_items DISABLE ROW LEVEL SECURITY;

-- Test if orders are now visible
SELECT 'Testing without RLS - all orders:' as info;
SELECT id, order_number, buyer_id, status, total_amount, created_at
FROM buyer_orders
ORDER BY created_at DESC;

-- Test if order items are now visible
SELECT 'Testing without RLS - all order items:' as info;
SELECT oi.id, oi.order_id, oi.product_name, oi.quantity, oi.total_price, bo.order_number, bo.buyer_id
FROM buyer_order_items oi
LEFT JOIN buyer_orders bo ON oi.order_id = bo.id
ORDER BY oi.created_at DESC;

-- Check RLS status
SELECT 'RLS status after disabling:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('buyer_orders', 'buyer_order_items')
AND schemaname = 'public';

SELECT 'RLS disabled for testing!' as message;
