-- Quick fix for missing payment_reference column
-- Run this in your Supabase SQL Editor

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

-- Add other missing columns that orderService.js needs
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
    END IF;
END $$;

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
    END IF;
END $$;

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
    END IF;
END $$;

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
    END IF;
END $$;

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
    END IF;
END $$;

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
    END IF;
END $$;

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
    END IF;
END $$;

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
    END IF;
END $$;

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
    END IF;
END $$;

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
    END IF;
END $$;

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
    END IF;
END $$;

-- Create buyer_orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS buyer_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number TEXT,
    buyer_id TEXT,
    seller_id TEXT,
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'pending',
    delivery_status TEXT DEFAULT 'pending',
    subtotal DECIMAL(10,2) DEFAULT 0,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    payment_method TEXT DEFAULT 'cod',
    payment_reference TEXT,
    delivery_address JSONB,
    notes TEXT,
    courier_service TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create buyer_order_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS buyer_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES buyer_orders(id) ON DELETE CASCADE,
    product_id TEXT,
    product_type TEXT DEFAULT 'product',
    product_name TEXT,
    product_image TEXT,
    product_price DECIMAL(10,2) DEFAULT 0,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) DEFAULT 0,
    product_specs JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE buyer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own orders" ON buyer_orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON buyer_orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON buyer_orders;
DROP POLICY IF EXISTS "Sellers can view orders for their products" ON buyer_orders;

CREATE POLICY "Users can view their own orders" ON buyer_orders
    FOR SELECT USING (auth.uid()::text = buyer_id);

CREATE POLICY "Users can insert their own orders" ON buyer_orders
    FOR INSERT WITH CHECK (auth.uid()::text = buyer_id);

CREATE POLICY "Users can update their own orders" ON buyer_orders
    FOR UPDATE USING (auth.uid()::text = buyer_id);

CREATE POLICY "Sellers can view orders for their products" ON buyer_orders
    FOR SELECT USING (auth.uid()::text = seller_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_buyer_orders_buyer_id ON buyer_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_orders_seller_id ON buyer_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_buyer_orders_status ON buyer_orders(status);
CREATE INDEX IF NOT EXISTS idx_buyer_order_items_order_id ON buyer_order_items(order_id);

DO $$ 
BEGIN
    RAISE NOTICE 'Database schema fixed successfully! All required columns added.';
END $$;
