-- Fix orders with NULL buyer_id
-- This will help us understand and fix the buyer_id issue

-- First, let's see which orders have NULL buyer_id
SELECT 'Orders with NULL buyer_id:' as info;
SELECT id, order_number, buyer_id, seller_id, status, payment_status, created_at
FROM buyer_orders 
WHERE buyer_id IS NULL
ORDER BY created_at DESC;

-- Check if there are any orders with valid buyer_id for reference
SELECT 'Orders with valid buyer_id:' as info;
SELECT id, order_number, buyer_id, seller_id, status, payment_status, created_at
FROM buyer_orders 
WHERE buyer_id IS NOT NULL
ORDER BY created_at DESC;

-- For testing purposes, let's update one of the NULL buyer_id orders
-- to use the same buyer_id as the working order
-- Replace 'd7f43ccd-3576-43e3-ac94-ec60c7674df9' with the actual user ID

-- Update the most recent order with NULL buyer_id to have a valid buyer_id
UPDATE buyer_orders 
SET buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9'
WHERE buyer_id IS NULL 
AND id = (
    SELECT id FROM buyer_orders 
    WHERE buyer_id IS NULL 
    ORDER BY created_at DESC 
    LIMIT 1
);

-- Check the result
SELECT 'Updated order:' as info;
SELECT id, order_number, buyer_id, seller_id, status, payment_status, created_at
FROM buyer_orders 
WHERE buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9'
ORDER BY created_at DESC;

-- Check remaining NULL buyer_id orders
SELECT 'Remaining orders with NULL buyer_id:' as info;
SELECT COUNT(*) as null_buyer_count FROM buyer_orders WHERE buyer_id IS NULL;
