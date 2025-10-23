-- Fix RLS policies for buyer_add_to_cart table
-- This will allow users to properly add, view, update, and delete their cart items

-- First, let's check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'buyer_add_to_cart';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own cart" ON public.buyer_add_to_cart;
DROP POLICY IF EXISTS "Users can insert their own cart" ON public.buyer_add_to_cart;
DROP POLICY IF EXISTS "Users can update their own cart" ON public.buyer_add_to_cart;
DROP POLICY IF EXISTS "Users can delete their own cart" ON public.buyer_add_to_cart;

-- Create new, more permissive policies for cart operations
-- These policies will work with both auth.users and buyer_users

-- Policy 1: Users can view their own cart
CREATE POLICY "Users can view their own cart" ON public.buyer_add_to_cart
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM buyer_users WHERE id = user_id
    ) OR
    user_id IN (
      SELECT id FROM user_profiles WHERE id = user_id
    )
  );

-- Policy 2: Users can insert their own cart
CREATE POLICY "Users can insert their own cart" ON public.buyer_add_to_cart
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM buyer_users WHERE id = user_id
    ) OR
    user_id IN (
      SELECT id FROM user_profiles WHERE id = user_id
    )
  );

-- Policy 3: Users can update their own cart
CREATE POLICY "Users can update their own cart" ON public.buyer_add_to_cart
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM buyer_users WHERE id = user_id
    ) OR
    user_id IN (
      SELECT id FROM user_profiles WHERE id = user_id
    )
  );

-- Policy 4: Users can delete their own cart
CREATE POLICY "Users can delete their own cart" ON public.buyer_add_to_cart
  FOR DELETE USING (
    user_id IN (
      SELECT id FROM buyer_users WHERE id = user_id
    ) OR
    user_id IN (
      SELECT id FROM user_profiles WHERE id = user_id
    )
  );

-- Alternative: More permissive policies (if the above don't work)
-- Uncomment these if the above policies still don't work

/*
-- Drop the restrictive policies
DROP POLICY IF EXISTS "Users can view their own cart" ON public.buyer_add_to_cart;
DROP POLICY IF EXISTS "Users can insert their own cart" ON public.buyer_add_to_cart;
DROP POLICY IF EXISTS "Users can update their own cart" ON public.buyer_add_to_cart;
DROP POLICY IF EXISTS "Users can delete their own cart" ON public.buyer_add_to_cart;

-- Create more permissive policies
CREATE POLICY "Enable all operations for authenticated users" ON public.buyer_add_to_cart
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for service role" ON public.buyer_add_to_cart
  FOR ALL USING (auth.role() = 'service_role');
*/

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'buyer_add_to_cart'
ORDER BY policyname;

