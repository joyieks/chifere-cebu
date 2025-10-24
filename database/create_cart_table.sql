-- Create Cart Table
-- This script creates the missing buyer_add_to_cart table

-- Create the buyer_add_to_cart table
CREATE TABLE IF NOT EXISTS buyer_add_to_cart (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one cart per user
    UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_buyer_add_to_cart_user_id ON buyer_add_to_cart(user_id);
CREATE INDEX IF NOT EXISTS idx_buyer_add_to_cart_updated_at ON buyer_add_to_cart(updated_at);

-- Enable Row Level Security
ALTER TABLE buyer_add_to_cart ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own cart" ON buyer_add_to_cart
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart" ON buyer_add_to_cart
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart" ON buyer_add_to_cart
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart" ON buyer_add_to_cart
    FOR DELETE USING (auth.uid() = user_id);

-- Success message
SELECT 'Cart table created successfully!' as message;
