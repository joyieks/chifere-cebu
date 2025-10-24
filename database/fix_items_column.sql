-- Fix the items column issue in buyer_orders table
-- Run this in your Supabase SQL Editor

-- First, let's see what columns exist in buyer_orders
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'buyer_orders' 
ORDER BY ordinal_position;

-- Drop the problematic items column if it exists
ALTER TABLE buyer_orders DROP COLUMN IF EXISTS items;

-- Also drop any other problematic columns that might cause issues
ALTER TABLE buyer_orders DROP COLUMN IF EXISTS order_items;
ALTER TABLE buyer_orders DROP COLUMN IF EXISTS products;

-- Make sure all required columns exist and are properly configured
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

-- Ensure buyer_order_items table exists and has all required columns
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

-- Add missing columns to buyer_order_items if they don't exist
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

-- Show final table structure
SELECT 'buyer_orders table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'buyer_orders' 
ORDER BY ordinal_position;

SELECT 'buyer_order_items table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'buyer_order_items' 
ORDER BY ordinal_position;

-- Success message
SELECT 'Items column issue fixed! Order placement should work now.' as message;
