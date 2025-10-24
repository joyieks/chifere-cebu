-- Fix Cart Table Schema
-- This script fixes the buyer_add_to_cart table structure and removes problematic columns

-- 1. Drop the existing buyer_add_to_cart table if it exists
DROP TABLE IF EXISTS public.buyer_add_to_cart CASCADE;

-- 2. Recreate the buyer_add_to_cart table with the correct structure
CREATE TABLE public.buyer_add_to_cart (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    product_id TEXT NOT NULL, -- Changed from UUID to TEXT to support string IDs
    product_type VARCHAR(50) DEFAULT 'product',
    product_name TEXT NOT NULL,
    product_image TEXT,
    product_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    seller_id TEXT, -- Changed from UUID to TEXT to support string IDs
    added_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Disable RLS temporarily for easier testing
ALTER TABLE public.buyer_add_to_cart DISABLE ROW LEVEL SECURITY;

-- 4. Add a unique constraint to prevent duplicate entries for the same user and product
ALTER TABLE public.buyer_add_to_cart
ADD CONSTRAINT unique_user_product_in_cart UNIQUE (user_id, product_id);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_buyer_add_to_cart_user_id ON public.buyer_add_to_cart(user_id);
CREATE INDEX IF NOT EXISTS idx_buyer_add_to_cart_product_id ON public.buyer_add_to_cart(product_id);
CREATE INDEX IF NOT EXISTS idx_buyer_add_to_cart_seller_id ON public.buyer_add_to_cart(seller_id);

-- 6. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cart_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_buyer_add_to_cart_updated_at ON public.buyer_add_to_cart;
CREATE TRIGGER update_buyer_add_to_cart_updated_at
    BEFORE UPDATE ON public.buyer_add_to_cart
    FOR EACH ROW
    EXECUTE FUNCTION update_cart_updated_at_column();

-- 8. Sample data insertion removed to avoid UUID conflicts
-- The table is ready for use with your actual product IDs

SELECT 'Cart table schema fixed successfully!' as message;
