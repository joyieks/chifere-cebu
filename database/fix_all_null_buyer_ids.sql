-- Fix ALL orders with NULL buyer_id
-- This will assign all NULL buyer_id orders to the current user

-- First, let's see all orders with NULL buyer_id
SELECT 'All orders with NULL buyer_id:' as info;
SELECT id, order_number, buyer_id, seller_id, status, payment_status, created_at
FROM buyer_orders 
WHERE buyer_id IS NULL
ORDER BY created_at DESC;

-- Update ALL orders with NULL buyer_id to use the working user ID
-- Replace 'd7f43ccd-3576-43e3-ac94-ec60c7674df9' with your actual user ID
UPDATE buyer_orders 
SET buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9'
WHERE buyer_id IS NULL;

-- Check how many orders were updated
SELECT 'Orders updated:' as info;
SELECT COUNT(*) as updated_count 
FROM buyer_orders 
WHERE buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9';

-- Verify no more NULL buyer_id orders exist
SELECT 'Remaining NULL buyer_id orders:' as info;
SELECT COUNT(*) as null_buyer_count 
FROM buyer_orders 
WHERE buyer_id IS NULL;

-- Show all orders for the user now
SELECT 'All orders for user:' as info;
SELECT id, order_number, buyer_id, seller_id, status, payment_status, created_at
FROM buyer_orders 
WHERE buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9'
ORDER BY created_at DESC;

SELECT 'All NULL buyer_id orders have been fixed!' as message;
