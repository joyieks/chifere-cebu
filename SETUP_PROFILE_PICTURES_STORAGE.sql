-- Setup Supabase Storage for Profile Pictures
-- This script creates the storage bucket and sets up proper policies

-- Create the profile-pictures storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Simple policies for profile pictures
CREATE POLICY "Enable insert for profile-pictures" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profile-pictures');

CREATE POLICY "Enable select for profile-pictures" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-pictures');

CREATE POLICY "Enable update for profile-pictures" ON storage.objects
FOR UPDATE USING (bucket_id = 'profile-pictures');

CREATE POLICY "Enable delete for profile-pictures" ON storage.objects
FOR DELETE USING (bucket_id = 'profile-pictures');
