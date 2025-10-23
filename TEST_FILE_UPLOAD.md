# Test File Upload After Storage Fix

## Current Status
✅ `seller-ids` bucket is set to **Public**
✅ `product-images` bucket is set to **Public**

## Test Steps

### 1. Test Seller Signup Form
1. Go to `/signup`
2. Select "Seller" option
3. Fill out the form:
   - Store Name: "Test Store"
   - Store Address: "123 Test St"
   - Business Info: "Test business"
   - Contact: "+639123456789"
   - Email: "test@example.com"
   - Password: "Test123!"
   - ID Type: "Driver's License"

### 2. Test File Upload
1. Click "Choose File" for ID Front
2. Select a JPG/PNG image file (under 10MB)
3. Click "Choose File" for ID Back
4. Select another JPG/PNG image file
5. Click "Submit" button

### 3. Check Browser Console
Look for these success messages:
```
📤 Uploading ID document to bucket: seller-ids
📤 File path: seller-ids/temp_user_id_id_front_[timestamp].jpg
✅ Upload successful: [file data]
```

### 4. Check Supabase Storage
1. Go to Supabase Dashboard → Storage
2. Click on `seller-ids` bucket
3. Verify files were uploaded

## If Upload Still Fails

### Check Browser Console for Errors
Look for these error patterns:
- `StorageApiError: new row violates row-level security policy`
- `400 (Bad Request)`
- `Bucket not found`

### Possible Issues & Solutions

#### Issue 1: File Size Too Large
**Error:** File upload fails silently
**Solution:** Use files under 10MB

#### Issue 2: Wrong File Type
**Error:** Upload fails
**Solution:** Use only JPG, PNG, or PDF files

#### Issue 3: Network Issues
**Error:** Request timeout
**Solution:** Check internet connection

#### Issue 4: Supabase Configuration
**Error:** Still getting RLS errors
**Solution:** 
1. Go to Storage → Policies
2. Check if policies exist for both buckets
3. If no policies, create them manually

## Expected Success Flow

```
1. User fills form ✅
2. Selects ID files ✅
3. Clicks Submit ✅
4. Files upload to seller-ids bucket ✅
5. Success message appears ✅
6. OTP email is sent ✅
7. User enters OTP ✅
8. Seller appears in admin pending list ✅
```

## Manual Policy Creation (If Needed)

If uploads still fail, create policies manually:

1. Go to **Storage → Policies**
2. Click **"New Policy"**
3. For `seller-ids` bucket:
   - **Policy Name:** "Allow public uploads to seller-ids"
   - **Operation:** INSERT
   - **Target roles:** public
   - **USING expression:** `true`
   - **WITH CHECK expression:** `bucket_id = 'seller-ids'`

4. Repeat for `product-images` bucket

## Test Results

After testing, you should see:
- ✅ Files upload successfully
- ✅ No console errors
- ✅ Files visible in Supabase storage
- ✅ Seller registration completes
- ✅ OTP email received

