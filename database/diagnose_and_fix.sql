-- Diagnostic and Fix Script for Checkout System
-- This script will diagnose the issue and fix it step by step

-- Step 1: Check what tables exist
SELECT 'Checking existing tables...' as step;

SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('orders', 'order_items', 'order_status_history', 'order_notifications')
ORDER BY table_name;

-- Step 2: Check order_items table structure if it exists
SELECT 'Checking order_items table structure...' as step;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 3: Add missing product_type column if order_items table exists
DO $$
BEGIN
    -- Check if order_items table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'order_items' 
        AND table_schema = 'public'
    ) THEN
        -- Add product_type column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'order_items' 
            AND column_name = 'product_type'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE order_items ADD COLUMN product_type VARCHAR(20) DEFAULT 'product';
            RAISE NOTICE 'Added product_type column to order_items table';
        ELSE
            RAISE NOTICE 'product_type column already exists in order_items table';
        END IF;
        
        -- Add other missing columns
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'order_items' 
            AND column_name = 'product_specs'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE order_items ADD COLUMN product_specs JSONB DEFAULT '{}';
            RAISE NOTICE 'Added product_specs column to order_items table';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'order_items' 
            AND column_name = 'product_image'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE order_items ADD COLUMN product_image TEXT;
            RAISE NOTICE 'Added product_image column to order_items table';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'order_items' 
            AND column_name = 'product_price'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE order_items ADD COLUMN product_price DECIMAL(10,2) DEFAULT 0;
            RAISE NOTICE 'Added product_price column to order_items table';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'order_items' 
            AND column_name = 'unit_price'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE order_items ADD COLUMN unit_price DECIMAL(10,2) DEFAULT 0;
            RAISE NOTICE 'Added unit_price column to order_items table';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'order_items' 
            AND column_name = 'total_price'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE order_items ADD COLUMN total_price DECIMAL(10,2) DEFAULT 0;
            RAISE NOTICE 'Added total_price column to order_items table';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'order_items' 
            AND column_name = 'quantity'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE order_items ADD COLUMN quantity INTEGER DEFAULT 1;
            RAISE NOTICE 'Added quantity column to order_items table';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'order_items' 
            AND column_name = 'product_name'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE order_items ADD COLUMN product_name VARCHAR(255) DEFAULT 'Unknown Product';
            RAISE NOTICE 'Added product_name column to order_items table';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'order_items' 
            AND column_name = 'created_at'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE order_items ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added created_at column to order_items table';
        END IF;
        
        -- Update existing records to have proper defaults
        UPDATE order_items SET product_type = 'product' WHERE product_type IS NULL;
        UPDATE order_items SET product_name = 'Unknown Product' WHERE product_name IS NULL OR product_name = '';
        UPDATE order_items SET quantity = 1 WHERE quantity IS NULL OR quantity <= 0;
        UPDATE order_items SET product_price = 0 WHERE product_price IS NULL;
        UPDATE order_items SET unit_price = 0 WHERE unit_price IS NULL;
        UPDATE order_items SET total_price = 0 WHERE total_price IS NULL;
        UPDATE order_items SET product_specs = '{}' WHERE product_specs IS NULL;
        
        -- Make columns NOT NULL after setting defaults
        ALTER TABLE order_items ALTER COLUMN product_type SET NOT NULL;
        ALTER TABLE order_items ALTER COLUMN product_name SET NOT NULL;
        ALTER TABLE order_items ALTER COLUMN quantity SET NOT NULL;
        ALTER TABLE order_items ALTER COLUMN product_price SET NOT NULL;
        ALTER TABLE order_items ALTER COLUMN unit_price SET NOT NULL;
        ALTER TABLE order_items ALTER COLUMN total_price SET NOT NULL;
        
        RAISE NOTICE 'Updated existing records with proper defaults';
        
    ELSE
        RAISE NOTICE 'order_items table does not exist - will need to create it';
    END IF;
END $$;

-- Step 4: Add constraints if they don't exist
DO $$
BEGIN
    -- Add product_type constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'order_items' 
        AND constraint_name = 'valid_product_type'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE order_items ADD CONSTRAINT valid_product_type CHECK (product_type IN ('product', 'preloved', 'barter'));
        RAISE NOTICE 'Added valid_product_type constraint';
    END IF;
    
    -- Add quantity constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'order_items' 
        AND constraint_name = 'positive_quantity'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE order_items ADD CONSTRAINT positive_quantity CHECK (quantity > 0);
        RAISE NOTICE 'Added positive_quantity constraint';
    END IF;
    
    -- Add prices constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'order_items' 
        AND constraint_name = 'positive_prices'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE order_items ADD CONSTRAINT positive_prices CHECK (product_price >= 0 AND unit_price >= 0 AND total_price >= 0);
        RAISE NOTICE 'Added positive_prices constraint';
    END IF;
END $$;

-- Step 5: Verify the fix
SELECT 'Verifying the fix...' as step;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND table_schema = 'public'
AND column_name = 'product_type';

-- Step 6: Final verification
SELECT 'Final verification - checking all order_items columns...' as step;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Success message
SELECT 'Diagnostic and fix completed! Check the results above.' as message;
