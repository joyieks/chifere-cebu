-- ============================================================================
-- SUPABASE STORAGE FIX (Correct Method)
-- This script fixes storage upload issues using Supabase's proper methods
-- ============================================================================

-- Method 1: Create storage policies (Recommended)
-- This is the proper way to fix storage upload issues in Supabase

-- First, let's check if we can create policies
-- If this fails, we'll use Method 2

-- Create policy for seller-ids bucket uploads
CREATE POLICY "Enable insert for seller-ids bucket" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'seller-ids');

-- Create policy for seller-ids bucket reads
CREATE POLICY "Enable select for seller-ids bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'seller-ids');

-- Create policy for product-images bucket uploads
CREATE POLICY "Enable insert for product-images bucket" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images');

-- Create policy for product-images bucket reads
CREATE POLICY "Enable select for product-images bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Verify policies were created
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;

-- Success message
SELECT 'Storage policies created successfully!' as status;

