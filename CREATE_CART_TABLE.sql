-- Create the missing buyer_add_to_cart table
-- This table stores cart items for buyers

CREATE TABLE public.buyer_add_to_cart (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT buyer_add_to_cart_pkey PRIMARY KEY (id),
  CONSTRAINT buyer_add_to_cart_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create unique index to ensure one cart per user
CREATE UNIQUE INDEX buyer_add_to_cart_user_id_unique ON public.buyer_add_to_cart (user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.buyer_add_to_cart ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access their own cart
CREATE POLICY "Users can view their own cart" ON public.buyer_add_to_cart
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart" ON public.buyer_add_to_cart
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart" ON public.buyer_add_to_cart
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart" ON public.buyer_add_to_cart
  FOR DELETE USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE public.buyer_add_to_cart IS 'Stores shopping cart items for buyers';
COMMENT ON COLUMN public.buyer_add_to_cart.user_id IS 'Reference to the buyer user';
COMMENT ON COLUMN public.buyer_add_to_cart.items IS 'JSON array of cart items with product details';
COMMENT ON COLUMN public.buyer_add_to_cart.created_at IS 'When the cart was first created';
COMMENT ON COLUMN public.buyer_add_to_cart.updated_at IS 'When the cart was last updated';

