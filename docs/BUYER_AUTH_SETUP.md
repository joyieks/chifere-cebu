# Buyer Authentication Setup Guide

## Overview
This guide explains how to set up buyer authentication for the ChiFere app using Supabase and EmailJS.

## Prerequisites
- Supabase project set up
- EmailJS account configured
- Environment variables configured

## Database Setup

### 1. Run the SQL Script
Execute the `BUYER_SETUP.sql` script in your Supabase SQL editor:

```sql
-- Copy and paste the entire BUYER_SETUP.sql file content
-- This will create all necessary tables, functions, triggers, and policies
```

### 2. Verify Tables Created
Check that these tables were created:
- `otp_verifications` - For OTP verification
- `buyer_users` - Buyer user profiles
- `user_profiles` - General user profiles
- `buyer_add_to_cart` - Shopping cart
- `buyer_order_item` - Order history
- `buyer_payment_method` - Payment methods

## Authentication Flow

### 1. Buyer Signup Process
1. User selects "Buyer" as user type
2. Fills out registration form
3. System sends OTP to email via EmailJS
4. User verifies OTP
5. Account is created in Supabase Auth
6. User profile is automatically created via triggers
7. User is redirected to buyer dashboard

### 2. Buyer Login Process
1. User enters email and password
2. Supabase authenticates the user
3. User profile is loaded from database
4. User is redirected to buyer dashboard

## Key Features

### Automatic Profile Creation
- When a user signs up, triggers automatically create:
  - `user_profiles` record
  - `buyer_users` record (if user_type is 'buyer')

### OTP Verification
- 6-digit OTP codes
- 5-minute expiration
- 3 attempt limit
- Automatic cleanup of expired codes

### Row Level Security (RLS)
- Users can only access their own data
- Secure by default
- No data leakage between users

## Testing the Setup

### 1. Test Buyer Signup
1. Go to `/signup`
2. Select "Buyer"
3. Fill out the form
4. Check email for OTP
5. Verify OTP
6. Should redirect to buyer dashboard

### 2. Test Buyer Login
1. Go to `/login`
2. Enter buyer credentials
3. Should redirect to buyer dashboard

### 3. Test Dashboard Access
1. Login as buyer
2. Navigate to `/buyer/dashboard`
3. Should see buyer dashboard

## Troubleshooting

### Common Issues

1. **OTP not received**
   - Check EmailJS configuration
   - Verify email template
   - Check spam folder

2. **Profile not created**
   - Check Supabase triggers
   - Verify RLS policies
   - Check console for errors

3. **Login redirect issues**
   - Check user.user_type field
   - Verify ProtectedRoute logic
   - Check console logs

### Debug Steps

1. Check browser console for errors
2. Verify Supabase connection
3. Check database logs
4. Test with different email addresses

## Security Features

- Password hashing (handled by Supabase)
- Email verification required
- OTP verification for signup
- Row Level Security policies
- Secure session management
- Automatic token refresh

## Next Steps

After buyer authentication is working:
1. Set up seller authentication
2. Implement KYC verification for sellers
3. Add profile management features
4. Implement password reset
5. Add social login options



## Overview
This guide explains how to set up buyer authentication for the ChiFere app using Supabase and EmailJS.

## Prerequisites
- Supabase project set up
- EmailJS account configured
- Environment variables configured

## Database Setup

### 1. Run the SQL Script
Execute the `BUYER_SETUP.sql` script in your Supabase SQL editor:

```sql
-- Copy and paste the entire BUYER_SETUP.sql file content
-- This will create all necessary tables, functions, triggers, and policies
```

### 2. Verify Tables Created
Check that these tables were created:
- `otp_verifications` - For OTP verification
- `buyer_users` - Buyer user profiles
- `user_profiles` - General user profiles
- `buyer_add_to_cart` - Shopping cart
- `buyer_order_item` - Order history
- `buyer_payment_method` - Payment methods

## Authentication Flow

### 1. Buyer Signup Process
1. User selects "Buyer" as user type
2. Fills out registration form
3. System sends OTP to email via EmailJS
4. User verifies OTP
5. Account is created in Supabase Auth
6. User profile is automatically created via triggers
7. User is redirected to buyer dashboard

### 2. Buyer Login Process
1. User enters email and password
2. Supabase authenticates the user
3. User profile is loaded from database
4. User is redirected to buyer dashboard

## Key Features

### Automatic Profile Creation
- When a user signs up, triggers automatically create:
  - `user_profiles` record
  - `buyer_users` record (if user_type is 'buyer')

### OTP Verification
- 6-digit OTP codes
- 5-minute expiration
- 3 attempt limit
- Automatic cleanup of expired codes

### Row Level Security (RLS)
- Users can only access their own data
- Secure by default
- No data leakage between users

## Testing the Setup

### 1. Test Buyer Signup
1. Go to `/signup`
2. Select "Buyer"
3. Fill out the form
4. Check email for OTP
5. Verify OTP
6. Should redirect to buyer dashboard

### 2. Test Buyer Login
1. Go to `/login`
2. Enter buyer credentials
3. Should redirect to buyer dashboard

### 3. Test Dashboard Access
1. Login as buyer
2. Navigate to `/buyer/dashboard`
3. Should see buyer dashboard

## Troubleshooting

### Common Issues

1. **OTP not received**
   - Check EmailJS configuration
   - Verify email template
   - Check spam folder

2. **Profile not created**
   - Check Supabase triggers
   - Verify RLS policies
   - Check console for errors

3. **Login redirect issues**
   - Check user.user_type field
   - Verify ProtectedRoute logic
   - Check console logs

### Debug Steps

1. Check browser console for errors
2. Verify Supabase connection
3. Check database logs
4. Test with different email addresses

## Security Features

- Password hashing (handled by Supabase)
- Email verification required
- OTP verification for signup
- Row Level Security policies
- Secure session management
- Automatic token refresh

## Next Steps

After buyer authentication is working:
1. Set up seller authentication
2. Implement KYC verification for sellers
3. Add profile management features
4. Implement password reset
5. Add social login options


























