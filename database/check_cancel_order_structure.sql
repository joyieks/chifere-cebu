-- Check if the database supports order cancellation
-- This will help us understand the current structure for order cancellation

-- Check the structure of buyer_orders table
SELECT 'buyer_orders table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'buyer_orders' 
ORDER BY ordinal_position;

-- Check if there are any orders with cancelled status
SELECT 'Orders with cancelled status:' as info;
SELECT id, order_number, buyer_id, status, payment_status, created_at
FROM buyer_orders 
WHERE status = 'cancelled'
ORDER BY created_at DESC;

-- Check all possible status values
SELECT 'All order statuses:' as info;
SELECT status, COUNT(*) as count
FROM buyer_orders 
GROUP BY status
ORDER BY count DESC;

-- Check if cancellation_reason column exists and has data
SELECT 'Cancellation reason column check:' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'buyer_orders' 
            AND column_name = 'cancellation_reason'
        ) THEN 'cancellation_reason column exists'
        ELSE 'cancellation_reason column does not exist'
    END as cancellation_reason_status;

-- Check if cancelled_at column exists
SELECT 'Cancelled at column check:' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'buyer_orders' 
            AND column_name = 'cancelled_at'
        ) THEN 'cancelled_at column exists'
        ELSE 'cancelled_at column does not exist'
    END as cancelled_at_status;
