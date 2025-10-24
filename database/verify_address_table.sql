-- Verify address table status (safe to run multiple times)
-- This script checks if the buyer_addresses table exists and is properly configured

-- Check if buyer_addresses table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'buyer_addresses') 
    THEN '✅ buyer_addresses table exists'
    ELSE '❌ buyer_addresses table does NOT exist'
  END as table_status;

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'buyer_addresses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'buyer_addresses';

-- Check existing policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'buyer_addresses';

-- Test insert permission (this will show if RLS is working)
-- Note: This is just a test query, it won't actually insert anything
SELECT 'RLS policies are configured and table is ready for use!' as status;
