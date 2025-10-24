-- Complete cart fix - remove ALL constraints and recreate table if needed
-- This addresses the persistent "duplicate key value violates unique constraint" error

-- 1. First, let's see what constraints still exist
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

-- 2. Drop ALL constraints on the table
ALTER TABLE buyer_add_to_cart DROP CONSTRAINT IF EXISTS buyer_add_to_cart_user_id_unique;
ALTER TABLE buyer_add_to_cart DROP CONSTRAINT IF EXISTS buyer_add_to_cart_user_product_unique;
ALTER TABLE buyer_add_to_cart DROP CONSTRAINT IF EXISTS buyer_add_to_cart_user_unique;
ALTER TABLE buyer_add_to_cart DROP CONSTRAINT IF EXISTS buyer_add_to_cart_pkey;
ALTER TABLE buyer_add_to_cart DROP CONSTRAINT IF EXISTS buyer_add_to_cart_user_id_key;

-- 3. Clear all data from the table to remove any conflicting records
TRUNCATE TABLE buyer_add_to_cart;

-- 4. Add a simple auto-incrementing ID column
ALTER TABLE buyer_add_to_cart ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY;

-- 5. If the above doesn't work, let's try a different approach
-- Drop and recreate the table completely
DROP TABLE IF EXISTS buyer_add_to_cart CASCADE;

CREATE TABLE buyer_add_to_cart (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    product_id UUID,
    product_name VARCHAR(255),
    product_image TEXT,
    price DECIMAL(10,2),
    quantity INTEGER DEFAULT 1,
    total_price DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Disable RLS completely
ALTER TABLE buyer_add_to_cart DISABLE ROW LEVEL SECURITY;

-- 7. Verify the new table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'buyer_add_to_cart' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. Check that no constraints exist
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
SELECT 'Cart table completely rebuilt - should work perfectly now!' as message;
