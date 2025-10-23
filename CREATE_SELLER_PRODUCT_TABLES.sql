-- Create the missing seller product tables
-- These tables are expected by the itemService for seller product management

-- Table for preloved items (regular products for sale)
CREATE TABLE public.seller_add_item_preloved (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  condition text NOT NULL,
  location text NOT NULL,
  brand text,
  model text,
  quantity integer NOT NULL DEFAULT 1,
  price numeric,
  original_price numeric,
  product_type text NOT NULL DEFAULT 'preloved'::text,
  selling_mode text NOT NULL DEFAULT 'sell'::text,
  barter_preferences text,
  estimated_value numeric,
  images text[] DEFAULT '{}'::text[],
  primary_image text,
  status text DEFAULT 'active'::text,
  is_featured boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  shares integer DEFAULT 0,
  rating numeric DEFAULT 0,
  total_ratings integer DEFAULT 0,
  sold_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  barter_requests jsonb DEFAULT '[]'::jsonb,
  barter_offers jsonb DEFAULT '[]'::jsonb,
  is_barter_only boolean DEFAULT false,
  is_sell_only boolean DEFAULT false,
  is_both boolean DEFAULT false,
  CONSTRAINT seller_add_item_preloved_pkey PRIMARY KEY (id),
  CONSTRAINT seller_add_item_preloved_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE
);

-- Table for barter items (items for barter/trade)
CREATE TABLE public.seller_add_barter_item (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  condition text NOT NULL,
  location text NOT NULL,
  brand text,
  model text,
  quantity integer NOT NULL DEFAULT 1,
  price numeric,
  original_price numeric,
  product_type text NOT NULL DEFAULT 'barter'::text,
  selling_mode text NOT NULL DEFAULT 'barter'::text,
  barter_preferences text,
  estimated_value numeric,
  images text[] DEFAULT '{}'::text[],
  primary_image text,
  status text DEFAULT 'active'::text,
  is_featured boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  shares integer DEFAULT 0,
  rating numeric DEFAULT 0,
  total_ratings integer DEFAULT 0,
  sold_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  barter_requests jsonb DEFAULT '[]'::jsonb,
  barter_offers jsonb DEFAULT '[]'::jsonb,
  is_barter_only boolean DEFAULT true,
  is_sell_only boolean DEFAULT false,
  is_both boolean DEFAULT false,
  CONSTRAINT seller_add_barter_item_pkey PRIMARY KEY (id),
  CONSTRAINT seller_add_barter_item_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_seller_add_item_preloved_seller_id ON public.seller_add_item_preloved (seller_id);
CREATE INDEX idx_seller_add_item_preloved_status ON public.seller_add_item_preloved (status);
CREATE INDEX idx_seller_add_item_preloved_category ON public.seller_add_item_preloved (category);
CREATE INDEX idx_seller_add_item_preloved_created_at ON public.seller_add_item_preloved (created_at);

CREATE INDEX idx_seller_add_barter_item_seller_id ON public.seller_add_barter_item (seller_id);
CREATE INDEX idx_seller_add_barter_item_status ON public.seller_add_barter_item (status);
CREATE INDEX idx_seller_add_barter_item_category ON public.seller_add_barter_item (category);
CREATE INDEX idx_seller_add_barter_item_created_at ON public.seller_add_barter_item (created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.seller_add_item_preloved ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_add_barter_item ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for seller_add_item_preloved
CREATE POLICY "Sellers can view their own preloved items" ON public.seller_add_item_preloved
  FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert their own preloved items" ON public.seller_add_item_preloved
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own preloved items" ON public.seller_add_item_preloved
  FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own preloved items" ON public.seller_add_item_preloved
  FOR DELETE USING (auth.uid() = seller_id);

-- Create RLS policies for seller_add_barter_item
CREATE POLICY "Sellers can view their own barter items" ON public.seller_add_barter_item
  FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert their own barter items" ON public.seller_add_barter_item
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own barter items" ON public.seller_add_barter_item
  FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own barter items" ON public.seller_add_barter_item
  FOR DELETE USING (auth.uid() = seller_id);

-- Allow public read access for active items (for buyers to see products)
CREATE POLICY "Public can view active preloved items" ON public.seller_add_item_preloved
  FOR SELECT USING (status = 'active');

CREATE POLICY "Public can view active barter items" ON public.seller_add_barter_item
  FOR SELECT USING (status = 'active');

-- Add comments for documentation
COMMENT ON TABLE public.seller_add_item_preloved IS 'Stores preloved items (regular products for sale) uploaded by sellers';
COMMENT ON TABLE public.seller_add_barter_item IS 'Stores barter items (items for trade) uploaded by sellers';
COMMENT ON COLUMN public.seller_add_item_preloved.seller_id IS 'Reference to the seller user';
COMMENT ON COLUMN public.seller_add_item_preloved.images IS 'Array of image URLs for the product';
COMMENT ON COLUMN public.seller_add_item_preloved.barter_requests IS 'JSON array of barter requests for this item';
COMMENT ON COLUMN public.seller_add_barter_item.seller_id IS 'Reference to the seller user';
COMMENT ON COLUMN public.seller_add_barter_item.images IS 'Array of image URLs for the product';
COMMENT ON COLUMN public.seller_add_barter_item.barter_requests IS 'JSON array of barter requests for this item';

