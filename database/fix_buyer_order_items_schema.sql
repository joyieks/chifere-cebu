-- Fix buyer_order_items table schema
-- Add missing columns that are referenced in orderService.js

-- Add order_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_order_items' 
        AND column_name = 'order_id'
    ) THEN
        ALTER TABLE buyer_order_items 
        ADD COLUMN order_id UUID REFERENCES buyer_orders(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added order_id column to buyer_order_items';
    ELSE
        RAISE NOTICE 'order_id column already exists in buyer_order_items';
    END IF;
END $$;

-- Add product_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_order_items' 
        AND column_name = 'product_id'
    ) THEN
        ALTER TABLE buyer_order_items 
        ADD COLUMN product_id TEXT;
        
        RAISE NOTICE 'Added product_id column to buyer_order_items';
    ELSE
        RAISE NOTICE 'product_id column already exists in buyer_order_items';
    END IF;
END $$;

-- Add product_type column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_order_items' 
        AND column_name = 'product_type'
    ) THEN
        ALTER TABLE buyer_order_items 
        ADD COLUMN product_type TEXT DEFAULT 'product';
        
        RAISE NOTICE 'Added product_type column to buyer_order_items';
    ELSE
        RAISE NOTICE 'product_type column already exists in buyer_order_items';
    END IF;
END $$;

-- Add product_name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_order_items' 
        AND column_name = 'product_name'
    ) THEN
        ALTER TABLE buyer_order_items 
        ADD COLUMN product_name TEXT;
        
        RAISE NOTICE 'Added product_name column to buyer_order_items';
    ELSE
        RAISE NOTICE 'product_name column already exists in buyer_order_items';
    END IF;
END $$;

-- Add product_image column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_order_items' 
        AND column_name = 'product_image'
    ) THEN
        ALTER TABLE buyer_order_items 
        ADD COLUMN product_image TEXT;
        
        RAISE NOTICE 'Added product_image column to buyer_order_items';
    ELSE
        RAISE NOTICE 'product_image column already exists in buyer_order_items';
    END IF;
END $$;

-- Add product_price column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_order_items' 
        AND column_name = 'product_price'
    ) THEN
        ALTER TABLE buyer_order_items 
        ADD COLUMN product_price DECIMAL(10,2) DEFAULT 0;
        
        RAISE NOTICE 'Added product_price column to buyer_order_items';
    ELSE
        RAISE NOTICE 'product_price column already exists in buyer_order_items';
    END IF;
END $$;

-- Add quantity column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_order_items' 
        AND column_name = 'quantity'
    ) THEN
        ALTER TABLE buyer_order_items 
        ADD COLUMN quantity INTEGER DEFAULT 1;
        
        RAISE NOTICE 'Added quantity column to buyer_order_items';
    ELSE
        RAISE NOTICE 'quantity column already exists in buyer_order_items';
    END IF;
END $$;

-- Add unit_price column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_order_items' 
        AND column_name = 'unit_price'
    ) THEN
        ALTER TABLE buyer_order_items 
        ADD COLUMN unit_price DECIMAL(10,2) DEFAULT 0;
        
        RAISE NOTICE 'Added unit_price column to buyer_order_items';
    ELSE
        RAISE NOTICE 'unit_price column already exists in buyer_order_items';
    END IF;
END $$;

-- Add total_price column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_order_items' 
        AND column_name = 'total_price'
    ) THEN
        ALTER TABLE buyer_order_items 
        ADD COLUMN total_price DECIMAL(10,2) DEFAULT 0;
        
        RAISE NOTICE 'Added total_price column to buyer_order_items';
    ELSE
        RAISE NOTICE 'total_price column already exists in buyer_order_items';
    END IF;
END $$;

-- Add product_specs column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_order_items' 
        AND column_name = 'product_specs'
    ) THEN
        ALTER TABLE buyer_order_items 
        ADD COLUMN product_specs JSONB DEFAULT '{}';
        
        RAISE NOTICE 'Added product_specs column to buyer_order_items';
    ELSE
        RAISE NOTICE 'product_specs column already exists in buyer_order_items';
    END IF;
END $$;

-- Add created_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_order_items' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE buyer_order_items 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        RAISE NOTICE 'Added created_at column to buyer_order_items';
    ELSE
        RAISE NOTICE 'created_at column already exists in buyer_order_items';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_buyer_order_items_order_id ON buyer_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_buyer_order_items_product_id ON buyer_order_items(product_id);

-- Add RLS policies if they don't exist
DO $$ 
BEGIN
    -- Enable RLS
    ALTER TABLE buyer_order_items ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own order items" ON buyer_order_items;
    DROP POLICY IF EXISTS "Users can insert their own order items" ON buyer_order_items;
    DROP POLICY IF EXISTS "Sellers can view order items for their products" ON buyer_order_items;
    
    -- Create new policies
    CREATE POLICY "Users can view their own order items" ON buyer_order_items
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM buyer_orders 
                WHERE buyer_orders.id = buyer_order_items.order_id 
                AND buyer_orders.buyer_id = auth.uid()::text
            )
        );
    
    CREATE POLICY "Users can insert their own order items" ON buyer_order_items
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM buyer_orders 
                WHERE buyer_orders.id = buyer_order_items.order_id 
                AND buyer_orders.buyer_id = auth.uid()::text
            )
        );
    
    CREATE POLICY "Sellers can view order items for their products" ON buyer_order_items
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM buyer_orders 
                WHERE buyer_orders.id = buyer_order_items.order_id 
                AND buyer_orders.seller_id = auth.uid()::text
            )
        );
    
    RAISE NOTICE 'RLS policies created for buyer_order_items';
END $$;

DO $$ 
BEGIN
    RAISE NOTICE 'buyer_order_items table schema fixed successfully!';
END $$;
