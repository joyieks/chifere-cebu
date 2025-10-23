-- Complete fix for buyer_add_to_cart RLS policies
-- This will ensure cart operations work properly for authenticated users

-- Step 1: Check current RLS status and policies
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'buyer_add_to_cart') as policy_count
FROM pg_tables 
WHERE tablename = 'buyer_add_to_cart';

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own cart" ON public.buyer_add_to_cart;
DROP POLICY IF EXISTS "Users can insert their own cart" ON public.buyer_add_to_cart;
DROP POLICY IF EXISTS "Users can update their own cart" ON public.buyer_add_to_cart;
DROP POLICY IF EXISTS "Users can delete their own cart" ON public.buyer_add_to_cart;
DROP POLICY IF EXISTS "Authenticated users can manage their own carts" ON public.buyer_add_to_cart;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.buyer_add_to_cart;
DROP POLICY IF EXISTS "Enable all operations for service role" ON public.buyer_add_to_cart;

-- Step 3: Create comprehensive policies that work with both auth.users and buyer_users

-- Policy for SELECT (viewing cart)
CREATE POLICY "cart_select_policy" ON public.buyer_add_to_cart
  FOR SELECT USING (
    -- Allow if user_id matches any buyer_users record
    user_id IN (SELECT id FROM buyer_users) OR
    -- Allow if user_id matches any user_profiles record
    user_id IN (SELECT id FROM user_profiles) OR
    -- Allow if user_id matches current authenticated user
    user_id = auth.uid()
  );

-- Policy for INSERT (creating cart)
CREATE POLICY "cart_insert_policy" ON public.buyer_add_to_cart
  FOR INSERT WITH CHECK (
    -- Allow if user_id matches any buyer_users record
    user_id IN (SELECT id FROM buyer_users) OR
    -- Allow if user_id matches any user_profiles record
    user_id IN (SELECT id FROM user_profiles) OR
    -- Allow if user_id matches current authenticated user
    user_id = auth.uid()
  );

-- Policy for UPDATE (updating cart)
CREATE POLICY "cart_update_policy" ON public.buyer_add_to_cart
  FOR UPDATE USING (
    -- Allow if user_id matches any buyer_users record
    user_id IN (SELECT id FROM buyer_users) OR
    -- Allow if user_id matches any user_profiles record
    user_id IN (SELECT id FROM user_profiles) OR
    -- Allow if user_id matches current authenticated user
    user_id = auth.uid()
  );

-- Policy for DELETE (deleting cart)
CREATE POLICY "cart_delete_policy" ON public.buyer_add_to_cart
  FOR DELETE USING (
    -- Allow if user_id matches any buyer_users record
    user_id IN (SELECT id FROM buyer_users) OR
    -- Allow if user_id matches any user_profiles record
    user_id IN (SELECT id FROM user_profiles) OR
    -- Allow if user_id matches current authenticated user
    user_id = auth.uid()
  );

-- Step 4: Verify policies were created
SELECT 
  policyname, 
  cmd as operation, 
  roles,
  permissive
FROM pg_policies 
WHERE tablename = 'buyer_add_to_cart'
ORDER BY policyname;

-- Step 5: Test the policies by trying to insert a test record
-- (This will only work if you're authenticated)
DO $$
DECLARE
  test_user_id UUID;
  test_result RECORD;
BEGIN
  -- Get a test user ID from buyer_users
  SELECT id INTO test_user_id FROM buyer_users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Try to insert a test cart
    INSERT INTO buyer_add_to_cart (user_id, items, created_at, updated_at)
    VALUES (
      test_user_id,
      '[{"id": "test-item", "name": "Test Product", "price": 10.00, "quantity": 1, "addedAt": "2024-01-01T00:00:00.000Z"}]'::jsonb,
      NOW(),
      NOW()
    );
    
    -- Check if it was inserted
    SELECT * INTO test_result FROM buyer_add_to_cart WHERE user_id = test_user_id;
    
    IF test_result.id IS NOT NULL THEN
      RAISE NOTICE 'SUCCESS: Test cart inserted successfully';
      -- Clean up test data
      DELETE FROM buyer_add_to_cart WHERE user_id = test_user_id;
      RAISE NOTICE 'Test data cleaned up';
    ELSE
      RAISE NOTICE 'FAILED: Test cart was not inserted';
    END IF;
  ELSE
    RAISE NOTICE 'No buyer users found to test with';
  END IF;
END $$;

-- Step 6: Show final status
SELECT 
  'buyer_add_to_cart' as table_name,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'buyer_add_to_cart') as policy_count,
  (SELECT COUNT(*) FROM buyer_add_to_cart) as record_count;

