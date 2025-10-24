-- Secure RLS policies for messaging - only allow users to see info of people they're messaging with
-- This is more secure than the open policy above

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Allow users to read other users basic info" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to read buyer info for messaging" ON public.buyer_users;

-- 2. Create secure policy for user_profiles table
-- Allow users to read basic info only if they're in a conversation together
CREATE POLICY "Allow users to read other users basic info" ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  -- Allow reading if the current user is in a conversation with this user
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE (buyer_id = user_profiles.id AND seller_id = auth.uid())
       OR (seller_id = user_profiles.id AND buyer_id = auth.uid())
  )
  OR
  -- Allow users to read their own profile
  user_profiles.id = auth.uid()
);

-- 3. Create secure policy for buyer_users table
-- Allow users to read buyer info only if they're in a conversation together
CREATE POLICY "Allow users to read buyer info for messaging" ON public.buyer_users
FOR SELECT
TO authenticated
USING (
  -- Allow reading if the current user is in a conversation with this buyer
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE (buyer_id = buyer_users.id AND seller_id = auth.uid())
       OR (seller_id = buyer_users.id AND buyer_id = auth.uid())
  )
  OR
  -- Allow users to read their own buyer profile
  buyer_users.id = auth.uid()
);

-- 4. Make sure RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_users ENABLE ROW LEVEL SECURITY;

-- 5. Verify the policies
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
