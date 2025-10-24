-- Simple schema fix without RLS policies
-- Run this in your Supabase SQL Editor

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

-- Add missing columns to existing buyer_orders table
ALTER TABLE buyer_orders ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE buyer_orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE buyer_orders ADD COLUMN IF NOT EXISTS delivery_address JSONB;
ALTER TABLE buyer_orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod';
ALTER TABLE buyer_orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE buyer_orders ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE buyer_orders ADD COLUMN IF NOT EXISTS courier_service TEXT;
ALTER TABLE buyer_orders ADD COLUMN IF NOT EXISTS seller_id TEXT;
ALTER TABLE buyer_orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0;
ALTER TABLE buyer_orders ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE buyer_orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE buyer_orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE buyer_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add missing columns to existing buyer_order_items table
ALTER TABLE buyer_order_items ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES buyer_orders(id) ON DELETE CASCADE;
ALTER TABLE buyer_order_items ADD COLUMN IF NOT EXISTS product_id TEXT;
ALTER TABLE buyer_order_items ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'product';
ALTER TABLE buyer_order_items ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE buyer_order_items ADD COLUMN IF NOT EXISTS product_image TEXT;
ALTER TABLE buyer_order_items ADD COLUMN IF NOT EXISTS product_price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE buyer_order_items ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE buyer_order_items ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE buyer_order_items ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE buyer_order_items ADD COLUMN IF NOT EXISTS product_specs JSONB DEFAULT '{}';
ALTER TABLE buyer_order_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_buyer_orders_buyer_id ON buyer_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_orders_seller_id ON buyer_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_buyer_orders_status ON buyer_orders(status);
CREATE INDEX IF NOT EXISTS idx_buyer_order_items_order_id ON buyer_order_items(order_id);

-- Disable RLS temporarily for easier testing
ALTER TABLE buyer_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_order_items DISABLE ROW LEVEL SECURITY;

-- Success message
SELECT 'Database schema fixed successfully! All required columns added.' as message;
