-- Verify that all orders have their corresponding order items
-- This will help us ensure the order items are properly linked

-- Check if all orders have order items
SELECT 'Orders without order items:' as info;
SELECT bo.id, bo.order_number, bo.buyer_id, bo.created_at
FROM buyer_orders bo
LEFT JOIN buyer_order_items oi ON bo.id = oi.order_id
WHERE oi.order_id IS NULL
ORDER BY bo.created_at DESC;

-- Check order items count for each order
SELECT 'Order items count per order:' as info;
SELECT 
    bo.id,
    bo.order_number,
    bo.buyer_id,
    COUNT(oi.id) as items_count,
    bo.created_at
FROM buyer_orders bo
LEFT JOIN buyer_order_items oi ON bo.id = oi.order_id
WHERE bo.buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9'
GROUP BY bo.id, bo.order_number, bo.buyer_id, bo.created_at
ORDER BY bo.created_at DESC;

-- Show all order items for the user
SELECT 'All order items for user:' as info;
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

-- Check total count
SELECT 'Total order items for user:' as info;
SELECT COUNT(*) as total_items
FROM buyer_order_items oi
LEFT JOIN buyer_orders bo ON oi.order_id = bo.id
WHERE bo.buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9';
