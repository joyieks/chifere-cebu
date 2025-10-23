# Admin Login Fix Guide

## Problem
Admin login is showing "Invalid credentials" error even with correct credentials.

## Root Cause
1. Row Level Security (RLS) policies were blocking access to `admin_users` table
2. Password hashing might not match between database and client
3. RPC functions need proper SECURITY DEFINER settings

## Solution

### Step 1: Run the Fixed SQL Script

Execute the `FIXED_ADMIN_LOGIN.sql` file in your Supabase SQL Editor:

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Create a new query
4. Copy and paste the entire content from `FIXED_ADMIN_LOGIN.sql`
5. Click "Run" to execute

### Step 2: What the Script Does

The script:
- Removes overly restrictive RLS policies
- Creates permissive policies that allow login operations
- Fixes password hashing to match client-side implementation
- Recreates the admin user with correct password hash
- Adds debugging functions to test password hashing
- Grants proper permissions to anonymous and authenticated users

### Step 3: Verify the Fix

After running the script, check the output:
- It should show a test of the password hash
- Verify that `hashes_match` is `true`
- Confirm admin user exists with email `admin@gmail.com`

### Step 4: Test Login

1. Start your development server: `npm run dev`
2. Navigate to `/admin/login`
3. Enter credentials:
   - Email: `admin@gmail.com`
   - Password: `admin123`
4. Check browser console for debug logs
5. You should see:
   - Admin exists check
   - Password test result showing hashes match
   - Successful login result

## Debug Information

The updated code now includes:
- `debugAdminExists()` - Checks if admin user exists in database
- `testPassword()` - Tests if password hash matches
- Enhanced console logging throughout login process

### If Still Not Working

1. **Check Browser Console**
   - Look for error messages
   - Check the output of `debugAdminExists()` and `testPassword()`

2. **Verify Database Setup**
   ```sql
   -- Run this in Supabase SQL Editor
   SELECT * FROM test_admin_password('admin@gmail.com', 'admin123');
   ```
   
   Should return:
   - `email_exists`: true
   - `hashes_match`: true

3. **Check RLS Policies**
   ```sql
   -- Run this in Supabase SQL Editor
   SELECT tablename, policyname, cmd, qual 
   FROM pg_policies 
   WHERE tablename IN ('admin_users', 'admin_sessions');
   ```

4. **Verify Supabase Connection**
   - Check that your `.env` file has correct Supabase URL and Key
   - Ensure `src/config/supabase.js` is properly configured

## Key Changes Made

### 1. RLS Policies (FIXED_ADMIN_LOGIN.sql)
- Changed from restrictive session-based policies to permissive policies
- Now allows reading admin_users for login purposes
- Allows creating sessions without requiring existing session

### 2. Password Hashing (FIXED_ADMIN_LOGIN.sql)
```sql
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode((password || 'chifere_salt_2024')::bytea, 'base64');
END;
$$ LANGUAGE plpgsql;
```

### 3. Client-Side (adminService.js)
```javascript
hashPassword(password) {
    return btoa(password + 'chifere_salt_2024');
}
```
Both now use the same algorithm!

### 4. Function Permissions
Added `SECURITY DEFINER` to allow functions to bypass RLS when needed:
```sql
CREATE OR REPLACE FUNCTION admin_login(...)
RETURNS TABLE(...) AS $$
...
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Security Notes

⚠️ **Important for Production:**
1. This setup is for development/demo purposes
2. In production, use proper password hashing (bcrypt, argon2)
3. Add rate limiting to prevent brute force attacks
4. Use proper session management with httpOnly cookies
5. Implement IP-based access restrictions
6. Add 2FA for admin accounts
7. Regular security audits

## Default Admin Credentials

After running the fix script:
- **Email:** admin@gmail.com
- **Password:** admin123

Change these immediately in production!

## Troubleshooting

### Error: "relation admin_users does not exist"
Run the complete admin setup first from `COMPLETE_ADMIN_SETUP.sql`

### Error: "permission denied for function"
Re-run the GRANT statements from the fix script

### Error: "function does not exist"
The RPC functions weren't created. Run the complete fix script

### Password test shows "hashes don't match"
The password hash in database doesn't match the algorithm. Run the fix script to recreate the admin user.

## Testing Checklist

- [ ] SQL script executed without errors
- [ ] `test_admin_password()` returns `hashes_match: true`
- [ ] Admin user visible in `admin_users` table
- [ ] Browser console shows debug logs
- [ ] Login succeeds with correct credentials
- [ ] Session token stored in localStorage
- [ ] Redirect to admin dashboard works
- [ ] Logout clears session properly

## Next Steps After Fix

1. Test all admin functions (approve sellers, view stats, etc.)
2. Remove debug logging before production
3. Implement proper password hashing
4. Add admin registration workflow
5. Set up admin role permissions
6. Add audit logging for admin actions
