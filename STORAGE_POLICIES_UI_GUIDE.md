# Create Storage Policies via Supabase Dashboard UI

## Problem
Even with public buckets, you're still getting "row-level security policy" errors because the actual RLS policies don't exist.

## Solution: Create Policies via Dashboard UI

### Step 1: Navigate to Storage Policies
1. Go to your **Supabase Dashboard**
2. Click on **Storage** in the left sidebar
3. Click on **Policies** tab

### Step 2: Create Policy for seller-ids Bucket

**Policy 1: Allow Public Uploads**
1. Click **"New Policy"**
2. Fill in the form:
   - **Policy Name:** `Allow public uploads to seller-ids`
   - **Operation:** `INSERT`
   - **Target roles:** `public`
   - **USING expression:** `true`
   - **WITH CHECK expression:** `bucket_id = 'seller-ids'`
3. Click **"Review"** then **"Save policy"**

**Policy 2: Allow Public Reads**
1. Click **"New Policy"**
2. Fill in the form:
   - **Policy Name:** `Allow public reads from seller-ids`
   - **Operation:** `SELECT`
   - **Target roles:** `public`
   - **USING expression:** `bucket_id = 'seller-ids'`
   - **WITH CHECK expression:** (leave empty)
3. Click **"Review"** then **"Save policy"**

**Policy 3: Allow Public Updates**
1. Click **"New Policy"**
2. Fill in the form:
   - **Policy Name:** `Allow public updates to seller-ids`
   - **Operation:** `UPDATE`
   - **Target roles:** `public`
   - **USING expression:** `bucket_id = 'seller-ids'`
   - **WITH CHECK expression:** `bucket_id = 'seller-ids'`
3. Click **"Review"** then **"Save policy"**

**Policy 4: Allow Public Deletes**
1. Click **"New Policy"**
2. Fill in the form:
   - **Policy Name:** `Allow public deletes from seller-ids`
   - **Operation:** `DELETE`
   - **Target roles:** `public`
   - **USING expression:** `bucket_id = 'seller-ids'`
   - **WITH CHECK expression:** (leave empty)
3. Click **"Review"** then **"Save policy"**

### Step 3: Create Policy for product-images Bucket

Repeat the same 4 policies for the `product-images` bucket:

**Policy 1: Allow Public Uploads**
- **Policy Name:** `Allow public uploads to product-images`
- **Operation:** `INSERT`
- **Target roles:** `public`
- **USING expression:** `true`
- **WITH CHECK expression:** `bucket_id = 'product-images'`

**Policy 2: Allow Public Reads**
- **Policy Name:** `Allow public reads from product-images`
- **Operation:** `SELECT`
- **Target roles:** `public`
- **USING expression:** `bucket_id = 'product-images'`

**Policy 3: Allow Public Updates**
- **Policy Name:** `Allow public updates to product-images`
- **Operation:** `UPDATE`
- **Target roles:** `public`
- **USING expression:** `bucket_id = 'product-images'`
- **WITH CHECK expression:** `bucket_id = 'product-images'`

**Policy 4: Allow Public Deletes**
- **Policy Name:** `Allow public deletes from product-images`
- **Operation:** `DELETE`
- **Target roles:** `public`
- **USING expression:** `bucket_id = 'product-images'`

### Step 4: Verify Policies
After creating all policies, you should see 8 policies total:
- 4 for `seller-ids` bucket
- 4 for `product-images` bucket

### Step 5: Test File Upload
1. Go to your seller signup form
2. Try uploading ID documents
3. Check browser console for success messages
4. Verify files appear in Supabase Storage

## Alternative: Single Policy (If Above Fails)

If you can't create individual policies, create one policy for all operations:

1. Click **"New Policy"**
2. Fill in the form:
   - **Policy Name:** `Public Access`
   - **Operation:** `ALL`
   - **Target roles:** `public`
   - **USING expression:** `true`
   - **WITH CHECK expression:** `true`
3. Click **"Review"** then **"Save policy"**

## Expected Result

After creating these policies:
- ✅ File uploads work without errors
- ✅ No more "row-level security policy" errors
- ✅ ID documents upload successfully
- ✅ Product images upload successfully
- ✅ Files are publicly accessible

## Troubleshooting

If you still get errors:
1. **Check policy syntax** - ensure expressions are correct
2. **Verify bucket names** - must match exactly (`seller-ids`, `product-images`)
3. **Check policy order** - some policies might conflict
4. **Try the single policy approach** - create one policy for all operations


