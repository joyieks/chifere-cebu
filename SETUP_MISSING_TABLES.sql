-- ChiFere App - Complete Database Setup Script
-- Run this script in Supabase SQL Editor to create all missing tables
-- Based on sqlscript schema
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- BUYER ADDRESSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.buyer_addresses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  type text NOT NULL DEFAULT 'home'::text,
  name text NOT NULL,
  phone text NOT NULL,
  address_line_1 text NOT NULL,
  address_line_2 text,
  barangay text,
  city text NOT NULL,
  province text NOT NULL,
  zip_code text,
  country text DEFAULT 'Philippines'::text,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT buyer_addresses_pkey PRIMARY KEY (id),
  CONSTRAINT buyer_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.buyer_users(id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_buyer_addresses_user_id ON public.buyer_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_buyer_addresses_default ON public.buyer_addresses(user_id, is_default) WHERE is_default = true;

-- ============================================================================
-- BUYER ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.buyer_orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_number text NOT NULL UNIQUE,
  buyer_id uuid,
  seller_id uuid,
  status text DEFAULT 'pending'::text,
  payment_status text DEFAULT 'pending'::text,
  delivery_status text DEFAULT 'pending'::text,
  items jsonb NOT NULL,
  subtotal numeric NOT NULL DEFAULT 0,
  delivery_fee numeric NOT NULL DEFAULT 0,
  payment_fee numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  payment_method text,
  payment_provider text,
  payment_id text,
  payment_fee_rate numeric,
  delivery_address jsonb NOT NULL,
  courier_service text DEFAULT 'lalamove'::text,
  tracking_number text,
  estimated_delivery timestamp with time zone,
  buyer_message text,
  seller_notes text,
  order_type text DEFAULT 'purchase'::text,
  barter_details jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  confirmed_at timestamp with time zone,
  shipped_at timestamp with time zone,
  delivered_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  paid_at timestamp with time zone,
  CONSTRAINT buyer_orders_pkey PRIMARY KEY (id),
  CONSTRAINT buyer_orders_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.buyer_users(id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_buyer_orders_buyer_id ON public.buyer_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_orders_seller_id ON public.buyer_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_buyer_orders_order_number ON public.buyer_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_buyer_orders_status ON public.buyer_orders(status, payment_status, delivery_status);
CREATE INDEX IF NOT EXISTS idx_buyer_orders_created_at ON public.buyer_orders(created_at DESC);

-- ============================================================================
-- ORDER ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid,
  product_id text NOT NULL,
  product_name text NOT NULL,
  product_image text,
  seller_id uuid,
  seller_name text,
  price numeric NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  total_price numeric NOT NULL,
  is_barter boolean DEFAULT false,
  barter_item_id text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.buyer_orders(id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- ============================================================================
-- PAYMENT TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid,
  payment_intent_id text UNIQUE,
  amount numeric NOT NULL,
  currency text DEFAULT 'PHP'::text,
  payment_method text NOT NULL,
  payment_provider text,
  status text DEFAULT 'pending'::text,
  fee_amount numeric DEFAULT 0,
  net_amount numeric NOT NULL,
  provider_response jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone,
  CONSTRAINT payment_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT payment_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.buyer_orders(id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_intent ON public.payment_transactions(payment_intent_id);

-- ============================================================================
-- DELIVERY TRACKING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.delivery_tracking (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid,
  courier_service text NOT NULL,
  tracking_number text NOT NULL,
  status text DEFAULT 'pending'::text,
  current_location text,
  estimated_delivery timestamp with time zone,
  actual_delivery timestamp with time zone,
  delivery_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT delivery_tracking_pkey PRIMARY KEY (id),
  CONSTRAINT delivery_tracking_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.buyer_orders(id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order_id ON public.delivery_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_created_at ON public.delivery_tracking(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE public.buyer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;

-- Buyer Addresses Policies
DROP POLICY IF EXISTS "Users can view their own addresses" ON public.buyer_addresses;
CREATE POLICY "Users can view their own addresses"
  ON public.buyer_addresses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own addresses" ON public.buyer_addresses;
CREATE POLICY "Users can insert their own addresses"
  ON public.buyer_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own addresses" ON public.buyer_addresses;
CREATE POLICY "Users can update their own addresses"
  ON public.buyer_addresses FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.buyer_addresses;
CREATE POLICY "Users can delete their own addresses"
  ON public.buyer_addresses FOR DELETE
  USING (auth.uid() = user_id);

-- Buyer Orders Policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.buyer_orders;
CREATE POLICY "Users can view their own orders"
  ON public.buyer_orders FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can insert their own orders" ON public.buyer_orders;
CREATE POLICY "Users can insert their own orders"
  ON public.buyer_orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Users can update their own orders" ON public.buyer_orders;
CREATE POLICY "Users can update their own orders"
  ON public.buyer_orders FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Order Items Policies
DROP POLICY IF EXISTS "Users can view order items" ON public.order_items;
CREATE POLICY "Users can view order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.buyer_orders
      WHERE id = order_id AND (auth.uid() = buyer_id OR auth.uid() = seller_id)
    )
  );

-- Payment Transactions Policies
DROP POLICY IF EXISTS "Users can view their payments" ON public.payment_transactions;
CREATE POLICY "Users can view their payments"
  ON public.payment_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.buyer_orders
      WHERE id = order_id AND (auth.uid() = buyer_id OR auth.uid() = seller_id)
    )
  );

DROP POLICY IF EXISTS "Users can insert payments" ON public.payment_transactions;
CREATE POLICY "Users can insert payments"
  ON public.payment_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.buyer_orders
      WHERE id = order_id AND auth.uid() = buyer_id
    )
  );

-- Delivery Tracking Policies
DROP POLICY IF EXISTS "Users can view delivery tracking" ON public.delivery_tracking;
CREATE POLICY "Users can view delivery tracking"
  ON public.delivery_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.buyer_orders
      WHERE id = order_id AND (auth.uid() = buyer_id OR auth.uid() = seller_id)
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables
DROP TRIGGER IF EXISTS update_buyer_addresses_updated_at ON public.buyer_addresses;
CREATE TRIGGER update_buyer_addresses_updated_at
  BEFORE UPDATE ON public.buyer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_buyer_orders_updated_at ON public.buyer_orders;
CREATE TRIGGER update_buyer_orders_updated_at
  BEFORE UPDATE ON public.buyer_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON public.payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check if all tables exist
DO $$
BEGIN
  RAISE NOTICE 'Checking tables...';
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'buyer_addresses') THEN
    RAISE NOTICE '✓ buyer_addresses table exists';
  ELSE
    RAISE WARNING '✗ buyer_addresses table missing';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'buyer_orders') THEN
    RAISE NOTICE '✓ buyer_orders table exists';
  ELSE
    RAISE WARNING '✗ buyer_orders table missing';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_items') THEN
    RAISE NOTICE '✓ order_items table exists';
  ELSE
    RAISE WARNING '✗ order_items table missing';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_transactions') THEN
    RAISE NOTICE '✓ payment_transactions table exists';
  ELSE
    RAISE WARNING '✗ payment_transactions table missing';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'delivery_tracking') THEN
    RAISE NOTICE '✓ delivery_tracking table exists';
  ELSE
    RAISE WARNING '✗ delivery_tracking table missing';
  END IF;
END $$;
