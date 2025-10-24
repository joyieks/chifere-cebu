-- Test script to verify new order creation works correctly
-- This will help us ensure the buyer_id issue is fixed for future orders

-- Check current orders for the user
SELECT 'Current orders for user:' as info;
SELECT id, order_number, buyer_id, seller_id, status, payment_status, created_at
FROM buyer_orders 
WHERE buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9'
ORDER BY created_at DESC;

-- Check order items for the user
SELECT 'Order items for user:' as info;
SELECT 
    oi.id,
    oi.order_id,
    oi.product_name,
    oi.quantity,
    oi.total_price,
    bo.order_number,
    bo.buyer_id
FROM buyer_order_items oi
LEFT JOIN buyer_orders bo ON oi.order_id = bo.id
WHERE bo.buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9'
ORDER BY oi.created_at DESC;

-- Check total counts
SELECT 'Summary:' as info;
SELECT 
    (SELECT COUNT(*) FROM buyer_orders WHERE buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9') as user_orders,
    (SELECT COUNT(*) FROM buyer_order_items oi 
     LEFT JOIN buyer_orders bo ON oi.order_id = bo.id 
     WHERE bo.buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9') as user_order_items,
    (SELECT COUNT(*) FROM buyer_orders WHERE buyer_id IS NULL) as null_buyer_orders;

SELECT 'Ready for testing new order creation!' as message;
