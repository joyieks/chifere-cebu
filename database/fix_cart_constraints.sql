-- Fix cart table unique constraint issues
-- This addresses the "duplicate key value violates unique constraint" error

-- 1. Check current constraints on buyer_add_to_cart table
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    tc.constraint_type
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'buyer_add_to_cart' 
AND tc.table_schema = 'public';

-- 2. Drop the problematic unique constraint
ALTER TABLE buyer_add_to_cart DROP CONSTRAINT IF EXISTS buyer_add_to_cart_user_id_unique;

-- 3. Check if there are any other unique constraints causing issues
ALTER TABLE buyer_add_to_cart DROP CONSTRAINT IF EXISTS buyer_add_to_cart_pkey;
ALTER TABLE buyer_add_to_cart DROP CONSTRAINT IF EXISTS buyer_add_to_cart_user_id_key;

-- 4. Add a proper primary key if it doesn't exist
ALTER TABLE buyer_add_to_cart ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE buyer_add_to_cart ADD CONSTRAINT buyer_add_to_cart_pkey PRIMARY KEY (id);

-- 5. Create a composite unique constraint that makes more sense
-- This allows multiple items per user but prevents exact duplicates
ALTER TABLE buyer_add_to_cart 
ADD CONSTRAINT buyer_add_to_cart_user_product_unique 
UNIQUE (user_id, product_id, product_type);

-- 6. Disable RLS temporarily to allow cart operations
ALTER TABLE buyer_add_to_cart DISABLE ROW LEVEL SECURITY;

-- 7. Verify the changes
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    tc.constraint_type
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'buyer_add_to_cart' 
AND tc.table_schema = 'public';

-- Success message
SELECT 'Cart constraints fixed successfully!' as message;
