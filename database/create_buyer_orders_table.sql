-- Create buyer_orders table with all required columns
-- This fixes the "Could not find the 'notes' column" error

-- 1. Create buyer_orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS buyer_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL, -- Changed from user_id to buyer_id
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    notes TEXT, -- This is the missing column causing the error
    delivery_address JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create buyer_order_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS buyer_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES buyer_orders(id) ON DELETE CASCADE,
    product_id UUID,
    product_name VARCHAR(255) NOT NULL,
    product_image TEXT,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS on both tables
ALTER TABLE buyer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_order_items ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for buyer_orders
DROP POLICY IF EXISTS "Users can view their own orders" ON buyer_orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON buyer_orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON buyer_orders;

CREATE POLICY "Users can view their own orders" ON buyer_orders
    FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Users can insert their own orders" ON buyer_orders
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update their own orders" ON buyer_orders
    FOR UPDATE USING (auth.uid() = buyer_id);

-- 5. Create RLS policies for buyer_order_items
DROP POLICY IF EXISTS "Users can view their own order items" ON buyer_order_items;
DROP POLICY IF EXISTS "Users can insert their own order items" ON buyer_order_items;

CREATE POLICY "Users can view their own order items" ON buyer_order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM buyer_orders 
            WHERE buyer_orders.id = buyer_order_items.order_id 
            AND buyer_orders.buyer_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own order items" ON buyer_order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM buyer_orders 
            WHERE buyer_orders.id = buyer_order_items.order_id 
            AND buyer_orders.buyer_id = auth.uid()
        )
    );

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_buyer_orders_buyer_id ON buyer_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_orders_status ON buyer_orders(status);
CREATE INDEX IF NOT EXISTS idx_buyer_order_items_order_id ON buyer_order_items(order_id);

-- 7. Create function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    order_num TEXT;
BEGIN
    order_num := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to auto-generate order numbers
DROP TRIGGER IF EXISTS trigger_generate_order_number ON buyer_orders;
CREATE TRIGGER trigger_generate_order_number
    BEFORE INSERT ON buyer_orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_order_number();

-- 9. Verify the tables were created
SELECT 'buyer_orders table created successfully!' as message;
SELECT 'buyer_order_items table created successfully!' as message;
