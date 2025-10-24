-- Debug the complete order flow
-- This will help us understand the entire process from creation to retrieval

-- 1. Check current user session (this would be the auth.uid() in RLS)
SELECT 'Current auth user (if any):' as info;
SELECT auth.uid() as current_auth_user_id;

-- 2. Check all orders and their buyer_ids
SELECT 'All orders with buyer_id details:' as info;
SELECT 
    id,
    order_number,
    buyer_id,
    seller_id,
    status,
    total_amount,
    created_at,
    -- Check if buyer_id matches any known user
    CASE 
        WHEN buyer_id = auth.uid()::text THEN 'MATCHES_AUTH_UID'
        ELSE 'NO_MATCH'
    END as auth_match
FROM buyer_orders 
ORDER BY created_at DESC;

-- 3. Check order items for each order
SELECT 'Order items with order details:' as info;
SELECT 
    oi.id as item_id,
    oi.order_id,
    oi.product_name,
    oi.quantity,
    oi.total_price,
    bo.order_number,
    bo.buyer_id,
    bo.status as order_status
FROM buyer_order_items oi
LEFT JOIN buyer_orders bo ON oi.order_id = bo.id
ORDER BY oi.created_at DESC;

-- 4. Test the exact query that MyPurchase uses
-- First, let's see what buyer_ids exist
SELECT 'Distinct buyer_ids in orders:' as info;
SELECT DISTINCT buyer_id, COUNT(*) as order_count
FROM buyer_orders 
GROUP BY buyer_id;

-- 5. Test RLS by trying to select orders (this will show what RLS allows)
SELECT 'Testing RLS - what orders can be seen:' as info;
SELECT id, order_number, buyer_id, status, total_amount
FROM buyer_orders
ORDER BY created_at DESC;

-- 6. Test order items RLS
SELECT 'Testing RLS - what order items can be seen:' as info;
SELECT oi.id, oi.order_id, oi.product_name, oi.quantity
FROM buyer_order_items oi
ORDER BY oi.created_at DESC;

-- 7. Check if there are any RLS policies that might be blocking access
SELECT 'RLS status on tables:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('buyer_orders', 'buyer_order_items')
AND schemaname = 'public';
