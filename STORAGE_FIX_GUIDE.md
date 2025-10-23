# Supabase Storage Upload Fix Guide

## Problem
Getting "new row violates row-level security policy" error when uploading files to Supabase storage buckets.

## Solution Options

### Option 1: Fix via Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
2. **Navigate to Storage → Policies**
3. **For each bucket (`seller-ids` and `product-images`):**

   **Create INSERT Policy:**
   - Policy Name: `Enable insert for [bucket-name]`
   - Operation: `INSERT`
   - Target roles: `public`
   - USING expression: `true`
   - WITH CHECK expression: `bucket_id = '[bucket-name]'`

   **Create SELECT Policy:**
   - Policy Name: `Enable select for [bucket-name]`
   - Operation: `SELECT`
   - Target roles: `public`
   - USING expression: `bucket_id = '[bucket-name]'`

### Option 2: Fix via SQL Editor

Run this SQL in your Supabase SQL Editor:

```sql
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
```

### Option 3: Make Buckets Public (Quick Fix)

1. **Go to Storage → Buckets**
2. **Click on each bucket (`seller-ids`, `product-images`)**
3. **Toggle "Public bucket" to ON**
4. **Save changes**

## Verification

After applying any of the above solutions:

1. **Test file upload** in your seller signup form
2. **Check browser console** - should see successful upload logs
3. **Verify files appear** in Supabase Storage dashboard

## Expected Result

- ✅ File uploads work without errors
- ✅ ID documents upload successfully
- ✅ Product images upload successfully
- ✅ Files are accessible via public URLs

## Troubleshooting

If you still get errors:

1. **Check bucket names** - ensure they match exactly (`seller-ids`, `product-images`)
2. **Verify bucket exists** - create buckets if they don't exist
3. **Check file size** - ensure files are under 10MB
4. **Check file type** - ensure files are JPG, PNG, or PDF

## File Upload Flow

```
User selects file
    ↓
File validation (type, size)
    ↓
Generate unique filename
    ↓
Upload to Supabase storage
    ↓
Get public URL
    ↓
Store URL in database
```

