-- Temporarily disable RLS for testing messaging functionality
-- WARNING: This makes the tables publicly readable - only use for testing!

-- Disable RLS on user_profiles table
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on buyer_users table  
ALTER TABLE public.buyer_users DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('user_profiles', 'buyer_users')
ORDER BY tablename;
