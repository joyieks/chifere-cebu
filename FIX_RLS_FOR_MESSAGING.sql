-- Fix RLS policies to allow users to see each other's basic info for messaging
-- This allows sellers to see buyer names and buyers to see seller names

-- 1. Allow users to read basic info from user_profiles table
-- (This should already work, but let's make sure)

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow users to read other users basic info" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to read buyer info for messaging" ON public.buyer_users;

-- Create policy for user_profiles table
-- Allow authenticated users to read basic info (name, profile image) from other users
CREATE POLICY "Allow users to read other users basic info" ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  -- Allow reading basic info for messaging purposes
  true
);

-- 2. Allow users to read basic info from buyer_users table
-- This is the main fix - allow sellers to see buyer names

CREATE POLICY "Allow users to read buyer info for messaging" ON public.buyer_users
FOR SELECT
TO authenticated
USING (
  -- Allow reading basic info for messaging purposes
  true
);

-- 3. Alternative approach: Create a more restrictive policy
-- If you want to be more restrictive, you can use this instead:

-- DROP POLICY IF EXISTS "Allow users to read buyer info for messaging" ON public.buyer_users;
-- 
-- CREATE POLICY "Allow users to read buyer info for messaging" ON public.buyer_users
-- FOR SELECT
-- TO authenticated
-- USING (
--   -- Only allow reading if the user is involved in a conversation with this buyer
--   EXISTS (
--     SELECT 1 FROM conversations 
--     WHERE (buyer_id = buyer_users.id AND seller_id = auth.uid())
--        OR (seller_id = buyer_users.id AND buyer_id = auth.uid())
--   )
-- );

-- 4. Make sure RLS is enabled on both tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_users ENABLE ROW LEVEL SECURITY;

-- 5. Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'buyer_users')
ORDER BY tablename, policyname;
