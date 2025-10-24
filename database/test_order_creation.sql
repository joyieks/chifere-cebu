-- Test order creation and retrieval
-- Run this in your Supabase SQL Editor to test if orders can be created and retrieved

-- First, let's check if the tables exist and their structure
SELECT 'Checking buyer_orders table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'buyer_orders' 
ORDER BY ordinal_position;

SELECT 'Checking buyer_order_items table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'buyer_order_items' 
ORDER BY ordinal_position;

-- Check RLS status
SELECT 'Checking RLS status:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('buyer_orders', 'buyer_order_items');

-- Test creating a simple order
INSERT INTO buyer_orders (
    order_number,
    buyer_id,
    seller_id,
    status,
    payment_status,
    delivery_status,
    subtotal,
    delivery_fee,
    total_amount,
    payment_method,
    payment_reference,
    delivery_address,
    notes,
    created_at,
    updated_at
) VALUES (
    'TEST-ORDER-001',
    'd7f43ccd-3576-43e3-ac94-ec60c7674df9', -- Use the actual user ID from console
    'demo_seller',
    'pending',
    'pending',
    'pending',
    100.00,
    50.00,
    150.00,
    'cod',
    'TEST-PAYMENT-001',
    '{"name": "Test User", "phone": "09123456789", "address": "Test Address"}',
    'Test order for debugging',
    NOW(),
    NOW()
) RETURNING *;

-- Test retrieving orders for the user
SELECT 'Testing order retrieval:' as info;
SELECT * FROM buyer_orders 
WHERE buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9'
ORDER BY created_at DESC;

-- Check if there are any RLS policies blocking access
SELECT 'Checking RLS policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('buyer_orders', 'buyer_order_items');

-- If RLS is enabled and blocking access, temporarily disable it for testing
-- ALTER TABLE buyer_orders DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE buyer_order_items DISABLE ROW LEVEL SECURITY;

SELECT 'Test completed. Check the results above.' as message;
