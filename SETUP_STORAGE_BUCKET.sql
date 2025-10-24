-- Setup Storage Bucket for User Documents
-- This script creates the storage bucket for ID document uploads

-- Create storage bucket for user documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-documents',
  'user-documents',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

-- Create RLS policies for the storage bucket
-- Allow authenticated users to upload their own documents
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own documents
CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own documents
CREATE POLICY "Users can update their own documents" ON storage.objects
FOR UPDATE USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to view all documents (for verification purposes)
CREATE POLICY "Admins can view all documents" ON storage.objects
FOR SELECT USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'user-documents' AND
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = auth.uid()
  )
);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create a function to get user documents
CREATE OR REPLACE FUNCTION get_user_documents(user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  bucket_id TEXT,
  path_tokens TEXT[],
  full_path TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.bucket_id,
    o.path_tokens,
    o.name as full_path,
    o.metadata,
    o.created_at,
    o.updated_at
  FROM storage.objects o
  WHERE o.bucket_id = 'user-documents'
    AND o.name LIKE user_id::text || '/%'
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_documents(UUID) TO authenticated;

-- Create a function to clean up old temporary files
CREATE OR REPLACE FUNCTION cleanup_temp_files()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Delete files older than 24 hours that start with 'temp_'
  DELETE FROM storage.objects
  WHERE bucket_id = 'user-documents'
    AND name LIKE 'temp_%'
    AND created_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION cleanup_temp_files() TO service_role;

-- Create a scheduled job to clean up temp files (if pg_cron is available)
-- SELECT cron.schedule('cleanup-temp-files', '0 2 * * *', 'SELECT cleanup_temp_files();');

COMMENT ON FUNCTION get_user_documents(UUID) IS 'Get all documents for a specific user';
COMMENT ON FUNCTION cleanup_temp_files() IS 'Clean up temporary files older than 24 hours';



