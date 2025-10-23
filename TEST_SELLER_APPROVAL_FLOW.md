# Test Seller Approval Flow

## Overview
This document outlines how to test that sellers cannot access the seller dashboard until admin approval.

## Current Implementation Status ✅

### 1. **Registration Process**
- ✅ Sellers are created with `seller_status: 'pending'` in the database
- ✅ ID documents are uploaded during registration
- ✅ Registration goes directly to success page (no OTP)

### 2. **Authentication System**
- ✅ AuthContext fetches `seller_status` from database
- ✅ User object includes `seller_status` property
- ✅ ProtectedRoute checks for `seller_status === 'pending'`

### 3. **Access Control**
- ✅ ProtectedRoute blocks access to seller dashboard if `seller_status === 'pending'`
- ✅ Shows "Account Pending Review" page instead
- ✅ Only allows access when `seller_status === 'approved'`

## Test Steps

### Step 1: Register as Seller
1. Go to `/signup`
2. Select "Sign up as Seller"
3. Fill the form with:
   - Email: `test-seller@example.com`
   - Password: `password123`
   - Store Name: `Test Store`
   - Store Address: `123 Test Street`
   - Business Info: `Test business`
   - Contact: `1234567890`
   - ID Type: `Driver's License`
   - Upload ID front and back images
4. Click "Register"
5. Should see "Pending Review" success page

### Step 2: Try to Access Seller Dashboard
1. Go to `/login`
2. Login with `test-seller@example.com` and `password123`
3. Should be redirected to buyer dashboard (not seller dashboard)
4. Try to manually navigate to `/seller/dashboard`
5. Should see "Account Pending Review" page instead of seller dashboard

### Step 3: Admin Approval
1. Login as admin (`admin@gmail.com` / `admin123`)
2. Go to Admin Dashboard → Pending
3. Find the test seller application
4. Click "Approve" or "Reject"
5. If approved, seller should now be able to access seller dashboard

### Step 4: Verify Approved Seller Access
1. Login as the approved seller
2. Should be redirected to seller dashboard
3. Should be able to access all seller routes

## Expected Behavior

### Pending Seller (seller_status: 'pending')
- ❌ Cannot access `/seller/dashboard`
- ❌ Cannot access `/seller/products`
- ❌ Cannot access `/seller/orders`
- ❌ Cannot access `/seller/analytics`
- ❌ Cannot access `/seller/messages`
- ❌ Cannot access `/seller/profile`
- ❌ Cannot access `/seller/settings`
- ✅ Can access buyer dashboard
- ✅ Can access buyer routes

### Approved Seller (seller_status: 'approved')
- ✅ Can access all seller routes
- ✅ Can access seller dashboard
- ✅ Can manage products, orders, etc.

## Database Verification

Check the `user_profiles` table:
```sql
SELECT id, email, business_name, seller_status, submitted_at 
FROM user_profiles 
WHERE email = 'test-seller@example.com';
```

Should show:
- `seller_status: 'pending'` (before approval)
- `seller_status: 'approved'` (after approval)

## Troubleshooting

### If seller can access dashboard before approval:
1. Check if `seller_status` is being set correctly in database
2. Check if AuthContext is fetching `seller_status` properly
3. Check if ProtectedRoute is checking `seller_status` correctly

### If pending page doesn't show:
1. Check browser console for errors
2. Verify user object has `seller_status` property
3. Check ProtectedRoute logic

## Files Involved
- `src/contexts/AuthContext.jsx` - Fetches seller_status
- `src/components/ProtectedRoute.jsx` - Blocks access for pending sellers
- `src/components/pages/Authentication/signup.jsx` - Sets seller_status to pending
- `src/components/pages/Admin/AdminDashboard.jsx` - Admin approval interface

