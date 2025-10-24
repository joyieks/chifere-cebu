-- Quick Fix for Missing product_type Column
-- Run this if you're getting the "column product_type does not exist" error

-- Add the missing product_type column to order_items table
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_type VARCHAR(20) DEFAULT 'product';

-- Add constraint for product_type
ALTER TABLE order_items ADD CONSTRAINT IF NOT EXISTS valid_product_type CHECK (product_type IN ('product', 'preloved', 'barter'));

-- Update existing records to have a default product_type
UPDATE order_items SET product_type = 'product' WHERE product_type IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE order_items ALTER COLUMN product_type SET NOT NULL;

-- Success message
SELECT 'product_type column added successfully!' as message;
