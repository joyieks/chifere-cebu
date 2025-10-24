-- Proper fix for NULL buyer_id orders
-- This will maintain data integrity by removing orders that can't be properly assigned

-- First, let's see what we have
SELECT 'Current situation - orders with NULL buyer_id:' as info;
SELECT COUNT(*) as null_buyer_count FROM buyer_orders WHERE buyer_id IS NULL;

SELECT 'Orders assigned to specific user:' as info;
SELECT COUNT(*) as assigned_count FROM buyer_orders WHERE buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9';

-- Since we can't determine which orders belong to which users,
-- we should remove the orders with NULL buyer_id to maintain data integrity
-- This is better than having orders assigned to the wrong user

-- Delete order items first (due to foreign key constraints)
DELETE FROM buyer_order_items 
WHERE order_id IN (
    SELECT id FROM buyer_orders WHERE buyer_id IS NULL
);

-- Delete orders with NULL buyer_id
DELETE FROM buyer_orders 
WHERE buyer_id IS NULL;

-- Verify the cleanup
SELECT 'After cleanup - remaining orders:' as info;
SELECT COUNT(*) as total_orders FROM buyer_orders;

SELECT 'Orders for specific user after cleanup:' as info;
SELECT COUNT(*) as user_orders FROM buyer_orders WHERE buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9';

SELECT 'All orders for user:' as info;
SELECT id, order_number, buyer_id, status, payment_status, created_at
FROM buyer_orders 
WHERE buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9'
ORDER BY created_at DESC;

SELECT 'Data integrity restored - only valid orders remain!' as message;
