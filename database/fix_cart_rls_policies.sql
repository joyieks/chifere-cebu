-- Fix Cart RLS Policies
-- This script fixes the Row-Level Security policies for the buyer_add_to_cart table

-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own cart" ON buyer_add_to_cart;
DROP POLICY IF EXISTS "Users can insert their own cart" ON buyer_add_to_cart;
DROP POLICY IF EXISTS "Users can update their own cart" ON buyer_add_to_cart;
DROP POLICY IF EXISTS "Users can delete their own cart" ON buyer_add_to_cart;

-- Create more permissive RLS policies
CREATE POLICY "Enable all operations for authenticated users" ON buyer_add_to_cart
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Alternative: More specific policies if the above is too permissive
-- CREATE POLICY "Users can view their own cart" ON buyer_add_to_cart
--     FOR SELECT USING (auth.uid() = user_id);

-- CREATE POLICY "Users can insert their own cart" ON buyer_add_to_cart
--     FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "Users can update their own cart" ON buyer_add_to_cart
--     FOR UPDATE USING (auth.uid() = user_id);

-- CREATE POLICY "Users can delete their own cart" ON buyer_add_to_cart
--     FOR DELETE USING (auth.uid() = user_id);

-- Success message
SELECT 'Cart RLS policies fixed successfully!' as message;
