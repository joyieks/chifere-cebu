-- Fix buyer_orders table schema
-- Add missing columns that are referenced in orderService.js

-- Add payment_reference column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_orders' 
        AND column_name = 'payment_reference'
    ) THEN
        ALTER TABLE buyer_orders 
        ADD COLUMN payment_reference TEXT;
        
        RAISE NOTICE 'Added payment_reference column to buyer_orders';
    ELSE
        RAISE NOTICE 'payment_reference column already exists in buyer_orders';
    END IF;
END $$;

-- Add notes column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_orders' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE buyer_orders 
        ADD COLUMN notes TEXT;
        
        RAISE NOTICE 'Added notes column to buyer_orders';
    ELSE
        RAISE NOTICE 'notes column already exists in buyer_orders';
    END IF;
END $$;

-- Add delivery_address column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_orders' 
        AND column_name = 'delivery_address'
    ) THEN
        ALTER TABLE buyer_orders 
        ADD COLUMN delivery_address JSONB;
        
        RAISE NOTICE 'Added delivery_address column to buyer_orders';
    ELSE
        RAISE NOTICE 'delivery_address column already exists in buyer_orders';
    END IF;
END $$;

-- Add payment_method column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_orders' 
        AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE buyer_orders 
        ADD COLUMN payment_method TEXT DEFAULT 'cod';
        
        RAISE NOTICE 'Added payment_method column to buyer_orders';
    ELSE
        RAISE NOTICE 'payment_method column already exists in buyer_orders';
    END IF;
END $$;

-- Add payment_status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_orders' 
        AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE buyer_orders 
        ADD COLUMN payment_status TEXT DEFAULT 'pending';
        
        RAISE NOTICE 'Added payment_status column to buyer_orders';
    ELSE
        RAISE NOTICE 'payment_status column already exists in buyer_orders';
    END IF;
END $$;

-- Add delivery_fee column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_orders' 
        AND column_name = 'delivery_fee'
    ) THEN
        ALTER TABLE buyer_orders 
        ADD COLUMN delivery_fee DECIMAL(10,2) DEFAULT 0;
        
        RAISE NOTICE 'Added delivery_fee column to buyer_orders';
    ELSE
        RAISE NOTICE 'delivery_fee column already exists in buyer_orders';
    END IF;
END $$;

-- Add courier_service column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_orders' 
        AND column_name = 'courier_service'
    ) THEN
        ALTER TABLE buyer_orders 
        ADD COLUMN courier_service TEXT;
        
        RAISE NOTICE 'Added courier_service column to buyer_orders';
    ELSE
        RAISE NOTICE 'courier_service column already exists in buyer_orders';
    END IF;
END $$;

-- Add seller_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_orders' 
        AND column_name = 'seller_id'
    ) THEN
        ALTER TABLE buyer_orders 
        ADD COLUMN seller_id TEXT;
        
        RAISE NOTICE 'Added seller_id column to buyer_orders';
    ELSE
        RAISE NOTICE 'seller_id column already exists in buyer_orders';
    END IF;
END $$;

-- Add subtotal column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_orders' 
        AND column_name = 'subtotal'
    ) THEN
        ALTER TABLE buyer_orders 
        ADD COLUMN subtotal DECIMAL(10,2) DEFAULT 0;
        
        RAISE NOTICE 'Added subtotal column to buyer_orders';
    ELSE
        RAISE NOTICE 'subtotal column already exists in buyer_orders';
    END IF;
END $$;

-- Add total_amount column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_orders' 
        AND column_name = 'total_amount'
    ) THEN
        ALTER TABLE buyer_orders 
        ADD COLUMN total_amount DECIMAL(10,2) DEFAULT 0;
        
        RAISE NOTICE 'Added total_amount column to buyer_orders';
    ELSE
        RAISE NOTICE 'total_amount column already exists in buyer_orders';
    END IF;
END $$;

-- Add status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_orders' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE buyer_orders 
        ADD COLUMN status TEXT DEFAULT 'pending';
        
        RAISE NOTICE 'Added status column to buyer_orders';
    ELSE
        RAISE NOTICE 'status column already exists in buyer_orders';
    END IF;
END $$;

-- Add created_at and updated_at columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_orders' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE buyer_orders 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        RAISE NOTICE 'Added created_at column to buyer_orders';
    ELSE
        RAISE NOTICE 'created_at column already exists in buyer_orders';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_orders' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE buyer_orders 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        RAISE NOTICE 'Added updated_at column to buyer_orders';
    ELSE
        RAISE NOTICE 'updated_at column already exists in buyer_orders';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_buyer_orders_buyer_id ON buyer_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_orders_seller_id ON buyer_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_buyer_orders_status ON buyer_orders(status);
CREATE INDEX IF NOT EXISTS idx_buyer_orders_payment_status ON buyer_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_buyer_orders_created_at ON buyer_orders(created_at);

-- Add RLS policies if they don't exist
DO $$ 
BEGIN
    -- Enable RLS
    ALTER TABLE buyer_orders ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own orders" ON buyer_orders;
    DROP POLICY IF EXISTS "Users can insert their own orders" ON buyer_orders;
    DROP POLICY IF EXISTS "Users can update their own orders" ON buyer_orders;
    DROP POLICY IF EXISTS "Sellers can view orders for their products" ON buyer_orders;
    
    -- Create new policies
    CREATE POLICY "Users can view their own orders" ON buyer_orders
        FOR SELECT USING (auth.uid()::text = buyer_id);
    
    CREATE POLICY "Users can insert their own orders" ON buyer_orders
        FOR INSERT WITH CHECK (auth.uid()::text = buyer_id);
    
    CREATE POLICY "Users can update their own orders" ON buyer_orders
        FOR UPDATE USING (auth.uid()::text = buyer_id);
    
    CREATE POLICY "Sellers can view orders for their products" ON buyer_orders
        FOR SELECT USING (auth.uid()::text = seller_id);
    
    RAISE NOTICE 'RLS policies created for buyer_orders';
END $$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_buyer_orders_updated_at ON buyer_orders;
CREATE TRIGGER update_buyer_orders_updated_at
    BEFORE UPDATE ON buyer_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DO $$ 
BEGIN
    RAISE NOTICE 'buyer_orders table schema fixed successfully!';
END $$;
