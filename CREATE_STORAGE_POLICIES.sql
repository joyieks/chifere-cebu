-- ============================================================================
-- CREATE STORAGE POLICIES
-- This script creates the necessary RLS policies for storage uploads
-- ============================================================================

-- First, let's check if we can create policies
-- If this fails, we'll need to use the Dashboard UI method

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public uploads to seller-ids" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from seller-ids" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from product-images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Create comprehensive policies for seller-ids bucket
CREATE POLICY "Allow public uploads to seller-ids" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'seller-ids');

CREATE POLICY "Allow public reads from seller-ids" ON storage.objects
FOR SELECT USING (bucket_id = 'seller-ids');

CREATE POLICY "Allow public updates to seller-ids" ON storage.objects
FOR UPDATE USING (bucket_id = 'seller-ids');

CREATE POLICY "Allow public deletes from seller-ids" ON storage.objects
FOR DELETE USING (bucket_id = 'seller-ids');

-- Create comprehensive policies for product-images bucket
CREATE POLICY "Allow public uploads to product-images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow public reads from product-images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Allow public updates to product-images" ON storage.objects
FOR UPDATE USING (bucket_id = 'product-images');

CREATE POLICY "Allow public deletes from product-images" ON storage.objects
FOR DELETE USING (bucket_id = 'product-images');

-- Alternative: Create a single policy for all operations (if above fails)
-- Uncomment the line below if you get permission errors
-- CREATE POLICY "Public Access" ON storage.objects FOR ALL USING (true) WITH CHECK (true);

-- Verify policies were created
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;

-- Success message
SELECT 'Storage policies created successfully!' as status;

