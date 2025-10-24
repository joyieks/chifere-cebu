-- Checkout System Migration Script
-- This script handles existing tables and adds missing columns

-- Check if order_items table exists and add missing columns
DO $$
BEGIN
    -- Add product_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'product_type'
    ) THEN
        ALTER TABLE order_items ADD COLUMN product_type VARCHAR(20) DEFAULT 'product';
        ALTER TABLE order_items ADD CONSTRAINT valid_product_type CHECK (product_type IN ('product', 'preloved', 'barter'));
    END IF;

    -- Add product_specs column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'product_specs'
    ) THEN
        ALTER TABLE order_items ADD COLUMN product_specs JSONB DEFAULT '{}';
    END IF;

    -- Add product_image column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'product_image'
    ) THEN
        ALTER TABLE order_items ADD COLUMN product_image TEXT;
    END IF;

    -- Add product_price column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'product_price'
    ) THEN
        ALTER TABLE order_items ADD COLUMN product_price DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Add unit_price column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'unit_price'
    ) THEN
        ALTER TABLE order_items ADD COLUMN unit_price DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Add total_price column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'total_price'
    ) THEN
        ALTER TABLE order_items ADD COLUMN total_price DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Add quantity column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'quantity'
    ) THEN
        ALTER TABLE order_items ADD COLUMN quantity INTEGER DEFAULT 1;
    END IF;

    -- Add product_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'product_name'
    ) THEN
        ALTER TABLE order_items ADD COLUMN product_name VARCHAR(255) DEFAULT 'Unknown Product';
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE order_items ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Check if orders table exists and add missing columns
DO $$
BEGIN
    -- Add order_number column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'order_number'
    ) THEN
        ALTER TABLE orders ADD COLUMN order_number VARCHAR(50);
        -- Generate order numbers for existing orders
        UPDATE orders SET order_number = 'ORD-' || EXTRACT(YEAR FROM created_at) || '-' || LPAD(EXTRACT(DOY FROM created_at)::TEXT, 3, '0') || '-' || LPAD(id::TEXT, 4, '0') WHERE order_number IS NULL;
        ALTER TABLE orders ALTER COLUMN order_number SET NOT NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
    END IF;

    -- Add buyer_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'buyer_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN buyer_id UUID;
    END IF;

    -- Add seller_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'seller_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN seller_id UUID;
    END IF;

    -- Add total_amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'total_amount'
    ) THEN
        ALTER TABLE orders ADD COLUMN total_amount DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Add subtotal column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'subtotal'
    ) THEN
        ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Add shipping_fee column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'shipping_fee'
    ) THEN
        ALTER TABLE orders ADD COLUMN shipping_fee DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Add tax_amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'tax_amount'
    ) THEN
        ALTER TABLE orders ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Add payment_method column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash_on_delivery';
    END IF;

    -- Add payment_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending';
    END IF;

    -- Add payment_reference column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'payment_reference'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_reference VARCHAR(255);
    END IF;

    -- Add shipping_address column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'shipping_address'
    ) THEN
        ALTER TABLE orders ADD COLUMN shipping_address JSONB DEFAULT '{}';
    END IF;

    -- Add shipping_contact column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'shipping_contact'
    ) THEN
        ALTER TABLE orders ADD COLUMN shipping_contact JSONB DEFAULT '{}';
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE orders ADD COLUMN status VARCHAR(20) DEFAULT 'review';
    END IF;

    -- Add status_updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'status_updated_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Add buyer_notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'buyer_notes'
    ) THEN
        ALTER TABLE orders ADD COLUMN buyer_notes TEXT;
    END IF;

    -- Add seller_notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'seller_notes'
    ) THEN
        ALTER TABLE orders ADD COLUMN seller_notes TEXT;
    END IF;
END $$;

-- Create missing tables if they don't exist
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    previous_status VARCHAR(20),
    changed_by UUID NOT NULL REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    
    CONSTRAINT valid_status CHECK (status IN ('review', 'processing', 'deliver', 'received', 'cancelled')),
    CONSTRAINT valid_previous_status CHECK (previous_status IN ('review', 'processing', 'deliver', 'received', 'cancelled') OR previous_status IS NULL)
);

CREATE TABLE IF NOT EXISTS order_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id),
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_notification_type CHECK (notification_type IN ('status_update', 'payment_reminder', 'order_confirmation', 'order_cancelled'))
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_type ON order_items(product_type);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_at ON order_status_history(changed_at);

CREATE INDEX IF NOT EXISTS idx_order_notifications_order_id ON order_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_order_notifications_recipient_id ON order_notifications(recipient_id);

-- Create functions if they don't exist
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    order_num TEXT;
    counter INTEGER;
BEGIN
    -- Get current date in YYYYMMDD format
    order_num := TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Get count of orders for today
    SELECT COUNT(*) + 1 INTO counter
    FROM orders
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Format: YYYYMMDD-XXXX
    order_num := order_num || '-' || LPAD(counter::TEXT, 4, '0');
    
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_order_status(
    p_order_id UUID,
    p_new_status VARCHAR(20),
    p_changed_by UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_status VARCHAR(20);
BEGIN
    -- Get current status
    SELECT status INTO current_status
    FROM orders
    WHERE id = p_order_id;
    
    -- Check if status is valid transition
    IF NOT (
        (current_status = 'review' AND p_new_status IN ('processing', 'cancelled')) OR
        (current_status = 'processing' AND p_new_status IN ('deliver', 'cancelled')) OR
        (current_status = 'deliver' AND p_new_status IN ('received', 'cancelled')) OR
        (current_status = 'received' AND p_new_status = 'received') OR
        (current_status = 'cancelled' AND p_new_status = 'cancelled')
    ) THEN
        RAISE EXCEPTION 'Invalid status transition from % to %', current_status, p_new_status;
    END IF;
    
    -- Update order status
    UPDATE orders
    SET 
        status = p_new_status,
        status_updated_at = NOW(),
        updated_at = NOW()
    WHERE id = p_order_id;
    
    -- Insert status history
    INSERT INTO order_status_history (order_id, status, previous_status, changed_by, notes)
    VALUES (p_order_id, p_new_status, current_status, p_changed_by, p_notes);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_order_totals(p_order_id UUID)
RETURNS TABLE(
    subtotal DECIMAL(10,2),
    shipping_fee DECIMAL(10,2),
    tax_amount DECIMAL(10,2),
    total_amount DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(oi.total_price), 0) as subtotal,
        o.shipping_fee,
        o.tax_amount,
        COALESCE(SUM(oi.total_price), 0) + o.shipping_fee + o.tax_amount as total_amount
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.id = p_order_id
    GROUP BY o.id, o.shipping_fee, o.tax_amount;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_order_totals()
RETURNS TRIGGER AS $$
DECLARE
    calculated_totals RECORD;
BEGIN
    -- Calculate new totals
    SELECT * INTO calculated_totals
    FROM calculate_order_totals(COALESCE(NEW.order_id, OLD.order_id));
    
    -- Update order with new totals
    UPDATE orders
    SET 
        subtotal = calculated_totals.subtotal,
        total_amount = calculated_totals.total_amount,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.order_id, OLD.order_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_order_totals'
    ) THEN
        CREATE TRIGGER trigger_update_order_totals
            AFTER INSERT OR UPDATE OR DELETE ON order_items
            FOR EACH ROW
            EXECUTE FUNCTION update_order_totals();
    END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
    -- Orders policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'Users can view their own orders'
    ) THEN
        CREATE POLICY "Users can view their own orders" ON orders
            FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'Users can insert their own orders'
    ) THEN
        CREATE POLICY "Users can insert their own orders" ON orders
            FOR INSERT WITH CHECK (auth.uid() = buyer_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'Sellers can update their orders'
    ) THEN
        CREATE POLICY "Sellers can update their orders" ON orders
            FOR UPDATE USING (auth.uid() = seller_id);
    END IF;

    -- Order items policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_items' 
        AND policyname = 'Users can view order items for their orders'
    ) THEN
        CREATE POLICY "Users can view order items for their orders" ON order_items
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM orders 
                    WHERE id = order_id 
                    AND (buyer_id = auth.uid() OR seller_id = auth.uid())
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_items' 
        AND policyname = 'Users can insert order items for their orders'
    ) THEN
        CREATE POLICY "Users can insert order items for their orders" ON order_items
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM orders 
                    WHERE id = order_id 
                    AND buyer_id = auth.uid()
                )
            );
    END IF;

    -- Order status history policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_status_history' 
        AND policyname = 'Users can view status history for their orders'
    ) THEN
        CREATE POLICY "Users can view status history for their orders" ON order_status_history
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM orders 
                    WHERE id = order_id 
                    AND (buyer_id = auth.uid() OR seller_id = auth.uid())
                )
            );
    END IF;

    -- Order notifications policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_notifications' 
        AND policyname = 'Users can view their own notifications'
    ) THEN
        CREATE POLICY "Users can view their own notifications" ON order_notifications
            FOR SELECT USING (auth.uid() = recipient_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_notifications' 
        AND policyname = 'Users can update their own notifications'
    ) THEN
        CREATE POLICY "Users can update their own notifications" ON order_notifications
            FOR UPDATE USING (auth.uid() = recipient_id);
    END IF;
END $$;

-- Add constraints if they don't exist
DO $$
BEGIN
    -- Add constraints to orders table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'orders' 
        AND constraint_name = 'valid_payment_method'
    ) THEN
        ALTER TABLE orders ADD CONSTRAINT valid_payment_method CHECK (payment_method IN ('cash_on_delivery', 'gcash', 'paypal', 'barter', 'bank_transfer'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'orders' 
        AND constraint_name = 'valid_payment_status'
    ) THEN
        ALTER TABLE orders ADD CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'orders' 
        AND constraint_name = 'valid_order_status'
    ) THEN
        ALTER TABLE orders ADD CONSTRAINT valid_order_status CHECK (status IN ('review', 'processing', 'deliver', 'received', 'cancelled'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'orders' 
        AND constraint_name = 'positive_amounts'
    ) THEN
        ALTER TABLE orders ADD CONSTRAINT positive_amounts CHECK (total_amount >= 0 AND subtotal >= 0 AND shipping_fee >= 0 AND tax_amount >= 0);
    END IF;

    -- Add constraints to order_items table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'order_items' 
        AND constraint_name = 'valid_product_type'
    ) THEN
        ALTER TABLE order_items ADD CONSTRAINT valid_product_type CHECK (product_type IN ('product', 'preloved', 'barter'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'order_items' 
        AND constraint_name = 'positive_quantity'
    ) THEN
        ALTER TABLE order_items ADD CONSTRAINT positive_quantity CHECK (quantity > 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'order_items' 
        AND constraint_name = 'positive_prices'
    ) THEN
        ALTER TABLE order_items ADD CONSTRAINT positive_prices CHECK (product_price >= 0 AND unit_price >= 0 AND total_price >= 0);
    END IF;
END $$;

-- Success message
SELECT 'Checkout system migration completed successfully!' as message;
