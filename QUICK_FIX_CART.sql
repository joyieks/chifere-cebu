-- QUICK FIX: Run this first to fix immediate cart errors
-- Copy and paste this entire script into Supabase SQL Editor and click RUN

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create buyer_addresses table (REQUIRED)
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

CREATE INDEX IF NOT EXISTS idx_buyer_addresses_user_id ON public.buyer_addresses(user_id);

-- Create buyer_add_to_cart table if missing
CREATE TABLE IF NOT EXISTS public.buyer_add_to_cart (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES buyer_users(id) ON DELETE CASCADE,
  items jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_user ON public.buyer_add_to_cart(user_id);

-- Enable RLS
ALTER TABLE public.buyer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_add_to_cart ENABLE ROW LEVEL SECURITY;

-- Policies for buyer_addresses
DROP POLICY IF EXISTS "Users can manage their addresses" ON public.buyer_addresses;
CREATE POLICY "Users can manage their addresses"
  ON public.buyer_addresses
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for buyer_add_to_cart
DROP POLICY IF EXISTS "Users can manage their cart" ON public.buyer_add_to_cart;
CREATE POLICY "Users can manage their cart"
  ON public.buyer_add_to_cart
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Cart tables created successfully!';
  RAISE NOTICE '✅ Refresh your browser to see the fix!';
END $$;
