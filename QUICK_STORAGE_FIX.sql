-- ============================================================================
-- QUICK STORAGE FIX
-- Run this in your Supabase SQL Editor to fix storage upload issues
-- ============================================================================

-- Option 1: Disable RLS on storage.objects (Quick fix)
-- WARNING: This makes storage completely public
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS enabled, use these policies instead:
-- (Uncomment the lines below and comment out the line above)

/*
-- Re-enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create simple public access policies
CREATE POLICY "Public Access" ON storage.objects
FOR ALL USING (true) WITH CHECK (true);
*/

-- Verify the change
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'objects' 
  AND schemaname = 'storage';

-- Success message
SELECT 'Storage RLS disabled - uploads should now work!' as status;

