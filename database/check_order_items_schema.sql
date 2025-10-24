-- Check the schema of buyer_order_items table
-- This will help us understand what columns exist and what we need to add

-- Check current structure of buyer_order_items table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'buyer_order_items'
ORDER BY ordinal_position;

-- Check if seller_id column exists in buyer_order_items
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'buyer_order_items' 
AND column_name = 'seller_id';

-- Check current data in buyer_order_items
SELECT 
    id,
    order_id,
    product_id,
    product_name,
    quantity,
    unit_price,
    total_price,
    created_at
FROM buyer_order_items 
LIMIT 5;

-- Check if there are any seller_id columns in the table
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'buyer_order_items' 
AND column_name LIKE '%seller%';
