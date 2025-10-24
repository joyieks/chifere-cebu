-- Complete Checkout System Setup
-- This script creates all necessary tables and columns from scratch

-- Step 1: Create the orders table first
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Order details
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Payment information
    payment_method VARCHAR(50) NOT NULL DEFAULT 'cash_on_delivery',
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_reference VARCHAR(255),
    
    -- Shipping information
    shipping_address JSONB NOT NULL DEFAULT '{}',
    shipping_contact JSONB NOT NULL DEFAULT '{}',
    
    -- Order status
    status VARCHAR(20) NOT NULL DEFAULT 'review',
    status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional notes
    buyer_notes TEXT,
    seller_notes TEXT,
    
    -- Constraints
    CONSTRAINT valid_payment_method CHECK (payment_method IN ('cash_on_delivery', 'gcash', 'paypal', 'barter', 'bank_transfer')),
    CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    CONSTRAINT valid_order_status CHECK (status IN ('review', 'processing', 'deliver', 'received', 'cancelled')),
    CONSTRAINT positive_amounts CHECK (total_amount >= 0 AND subtotal >= 0 AND shipping_fee >= 0 AND tax_amount >= 0)
);

-- Step 2: Create the order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    product_type VARCHAR(20) NOT NULL DEFAULT 'product',
    
    -- Product details (snapshot at time of order)
    product_name VARCHAR(255) NOT NULL DEFAULT 'Unknown Product',
    product_image TEXT,
    product_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Product specifications
    product_specs JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_product_type CHECK (product_type IN ('product', 'preloved', 'barter')),
    CONSTRAINT positive_quantity CHECK (quantity > 0),
    CONSTRAINT positive_prices CHECK (product_price >= 0 AND unit_price >= 0 AND total_price >= 0)
);

-- Step 3: Create the order_status_history table
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

-- Step 4: Create the order_notifications table
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

-- Step 5: Create indexes for better performance
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

-- Step 6: Create functions for order management
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

-- Step 7: Create trigger for automatic total updates
CREATE TRIGGER trigger_update_order_totals
    AFTER INSERT OR UPDATE OR DELETE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_order_totals();

-- Step 8: Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_notifications ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies
CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can insert their own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Sellers can update their orders" ON orders
    FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Users can view order items for their orders" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE id = order_id 
            AND (buyer_id = auth.uid() OR seller_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert order items for their orders" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE id = order_id 
            AND buyer_id = auth.uid()
        )
    );

CREATE POLICY "Users can view status history for their orders" ON order_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE id = order_id 
            AND (buyer_id = auth.uid() OR seller_id = auth.uid())
        )
    );

CREATE POLICY "Users can view their own notifications" ON order_notifications
    FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their own notifications" ON order_notifications
    FOR UPDATE USING (auth.uid() = recipient_id);

-- Success message
SELECT 'Checkout system tables created successfully!' as message;
