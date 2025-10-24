-- Check the actual data types of columns in buyer_order_items table
-- This will help us understand what data types are expected

SELECT 'Checking buyer_order_items column types:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'buyer_order_items' 
ORDER BY ordinal_position;

-- Check if product_id is UUID or TEXT
SELECT 'Checking product_id column specifically:' as info;
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'buyer_order_items' 
AND column_name = 'product_id';

-- If product_id is UUID, we need to either:
-- 1. Change it to TEXT, or
-- 2. Generate proper UUIDs

-- Option 1: Change product_id to TEXT (if it's currently UUID)
-- ALTER TABLE buyer_order_items ALTER COLUMN product_id TYPE TEXT;

-- Option 2: Keep it as UUID and generate proper UUIDs in the application
-- (This is what we'll do)

SELECT 'Column type check completed!' as message;
