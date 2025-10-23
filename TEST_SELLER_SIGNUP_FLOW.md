# Seller Signup Flow Test Guide

## Complete Seller Registration Process

### 1. **Seller Registration Form**
- Fill out seller information:
  - Store Name
  - Store Address  
  - Business Information
  - Contact Number
  - Email
  - Password
  - ID Type (Driver's License, Passport, etc.)

### 2. **ID Document Upload**
- Upload ID Front Image
- Upload ID Back Image
- Files are stored in `seller-ids` bucket
- Validation: JPG, PNG, PDF files only, max 10MB

### 3. **OTP Email Verification**
- System sends 6-digit OTP to seller's email
- OTP expires in 10 minutes
- Seller enters OTP code to verify email

### 4. **Admin Review Process**
- Seller appears in Admin Dashboard → Pending page
- Admin can:
  - View seller details
  - View uploaded ID documents
  - Approve or Reject application
  - Add rejection reason if rejected

### 5. **Post-Approval**
- Approved sellers can login and access seller dashboard
- Rejected sellers can reapply with updated information

## Testing Steps

### Test 1: Complete Seller Registration
1. Go to `/signup`
2. Select "Seller" option
3. Fill out all required fields
4. Upload ID documents (front and back)
5. Submit form
6. Check email for OTP
7. Enter OTP code
8. Verify success message

### Test 2: Admin Review
1. Login as admin (`admin@gmail.com` / `admin123`)
2. Go to Admin Dashboard → Pending
3. Find the new seller application
4. Click "View Profile" to see details
5. Click "Approve" or "Reject"
6. Verify seller status changes

### Test 3: Seller Login After Approval
1. Try to login with seller credentials
2. Should redirect to seller dashboard
3. Verify seller can access all seller features

## Troubleshooting

### Image Upload Issues
- **Error**: "Bucket not found"
- **Solution**: Ensure `seller-ids` bucket exists in Supabase Storage
- **Check**: Bucket is set to "Public" access

### OTP Issues
- **Error**: "Failed to send OTP"
- **Solution**: Check EmailJS configuration
- **Check**: OTP table exists in database

### Admin Review Issues
- **Error**: Seller not appearing in pending list
- **Solution**: Check `user_profiles` table for `seller_status = 'pending'`
- **Check**: Admin service is fetching from correct tables

## Database Tables Used

1. **`user_profiles`** - Seller information and status
2. **`otp_verifications`** - OTP codes for email verification
3. **`admin_activities`** - Admin action logs
4. **`seller-ids` bucket** - ID document storage

## Success Criteria

✅ Seller can complete registration form
✅ ID documents upload successfully
✅ OTP is sent and verified
✅ Seller appears in admin pending list
✅ Admin can approve/reject seller
✅ Approved seller can login and access dashboard

