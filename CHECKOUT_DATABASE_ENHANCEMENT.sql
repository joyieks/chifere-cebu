-- ============================================================================
-- CHECKOUT DATABASE ENHANCEMENT
-- Enhanced database schema for improved checkout functionality
-- ============================================================================

-- Address Management Tables
-- ============================================================================

-- Buyer Addresses Table
CREATE TABLE IF NOT EXISTS buyer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES buyer_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'home', -- home, work, other
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  barangay TEXT,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  zip_code TEXT,
  country TEXT DEFAULT 'Philippines',
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Orders Table with better structure
CREATE TABLE IF NOT EXISTS buyer_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL, -- Human-readable order number
  buyer_id UUID REFERENCES buyer_users(id),
  seller_id UUID, -- Can be null for multi-seller orders
  status TEXT DEFAULT 'pending', -- pending, processing, shipped, completed, cancelled
  payment_status TEXT DEFAULT 'pending', -- pending, paid, failed, refunded
  delivery_status TEXT DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
  
  -- Order Details
  items JSONB NOT NULL,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  payment_fee NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  
  -- Payment Details
  payment_method TEXT,
  payment_provider TEXT, -- paymongo, gcash, etc.
  payment_id TEXT,
  payment_fee_rate NUMERIC, -- Store the fee rate used
  
  -- Delivery Details
  delivery_address JSONB NOT NULL,
  courier_service TEXT DEFAULT 'lalamove',
  tracking_number TEXT,
  estimated_delivery TIMESTAMPTZ,
  
  -- Order Metadata
  buyer_message TEXT,
  seller_notes TEXT,
  order_type TEXT DEFAULT 'purchase', -- purchase, barter
  barter_details JSONB, -- For barter orders
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

-- Order Items Table (for better normalization)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES buyer_orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  seller_id UUID,
  seller_name TEXT,
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC NOT NULL,
  is_barter BOOLEAN DEFAULT FALSE,
  barter_item_id TEXT, -- For barter items
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES buyer_orders(id),
  payment_intent_id TEXT UNIQUE,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'PHP',
  payment_method TEXT NOT NULL,
  payment_provider TEXT,
  status TEXT DEFAULT 'pending', -- pending, succeeded, failed, cancelled
  fee_amount NUMERIC DEFAULT 0,
  net_amount NUMERIC NOT NULL,
  provider_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Delivery Tracking Table
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES buyer_orders(id),
  courier_service TEXT NOT NULL,
  tracking_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, picked_up, in_transit, delivered
  current_location TEXT,
  estimated_delivery TIMESTAMPTZ,
  actual_delivery TIMESTAMPTZ,
  delivery_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Address indexes
CREATE INDEX IF NOT EXISTS idx_buyer_addresses_user_id ON buyer_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_buyer_addresses_default ON buyer_addresses(user_id, is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_buyer_addresses_active ON buyer_addresses(user_id, is_active) WHERE is_active = TRUE;

-- Order indexes
CREATE INDEX IF NOT EXISTS idx_buyer_orders_buyer_id ON buyer_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_orders_seller_id ON buyer_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_buyer_orders_status ON buyer_orders(status);
CREATE INDEX IF NOT EXISTS idx_buyer_orders_payment_status ON buyer_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_buyer_orders_delivery_status ON buyer_orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_buyer_orders_created_at ON buyer_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_buyer_orders_order_number ON buyer_orders(order_number);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller_id ON order_items(seller_id);

-- Payment transaction indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_intent_id ON payment_transactions(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- Delivery tracking indexes
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order_id ON delivery_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_tracking_number ON delivery_tracking(tracking_number);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_status ON delivery_tracking(status);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  order_num TEXT;
  counter INTEGER;
BEGIN
  -- Get current date in YYYYMMDD format
  order_num := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Get counter for today
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 9) AS INTEGER)), 0) + 1
  INTO counter
  FROM buyer_orders
  WHERE order_number LIKE order_num || '%';
  
  -- Format as YYYYMMDD-XXXX
  order_num := order_num || '-' || LPAD(counter::TEXT, 4, '0');
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Function to update order totals
CREATE OR REPLACE FUNCTION update_order_totals()
RETURNS TRIGGER AS $$
DECLARE
  order_record RECORD;
  subtotal_calc NUMERIC := 0;
  total_calc NUMERIC := 0;
BEGIN
  -- Get the order record
  SELECT * INTO order_record FROM buyer_orders WHERE id = NEW.order_id;
  
  -- Calculate subtotal from order items
  SELECT COALESCE(SUM(total_price), 0) INTO subtotal_calc
  FROM order_items
  WHERE order_id = NEW.order_id;
  
  -- Calculate total (subtotal + delivery_fee + payment_fee)
  total_calc := subtotal_calc + COALESCE(order_record.delivery_fee, 0) + COALESCE(order_record.payment_fee, 0);
  
  -- Update the order
  UPDATE buyer_orders
  SET 
    subtotal = subtotal_calc,
    total_amount = total_calc,
    updated_at = NOW()
  WHERE id = NEW.order_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update order totals when items change
CREATE TRIGGER trigger_update_order_totals
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_order_totals();

-- Function to ensure only one default address per user
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting as default, unset all other defaults for this user
  IF NEW.is_default = TRUE THEN
    UPDATE buyer_addresses
    SET is_default = FALSE
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure single default address
CREATE TRIGGER trigger_ensure_single_default_address
  BEFORE INSERT OR UPDATE ON buyer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_address();

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Sample data is now handled in a separate file: CHECKOUT_SAMPLE_DATA.sql
-- Run that file after this one to insert sample data safely

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Order summary view
CREATE OR REPLACE VIEW order_summary AS
SELECT 
  o.id,
  o.order_number,
  o.buyer_id,
  o.seller_id,
  o.status,
  o.payment_status,
  o.delivery_status,
  o.total_amount,
  o.payment_method,
  o.created_at,
  o.delivered_at,
  COUNT(oi.id) as item_count,
  array_agg(oi.product_name) as product_names
FROM buyer_orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.buyer_id, o.seller_id, o.status, o.payment_status, o.delivery_status, o.total_amount, o.payment_method, o.created_at, o.delivered_at;

-- Buyer order history view (conditional creation)
DO $$
BEGIN
  -- Create the view only if seller_users table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seller_users') THEN
    EXECUTE '
    CREATE OR REPLACE VIEW buyer_order_history AS
    SELECT 
      os.*,
      bu.display_name as buyer_name,
      bu.email as buyer_email,
      su.display_name as seller_name
    FROM order_summary os
    LEFT JOIN buyer_users bu ON os.buyer_id = bu.id
    LEFT JOIN seller_users su ON os.seller_id = su.id';
  ELSE
    -- Create view without seller information if seller_users doesn''t exist
    EXECUTE '
    CREATE OR REPLACE VIEW buyer_order_history AS
    SELECT 
      os.*,
      bu.display_name as buyer_name,
      bu.email as buyer_email,
      ''Unknown Seller'' as seller_name
    FROM order_summary os
    LEFT JOIN buyer_users bu ON os.buyer_id = bu.id';
  END IF;
END $$;

-- ============================================================================
-- RLS (Row Level Security) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE buyer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;

-- Address policies
CREATE POLICY "Users can view their own addresses" ON buyer_addresses
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own addresses" ON buyer_addresses
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own addresses" ON buyer_addresses
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own addresses" ON buyer_addresses
  FOR DELETE USING (user_id = auth.uid());

-- Order policies
CREATE POLICY "Users can view their own orders" ON buyer_orders
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Users can insert their own orders" ON buyer_orders
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- Order items policies
CREATE POLICY "Users can view items from their orders" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM buyer_orders 
      WHERE id = order_items.order_id 
      AND buyer_id = auth.uid()
    )
  );

-- Payment transaction policies
CREATE POLICY "Users can view their payment transactions" ON payment_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM buyer_orders 
      WHERE id = payment_transactions.order_id 
      AND buyer_id = auth.uid()
    )
  );

-- Delivery tracking policies
CREATE POLICY "Users can view their delivery tracking" ON delivery_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM buyer_orders 
      WHERE id = delivery_tracking.order_id 
      AND buyer_id = auth.uid()
    )
  );
