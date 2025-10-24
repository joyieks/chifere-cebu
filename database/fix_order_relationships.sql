-- Fix Order Relationships and Schema
-- This script fixes the relationship between buyer_orders and buyer_order_items tables

-- 1. First, let's check what tables exist and their structure
DO $$
BEGIN
    -- Check if buyer_orders table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'buyer_orders') THEN
        RAISE NOTICE 'buyer_orders table does not exist. Creating it...';
        
        -- Create buyer_orders table
        CREATE TABLE buyer_orders (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            buyer_id UUID NOT NULL,
            seller_id UUID,
            order_number VARCHAR(50) UNIQUE NOT NULL,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'review', 'processing', 'deliver', 'delivered', 'received', 'completed', 'cancelled')),
            payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
            delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'processing', 'shipped', 'delivered', 'received')),
            total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
            delivery_fee DECIMAL(10,2) DEFAULT 0,
            payment_method VARCHAR(50) DEFAULT 'cod',
            payment_reference TEXT,
            delivery_address JSONB,
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            paid_at TIMESTAMPTZ,
            delivered_at TIMESTAMPTZ,
            cancelled_at TIMESTAMPTZ,
            cancellation_reason TEXT
        );
        
        RAISE NOTICE 'buyer_orders table created successfully.';
    ELSE
        RAISE NOTICE 'buyer_orders table already exists.';
    END IF;
    
    -- Check if buyer_order_items table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'buyer_order_items') THEN
        RAISE NOTICE 'buyer_order_items table does not exist. Creating it...';
        
        -- Create buyer_order_items table
        CREATE TABLE buyer_order_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id UUID NOT NULL,
            product_id UUID NOT NULL,
            product_type VARCHAR(50),
            product_name TEXT NOT NULL,
            product_image TEXT,
            product_price DECIMAL(10,2) NOT NULL,
            quantity INT NOT NULL DEFAULT 1,
            unit_price DECIMAL(10,2) NOT NULL,
            total_price DECIMAL(10,2) NOT NULL,
            product_specs JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE 'buyer_order_items table created successfully.';
    ELSE
        RAISE NOTICE 'buyer_order_items table already exists.';
    END IF;
END $$;

-- 2. Add foreign key constraint between buyer_orders and buyer_order_items
DO $$
BEGIN
    -- Check if the foreign key constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'buyer_order_items_order_id_fkey'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE buyer_order_items
        ADD CONSTRAINT buyer_order_items_order_id_fkey
        FOREIGN KEY (order_id) REFERENCES buyer_orders(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key constraint buyer_order_items_order_id_fkey added successfully.';
    ELSE
        RAISE NOTICE 'Foreign key constraint buyer_order_items_order_id_fkey already exists.';
    END IF;
END $$;

-- 3. Create order_status_history table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_status_history') THEN
        CREATE TABLE order_status_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id UUID NOT NULL REFERENCES buyer_orders(id) ON DELETE CASCADE,
            status VARCHAR(20) NOT NULL,
            status_type VARCHAR(20) DEFAULT 'status',
            changed_by UUID NOT NULL,
            notes TEXT,
            changed_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE 'order_status_history table created successfully.';
    ELSE
        RAISE NOTICE 'order_status_history table already exists.';
    END IF;
END $$;

-- 4. Enable RLS on all tables
ALTER TABLE buyer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing RLS policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own orders" ON buyer_orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON buyer_orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON buyer_orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON buyer_orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON buyer_orders;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON buyer_orders;

DROP POLICY IF EXISTS "Users can view their own order items" ON buyer_order_items;
DROP POLICY IF EXISTS "Users can insert their own order items" ON buyer_order_items;
DROP POLICY IF EXISTS "Enable read access for all users" ON buyer_order_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON buyer_order_items;

DROP POLICY IF EXISTS "Users can view their own order history" ON order_status_history;
DROP POLICY IF EXISTS "Users can insert their own order history" ON order_status_history;
DROP POLICY IF EXISTS "Enable read access for all users" ON order_status_history;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON order_status_history;

-- 6. Create RLS policies for buyer_orders
CREATE POLICY "Users can view their own orders" ON buyer_orders
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can insert their own orders" ON buyer_orders
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update their own orders" ON buyer_orders
    FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 7. Create RLS policies for buyer_order_items
CREATE POLICY "Users can view their own order items" ON buyer_order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM buyer_orders 
            WHERE buyer_orders.id = buyer_order_items.order_id 
            AND (buyer_orders.buyer_id = auth.uid() OR buyer_orders.seller_id = auth.uid())
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

-- 8. Create RLS policies for order_status_history
CREATE POLICY "Users can view their own order history" ON order_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM buyer_orders 
            WHERE buyer_orders.id = order_status_history.order_id 
            AND (buyer_orders.buyer_id = auth.uid() OR buyer_orders.seller_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert their own order history" ON order_status_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM buyer_orders 
            WHERE buyer_orders.id = order_status_history.order_id 
            AND (buyer_orders.buyer_id = auth.uid() OR buyer_orders.seller_id = auth.uid())
        )
    );

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_buyer_orders_buyer_id ON buyer_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_orders_seller_id ON buyer_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_buyer_orders_status ON buyer_orders(status);
CREATE INDEX IF NOT EXISTS idx_buyer_orders_payment_status ON buyer_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_buyer_order_items_order_id ON buyer_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);

-- 10. Create function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    new_order_number TEXT;
    current_year TEXT;
    current_month TEXT;
    counter INT;
BEGIN
    current_year := TO_CHAR(NOW(), 'YYYY');
    current_month := TO_CHAR(NOW(), 'MM');

    -- Get the current counter for the month
    SELECT COALESCE(MAX(SUBSTRING(order_number FROM 10)::INT), 0)
    INTO counter
    FROM buyer_orders
    WHERE order_number LIKE 'CHF-' || current_year || current_month || '%';

    counter := counter + 1;
    new_order_number := 'CHF-' || current_year || current_month || LPAD(counter::TEXT, 4, '0');

    RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to buyer_orders
DROP TRIGGER IF EXISTS update_buyer_orders_updated_at ON buyer_orders;
CREATE TRIGGER update_buyer_orders_updated_at
    BEFORE UPDATE ON buyer_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

SELECT 'Order relationships and schema fixed successfully!' as message;
