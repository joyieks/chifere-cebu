-- ============================================================================
-- FIX STORAGE BUCKET POLICIES
-- This script fixes Row Level Security policies for Supabase storage buckets
-- ============================================================================

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public uploads to seller-ids bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to product-images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from seller-ids bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from product-images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to seller-ids" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to seller-ids" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to product-images" ON storage.objects;

-- Create policies for seller-ids bucket
-- Allow public uploads to seller-ids bucket
CREATE POLICY "Allow public uploads to seller-ids bucket" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'seller-ids');

-- Allow public reads from seller-ids bucket
CREATE POLICY "Allow public reads from seller-ids bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'seller-ids');

-- Allow public updates to seller-ids bucket (for file updates)
CREATE POLICY "Allow public updates to seller-ids bucket" ON storage.objects
FOR UPDATE USING (bucket_id = 'seller-ids');

-- Allow public deletes from seller-ids bucket (for file cleanup)
CREATE POLICY "Allow public deletes from seller-ids bucket" ON storage.objects
FOR DELETE USING (bucket_id = 'seller-ids');

-- Create policies for product-images bucket
-- Allow public uploads to product-images bucket
CREATE POLICY "Allow public uploads to product-images bucket" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images');

-- Allow public reads from product-images bucket
CREATE POLICY "Allow public reads from product-images bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Allow public updates to product-images bucket
CREATE POLICY "Allow public updates to product-images bucket" ON storage.objects
FOR UPDATE USING (bucket_id = 'product-images');

-- Allow public deletes from product-images bucket
CREATE POLICY "Allow public deletes from product-images bucket" ON storage.objects
FOR DELETE USING (bucket_id = 'product-images');

-- Alternative: Create more restrictive policies for authenticated users only
-- Uncomment these if you want to restrict uploads to authenticated users only

/*
-- Allow authenticated users to upload to seller-ids
CREATE POLICY "Allow authenticated uploads to seller-ids" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'seller-ids' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to upload to product-images
CREATE POLICY "Allow authenticated uploads to product-images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Allow public reads from both buckets
CREATE POLICY "Allow public access to seller-ids" ON storage.objects
FOR SELECT USING (bucket_id = 'seller-ids');

CREATE POLICY "Allow public access to product-images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');
*/

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;

-- Show success message
DO $$
BEGIN
  RAISE NOTICE 'Storage bucket policies created successfully!';
  RAISE NOTICE 'Buckets configured: seller-ids, product-images';
  RAISE NOTICE 'Policies: INSERT, SELECT, UPDATE, DELETE for both buckets';
  RAISE NOTICE 'File uploads should now work properly.';
END $$;

