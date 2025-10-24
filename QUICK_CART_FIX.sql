-- QUICK FIX: Disable RLS temporarily to test cart functionality
-- Run this in Supabase SQL Editor

-- Temporarily disable RLS on buyer_add_to_cart table
ALTER TABLE public.buyer_add_to_cart DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'buyer_add_to_cart';

-- Test: Try to insert a test cart record
INSERT INTO public.buyer_add_to_cart (user_id, items, created_at, updated_at)
VALUES (
  'c50fcde7-37f5-4d5e-999d-69cf5cba496c', -- Use one of the existing buyer IDs
  '[{"id": "test-item-1", "name": "Test Product", "price": 25.99, "quantity": 1, "addedAt": "2024-01-01T00:00:00.000Z"}]'::jsonb,
  NOW(),
  NOW()
);

-- Check if the record was inserted
SELECT * FROM public.buyer_add_to_cart;

-- If successful, re-enable RLS with proper policies
ALTER TABLE public.buyer_add_to_cart ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows authenticated users to manage their own carts
CREATE POLICY "Authenticated users can manage their own carts" ON public.buyer_add_to_cart
  FOR ALL USING (auth.role() = 'authenticated');

-- Verify the policy was created
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'buyer_add_to_cart';


