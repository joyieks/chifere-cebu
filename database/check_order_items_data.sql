-- Check what order items data is actually stored
-- This will help us understand what item details are available

-- Check order items for the user with all details
SELECT 'Order items with full details:' as info;
SELECT 
    oi.id,
    oi.order_id,
    oi.product_id,
    oi.product_name,
    oi.product_image,
    oi.product_price,
    oi.quantity,
    oi.total_price,
    bo.order_number,
    bo.buyer_id,
    bo.status
FROM buyer_order_items oi
LEFT JOIN buyer_orders bo ON oi.order_id = bo.id
WHERE bo.buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9'
ORDER BY oi.created_at DESC;

-- Check if product images are valid URLs
SELECT 'Product images check:' as info;
SELECT 
    oi.product_name,
    oi.product_image,
    CASE 
        WHEN oi.product_image LIKE 'http%' THEN 'Valid URL'
        WHEN oi.product_image = '' THEN 'Empty'
        ELSE 'Invalid/Other'
    END as image_status
FROM buyer_order_items oi
LEFT JOIN buyer_orders bo ON oi.order_id = bo.id
WHERE bo.buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9'
ORDER BY oi.created_at DESC;

-- Check total items count
SELECT 'Total order items for user:' as info;
SELECT COUNT(*) as total_items
FROM buyer_order_items oi
LEFT JOIN buyer_orders bo ON oi.order_id = bo.id
WHERE bo.buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9';
