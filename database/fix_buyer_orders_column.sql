-- Quick fix for buyer_orders table column issue
-- This fixes the "user_id" vs "buyer_id" column mismatch

-- 1. Check if buyer_orders table exists and what columns it has
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'buyer_orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. If the table has user_id column, rename it to buyer_id
DO $$
BEGIN
    -- Check if user_id column exists and buyer_id doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_orders' 
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_orders' 
        AND column_name = 'buyer_id'
        AND table_schema = 'public'
    ) THEN
        -- Rename user_id to buyer_id
        ALTER TABLE buyer_orders RENAME COLUMN user_id TO buyer_id;
        RAISE NOTICE 'Renamed user_id column to buyer_id';
    END IF;
END $$;

-- 3. Add notes column if it doesn't exist
ALTER TABLE buyer_orders 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. Update RLS policies to use buyer_id
DROP POLICY IF EXISTS "Users can view their own orders" ON buyer_orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON buyer_orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON buyer_orders;

CREATE POLICY "Users can view their own orders" ON buyer_orders
    FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Users can insert their own orders" ON buyer_orders
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update their own orders" ON buyer_orders
    FOR UPDATE USING (auth.uid() = buyer_id);

-- 5. Verify the fix
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'buyer_orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Success message
SELECT 'buyer_orders table fixed successfully!' as message;
