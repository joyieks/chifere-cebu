# Profile Pictures Storage Setup Guide

## Option 1: Manual Setup via Supabase Dashboard (Recommended)

### Step 1: Create Storage Bucket
1. Go to your **Supabase Dashboard**
2. Navigate to **Storage** → **Buckets**
3. Click **"New bucket"**
4. Fill in the details:
   - **Name**: `profile-pictures`
   - **Public bucket**: ✅ **ON** (Enable this)
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/webp`
5. Click **"Create bucket"**

### Step 2: Set Up Storage Policies
1. Go to **Storage** → **Policies**
2. For the `profile-pictures` bucket, create these policies:

#### Policy 1: Enable Insert
- **Policy name**: `Enable insert for profile-pictures`
- **Operation**: `INSERT`
- **Target roles**: `public`
- **USING expression**: (leave empty)
- **WITH CHECK expression**: `bucket_id = 'profile-pictures'`

#### Policy 2: Enable Select
- **Policy name**: `Enable select for profile-pictures`
- **Operation**: `SELECT`
- **Target roles**: `public`
- **USING expression**: `bucket_id = 'profile-pictures'`
- **WITH CHECK expression**: (leave empty)

#### Policy 3: Enable Update
- **Policy name**: `Enable update for profile-pictures`
- **Operation**: `UPDATE`
- **Target roles**: `public`
- **USING expression**: `bucket_id = 'profile-pictures'`
- **WITH CHECK expression**: `bucket_id = 'profile-pictures'`

#### Policy 4: Enable Delete
- **Policy name**: `Enable delete for profile-pictures`
- **Operation**: `DELETE`
- **Target roles**: `public`
- **USING expression**: `bucket_id = 'profile-pictures'`
- **WITH CHECK expression**: (leave empty)

## Option 2: Alternative SQL Script (If you have admin access)

If you have admin access to your Supabase project, you can try this simplified SQL script:

```sql
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
```

## Option 3: Use Existing Bucket

If you already have a working storage bucket (like `product-images`), you can modify the file upload service to use that bucket instead:

1. Open `src/services/fileUploadService.js`
2. Find the `uploadProfilePicture` method
3. Change the bucket name from `'profile-pictures'` to `'product-images'` (or any existing bucket)

## Verification

After setting up the storage bucket:

1. **Test the upload** in your seller or buyer profile
2. **Check browser console** - should see successful upload logs
3. **Verify files appear** in Supabase Storage dashboard under the `profile-pictures` bucket
4. **Check that images display** correctly in the profile components

## Troubleshooting

### Common Issues:
- **Permission denied**: Use the manual dashboard setup (Option 1)
- **Bucket already exists**: The bucket might already be created, just set up the policies
- **RLS errors**: Make sure the bucket is set to public and policies are correctly configured

### Quick Fix:
If you're still having issues, you can temporarily use an existing bucket by modifying the file upload service to use `'product-images'` instead of `'profile-pictures'`.
