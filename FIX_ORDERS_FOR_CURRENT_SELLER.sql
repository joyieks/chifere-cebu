-- FIX ORDERS FOR CURRENT SELLER
-- This script will assign all orders to the current seller

-- Step 1: Show current situation
SELECT 'Current seller ID from console:' as info;
SELECT '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e' as current_seller_id;

SELECT 'Orders with different seller IDs:' as info;
SELECT 
    'buyer_orders' as table_name,
    order_number,
    seller_id,
    buyer_id,
    status,
    total_amount,
    created_at
FROM buyer_orders 
WHERE seller_id != '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
ORDER BY created_at DESC;

SELECT 
    'orders' as table_name,
    order_number,
    seller_id,
    buyer_id,
    status,
    total_amount,
    created_at
FROM orders 
WHERE seller_id != '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
ORDER BY created_at DESC;

-- Step 2: Update all orders to belong to current seller
UPDATE buyer_orders 
SET seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
WHERE seller_id != '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e';

UPDATE orders 
SET seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
WHERE seller_id != '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e';

-- Step 3: Show results after update
SELECT 'Orders after update - buyer_orders:' as info;
SELECT 
    order_number,
    seller_id,
    buyer_id,
    status,
    total_amount,
    created_at
FROM buyer_orders 
ORDER BY created_at DESC;

SELECT 'Orders after update - orders:' as info;
SELECT 
    order_number,
    seller_id,
    buyer_id,
    status,
    total_amount,
    created_at
FROM orders 
ORDER BY created_at DESC;

-- Step 4: Verify the fix
SELECT 'Verification - Orders for current seller:' as info;
SELECT 
    'buyer_orders' as table_name,
    COUNT(*) as order_count
FROM buyer_orders 
WHERE seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
UNION ALL
SELECT 
    'orders' as table_name,
    COUNT(*) as order_count
FROM orders 
WHERE seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e';

SELECT 'Fix completed! Refresh the seller Order Management page.' as status;
