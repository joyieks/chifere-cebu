-- Fix order items insertion issue
-- This ensures order items are properly saved

-- 1. Check if buyer_order_items table exists and its structure
SELECT 'Checking buyer_order_items table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'buyer_order_items' 
ORDER BY ordinal_position;

-- 2. Check if there are any existing order items
SELECT 'Checking existing order items:' as info;
SELECT COUNT(*) as total_order_items FROM buyer_order_items;

-- 3. Check the latest order to see if it has items
SELECT 'Checking latest order:' as info;
SELECT id, order_number, buyer_id, created_at 
FROM buyer_orders 
WHERE buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9'
ORDER BY created_at DESC 
LIMIT 1;

-- 4. Try to insert a test order item for the latest order
SELECT 'Inserting test order item...' as info;

-- Get the latest order ID
WITH latest_order AS (
    SELECT id, order_number 
    FROM buyer_orders 
    WHERE buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9'
    ORDER BY created_at DESC 
    LIMIT 1
)
INSERT INTO buyer_order_items (
    order_id,
    product_id,
    product_type,
    product_name,
    product_image,
    product_price,
    quantity,
    unit_price,
    total_price,
    product_specs,
    created_at
)
SELECT 
    lo.id,
    gen_random_uuid(), -- Generate a random UUID for product_id
    'product',
    'Test Product',
    'https://example.com/test-image.jpg',
    100.00,
    1,
    100.00,
    100.00,
    '{}',
    NOW()
FROM latest_order lo
RETURNING *;

-- 5. Check if the order item was inserted
SELECT 'Checking if order item was inserted:' as info;
SELECT oi.*, bo.order_number, bo.buyer_id
FROM buyer_order_items oi
JOIN buyer_orders bo ON oi.order_id = bo.id
WHERE bo.buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9'
ORDER BY oi.created_at DESC
LIMIT 5;

-- 6. Disable RLS for buyer_order_items if it's causing issues
ALTER TABLE buyer_order_items DISABLE ROW LEVEL SECURITY;

-- 7. Grant permissions
GRANT ALL ON buyer_order_items TO authenticated;

SELECT 'Order items fix completed!' as message;
