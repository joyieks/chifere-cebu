-- Fix cart table column issues
-- This addresses the "column product_id named in key does not exist" error

-- 1. First, let's see what columns actually exist in buyer_add_to_cart
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'buyer_add_to_cart' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Drop the problematic constraint that references non-existent columns
ALTER TABLE buyer_add_to_cart DROP CONSTRAINT IF EXISTS buyer_add_to_cart_user_product_unique;

-- 3. Add missing columns if they don't exist
ALTER TABLE buyer_add_to_cart ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE buyer_add_to_cart ADD COLUMN IF NOT EXISTS product_type VARCHAR(50);

-- 4. Create a simpler unique constraint that only uses existing columns
-- Let's first check what columns we have after adding the missing ones
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'buyer_add_to_cart' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Create a unique constraint only on user_id (one cart per user)
ALTER TABLE buyer_add_to_cart 
ADD CONSTRAINT buyer_add_to_cart_user_unique 
UNIQUE (user_id);

-- 6. If the above fails, let's try a different approach - no unique constraints for now
-- ALTER TABLE buyer_add_to_cart DROP CONSTRAINT IF EXISTS buyer_add_to_cart_user_unique;

-- 7. Verify the table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'buyer_add_to_cart' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Success message
SELECT 'Cart table columns fixed successfully!' as message;
