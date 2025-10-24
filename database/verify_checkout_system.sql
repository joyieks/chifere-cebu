-- Verification Script for Checkout System
-- Run this to verify that all tables and columns are properly set up

-- Step 1: Check all checkout-related tables exist
SELECT 'Checking if all tables exist...' as verification_step;

SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('orders', 'order_items', 'order_status_history', 'order_notifications') 
        THEN '✅ Required table exists'
        ELSE '❌ Missing required table'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('orders', 'order_items', 'order_status_history', 'order_notifications')
ORDER BY table_name;

-- Step 2: Verify order_items table has all required columns
SELECT 'Checking order_items table columns...' as verification_step;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('id', 'order_id', 'product_id', 'product_type', 'product_name', 'product_image', 'product_price', 'quantity', 'unit_price', 'total_price', 'product_specs', 'created_at')
        THEN '✅ Required column'
        ELSE '⚠️ Additional column'
    END as status
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 3: Verify orders table has all required columns
SELECT 'Checking orders table columns...' as verification_step;

SELECT 
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name IN ('id', 'order_number', 'buyer_id', 'seller_id', 'total_amount', 'subtotal', 'shipping_fee', 'tax_amount', 'payment_method', 'payment_status', 'payment_reference', 'shipping_address', 'shipping_contact', 'status', 'status_updated_at', 'created_at', 'updated_at', 'buyer_notes', 'seller_notes')
        THEN '✅ Required column'
        ELSE '⚠️ Additional column'
    END as status
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 4: Check constraints are in place
SELECT 'Checking constraints...' as verification_step;

SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    CASE 
        WHEN tc.constraint_name IN ('valid_product_type', 'positive_quantity', 'positive_prices', 'valid_payment_method', 'valid_payment_status', 'valid_order_status', 'positive_amounts')
        THEN '✅ Required constraint'
        ELSE '⚠️ Other constraint'
    END as status
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public' 
AND tc.table_name IN ('orders', 'order_items')
ORDER BY tc.table_name, tc.constraint_name;

-- Step 5: Check indexes are created
SELECT 'Checking indexes...' as verification_step;

SELECT 
    schemaname,
    tablename,
    indexname,
    CASE 
        WHEN indexname LIKE 'idx_%'
        THEN '✅ Performance index'
        ELSE '⚠️ Other index'
    END as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('orders', 'order_items', 'order_status_history', 'order_notifications')
ORDER BY tablename, indexname;

-- Step 6: Check functions exist
SELECT 'Checking database functions...' as verification_step;

SELECT 
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name IN ('generate_order_number', 'update_order_status', 'calculate_order_totals', 'update_order_totals')
        THEN '✅ Required function'
        ELSE '⚠️ Other function'
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('generate_order_number', 'update_order_status', 'calculate_order_totals', 'update_order_totals')
ORDER BY routine_name;

-- Step 7: Test the product_type column specifically
SELECT 'Testing product_type column...' as verification_step;

-- This should work without errors if the column exists
SELECT 
    'product_type column test' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'order_items' 
            AND column_name = 'product_type'
            AND table_schema = 'public'
        ) 
        THEN '✅ product_type column exists and is accessible'
        ELSE '❌ product_type column is missing'
    END as result;

-- Step 8: Summary
SELECT 'SUMMARY: Checkout System Status' as verification_step;

SELECT 
    'Tables' as component,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 4 
        THEN '✅ All 4 required tables exist'
        ELSE '❌ Missing tables (expected: 4, found: ' || COUNT(*) || ')'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('orders', 'order_items', 'order_status_history', 'order_notifications')

UNION ALL

SELECT 
    'order_items columns' as component,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 12 
        THEN '✅ All required columns exist'
        ELSE '❌ Missing columns (expected: 12+, found: ' || COUNT(*) || ')'
    END as status
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND table_schema = 'public'

UNION ALL

SELECT 
    'orders columns' as component,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 19 
        THEN '✅ All required columns exist'
        ELSE '❌ Missing columns (expected: 19+, found: ' || COUNT(*) || ')'
    END as status
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'

UNION ALL

SELECT 
    'Functions' as component,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 4 
        THEN '✅ All required functions exist'
        ELSE '❌ Missing functions (expected: 4+, found: ' || COUNT(*) || ')'
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('generate_order_number', 'update_order_status', 'calculate_order_totals', 'update_order_totals');

-- Final success message
SELECT 'Verification completed! If you see ✅ for all components above, your checkout system is ready to use!' as final_message;
