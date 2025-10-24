-- Fix order visibility issues
-- This script ensures orders can be created and retrieved properly

-- 1. First, let's check the current state
SELECT 'Current RLS status:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('buyer_orders', 'buyer_order_items');

-- 2. Temporarily disable RLS to allow order creation and retrieval
ALTER TABLE buyer_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_order_items DISABLE ROW LEVEL SECURITY;

-- 3. Create proper RLS policies for buyer_orders
DROP POLICY IF EXISTS "Users can view their own orders" ON buyer_orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON buyer_orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON buyer_orders;

-- Enable RLS
ALTER TABLE buyer_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for buyers
CREATE POLICY "Buyers can view their own orders" ON buyer_orders
    FOR SELECT USING (buyer_id = auth.uid()::text);

CREATE POLICY "Buyers can insert their own orders" ON buyer_orders
    FOR INSERT WITH CHECK (buyer_id = auth.uid()::text);

CREATE POLICY "Buyers can update their own orders" ON buyer_orders
    FOR UPDATE USING (buyer_id = auth.uid()::text);

-- Create policies for sellers
CREATE POLICY "Sellers can view orders for their items" ON buyer_orders
    FOR SELECT USING (seller_id = auth.uid()::text);

CREATE POLICY "Sellers can update their orders" ON buyer_orders
    FOR UPDATE USING (seller_id = auth.uid()::text);

-- 4. Create proper RLS policies for buyer_order_items
DROP POLICY IF EXISTS "Users can view order items" ON buyer_order_items;
DROP POLICY IF EXISTS "Users can insert order items" ON buyer_order_items;

-- Enable RLS
ALTER TABLE buyer_order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for order items
CREATE POLICY "Users can view order items" ON buyer_order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM buyer_orders 
            WHERE buyer_orders.id = buyer_order_items.order_id 
            AND (buyer_orders.buyer_id = auth.uid()::text OR buyer_orders.seller_id = auth.uid()::text)
        )
    );

CREATE POLICY "Users can insert order items" ON buyer_order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM buyer_orders 
            WHERE buyer_orders.id = buyer_order_items.order_id 
            AND buyer_orders.buyer_id = auth.uid()::text
        )
    );

-- 5. Grant necessary permissions
GRANT ALL ON buyer_orders TO authenticated;
GRANT ALL ON buyer_order_items TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 6. Test the setup
SELECT 'Testing order creation and retrieval...' as info;

-- Insert a test order
INSERT INTO buyer_orders (
    order_number,
    buyer_id,
    seller_id,
    status,
    payment_status,
    delivery_status,
    subtotal,
    delivery_fee,
    total_amount,
    payment_method,
    delivery_address,
    notes,
    created_at,
    updated_at
) VALUES (
    'TEST-' || EXTRACT(EPOCH FROM NOW())::text,
    'd7f43ccd-3576-43e3-ac94-ec60c7674df9',
    'demo_seller',
    'pending',
    'pending',
    'pending',
    100.00,
    50.00,
    150.00,
    'cod',
    '{"name": "Test User", "phone": "09123456789", "address": "Test Address"}',
    'Test order for debugging',
    NOW(),
    NOW()
) RETURNING id, order_number, buyer_id, status;

-- Try to retrieve orders
SELECT 'Retrieving orders for user...' as info;
SELECT id, order_number, buyer_id, status, payment_status, total_amount, created_at
FROM buyer_orders 
WHERE buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9'
ORDER BY created_at DESC
LIMIT 5;

SELECT 'Order visibility fix completed!' as message;
