-- Simple Fix for product_type Column Error
-- Run this single command to fix the issue

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_type VARCHAR(20) DEFAULT 'product';

-- Make it NOT NULL after adding
ALTER TABLE order_items ALTER COLUMN product_type SET NOT NULL;

-- Add constraint
ALTER TABLE order_items ADD CONSTRAINT IF NOT EXISTS valid_product_type CHECK (product_type IN ('product', 'preloved', 'barter'));

-- Update any existing NULL values
UPDATE order_items SET product_type = 'product' WHERE product_type IS NULL;

SELECT 'product_type column added successfully!' as result;
