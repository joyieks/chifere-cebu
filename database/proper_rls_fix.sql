-- Proper RLS fix with correct UUID/TEXT handling
-- Run this after the quick fix to properly secure the tables

-- 1. First, let's check the data types of the columns
SELECT 'Checking column data types:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'buyer_orders' 
AND column_name IN ('buyer_id', 'seller_id')
ORDER BY column_name;

-- 2. Check what auth.uid() returns
SELECT 'Checking auth.uid() type:' as info;
SELECT pg_typeof(auth.uid()) as auth_uid_type;

-- 3. Drop existing policies if they exist
DROP POLICY IF EXISTS "Buyers can view their own orders" ON buyer_orders;
DROP POLICY IF EXISTS "Buyers can insert their own orders" ON buyer_orders;
DROP POLICY IF EXISTS "Buyers can update their own orders" ON buyer_orders;
DROP POLICY IF EXISTS "Sellers can view orders for their items" ON buyer_orders;
DROP POLICY IF EXISTS "Sellers can update their orders" ON buyer_orders;
DROP POLICY IF EXISTS "Users can view order items" ON buyer_order_items;
DROP POLICY IF EXISTS "Users can insert order items" ON buyer_order_items;

-- 4. Enable RLS
ALTER TABLE buyer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_order_items ENABLE ROW LEVEL SECURITY;

-- 5. Create policies with proper type casting
-- For buyers (assuming buyer_id is TEXT and auth.uid() is UUID)
CREATE POLICY "Buyers can view their own orders" ON buyer_orders
    FOR SELECT USING (buyer_id = auth.uid()::text);

CREATE POLICY "Buyers can insert their own orders" ON buyer_orders
    FOR INSERT WITH CHECK (buyer_id = auth.uid()::text);

CREATE POLICY "Buyers can update their own orders" ON buyer_orders
    FOR UPDATE USING (buyer_id = auth.uid()::text);

-- For sellers
CREATE POLICY "Sellers can view orders for their items" ON buyer_orders
    FOR SELECT USING (seller_id = auth.uid()::text);

CREATE POLICY "Sellers can update their orders" ON buyer_orders
    FOR UPDATE USING (seller_id = auth.uid()::text);

-- 6. Create policies for order items
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

-- 7. Test the policies
SELECT 'Testing RLS policies...' as info;

-- This should work if the user is authenticated
SELECT COUNT(*) as order_count
FROM buyer_orders 
WHERE buyer_id = auth.uid()::text;

SELECT 'RLS policies created successfully!' as message;
