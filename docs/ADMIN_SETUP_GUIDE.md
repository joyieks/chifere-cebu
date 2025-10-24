# ChiFere Admin Setup Guide

This guide will help you set up the secure admin authentication system for ChiFere using Supabase instead of hardcoded credentials.

## 🚀 Quick Setup

### 1. Run the SQL Script

1. **Open your Supabase Dashboard**
2. **Go to SQL Editor**
3. **Copy and paste** the contents of `ADMIN_SETUP.sql`
4. **Click "Run"** to execute the script

### 2. Verify Setup

After running the SQL script, you should see these new tables in your Supabase database:
- `admin_users` - Stores admin account information
- `admin_sessions` - Manages admin login sessions
- `admin_activities` - Logs admin actions for audit

## 🔐 Default Admin Accounts

The script creates these default admin accounts:

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| `admin@gmail.com` | `admin123` | super_admin | Main administrator |
| `moderator@chifere.com` | `moderator123` | admin | Content moderator |
| `support@chifere.com` | `support123` | admin | Customer support |

## 🛡️ Security Features

### Password Hashing
- Passwords are hashed using SHA-256 with salt
- **Note**: For production, consider using bcrypt or Argon2

### Session Management
- Session tokens are generated securely
- Sessions expire after 24 hours
- Automatic cleanup of expired sessions

### Row Level Security (RLS)
- All admin tables have RLS enabled
- Admins can only access their own data
- Secure function-based access control

### Audit Logging
- All admin actions are logged
- Includes IP address and user agent
- 90-day retention policy

## 🔧 Admin Functions

### Core Functions
- `admin_login(email, password)` - Authenticate admin
- `create_admin_session(email, token)` - Create secure session
- `validate_admin_session(token)` - Validate current session
- `approve_seller(seller_id, admin_id)` - Approve seller registration
- `decline_seller(seller_id, admin_id, reason)` - Decline seller registration

### Utility Functions
- `get_pending_sellers()` - Get all pending seller applications
- `log_admin_activity(...)` - Log admin actions
- `cleanup_admin_data()` - Clean expired sessions and old logs

## 📊 Dashboard Features

### Statistics View
- Total buyers and sellers count
- Pending seller approvals
- Recent activity metrics
- Revenue tracking

### Seller Management
- View pending seller applications
- Approve/decline sellers with ID verification
- Track seller performance
- Audit trail for all actions

### Buyer Management
- Complete buyer directory
- Purchase history tracking
- Registration analytics

## 🚨 Important Security Notes

### 1. Change Default Passwords
```sql
-- Update admin password
UPDATE admin_users 
SET password_hash = hash_password('your_new_password')
WHERE email = 'admin@gmail.com';
```

### 2. Add Your Own Admin Accounts
```sql
-- Create new admin
INSERT INTO admin_users (email, password_hash, first_name, last_name, role)
VALUES (
    'your_email@domain.com',
    hash_password('secure_password'),
    'Your',
    'Name',
    'admin'
);
```

### 3. Regular Maintenance
- Run `cleanup_admin_data()` periodically
- Monitor `admin_activities` for suspicious behavior
- Rotate session tokens regularly

## 🔄 Migration from Hardcoded System

The new system automatically replaces the hardcoded admin credentials:

1. **Old System**: Hardcoded `admin@gmail.com` / `admin123`
2. **New System**: Database-stored credentials with proper hashing
3. **Backward Compatibility**: Same login credentials work seamlessly

## 🐛 Troubleshooting

### Common Issues

**1. "Invalid credentials" error**
- Check if admin account exists in `admin_users` table
- Verify password is correct
- Ensure account is active (`is_active = true`)

**2. Session validation fails**
- Check if session token exists in `admin_sessions`
- Verify session hasn't expired
- Clear localStorage and try again

**3. Permission denied errors**
- Check RLS policies are properly set
- Verify admin role has necessary permissions
- Check function permissions

### Debug Queries

```sql
-- Check admin users
SELECT * FROM admin_users WHERE is_active = true;

-- Check active sessions
SELECT * FROM admin_sessions WHERE expires_at > NOW();

-- Check recent activities
SELECT * FROM admin_activities ORDER BY created_at DESC LIMIT 10;
```

## 📈 Performance Optimization

### Indexes
The script creates optimized indexes for:
- Email lookups
- Session token validation
- Activity logging queries
- Dashboard statistics

### Cleanup Schedule
Set up a cron job to run `cleanup_admin_data()` daily:
```sql
-- Run this daily to clean expired data
SELECT cleanup_admin_data();
```

## 🔐 Production Recommendations

### 1. Enhanced Security
- Use bcrypt for password hashing
- Implement 2FA for admin accounts
- Add IP whitelisting
- Enable SSL/TLS

### 2. Monitoring
- Set up alerts for failed login attempts
- Monitor admin activity patterns
- Regular security audits

### 3. Backup
- Regular database backups
- Export admin configurations
- Document admin procedures

## ✅ Verification Checklist

After setup, verify these features work:

- [ ] Admin login with database credentials
- [ ] Session management and validation
- [ ] Seller approval/decline functionality
- [ ] Dashboard statistics loading
- [ ] Activity logging
- [ ] Logout and session cleanup
- [ ] RLS policies working correctly

## 🆘 Support

If you encounter issues:

1. Check the browser console for errors
2. Verify Supabase connection and permissions
3. Check the `admin_activities` table for error logs
4. Ensure all SQL functions were created successfully

---

**Your ChiFere admin system is now secure and database-driven!** 🎉

This guide will help you set up the secure admin authentication system for ChiFere using Supabase instead of hardcoded credentials.

## 🚀 Quick Setup

### 1. Run the SQL Script

1. **Open your Supabase Dashboard**
2. **Go to SQL Editor**
3. **Copy and paste** the contents of `ADMIN_SETUP.sql`
4. **Click "Run"** to execute the script

### 2. Verify Setup

After running the SQL script, you should see these new tables in your Supabase database:
- `admin_users` - Stores admin account information
- `admin_sessions` - Manages admin login sessions
- `admin_activities` - Logs admin actions for audit

## 🔐 Default Admin Accounts

The script creates these default admin accounts:

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| `admin@gmail.com` | `admin123` | super_admin | Main administrator |
| `moderator@chifere.com` | `moderator123` | admin | Content moderator |
| `support@chifere.com` | `support123` | admin | Customer support |

## 🛡️ Security Features

### Password Hashing
- Passwords are hashed using SHA-256 with salt
- **Note**: For production, consider using bcrypt or Argon2

### Session Management
- Session tokens are generated securely
- Sessions expire after 24 hours
- Automatic cleanup of expired sessions

### Row Level Security (RLS)
- All admin tables have RLS enabled
- Admins can only access their own data
- Secure function-based access control

### Audit Logging
- All admin actions are logged
- Includes IP address and user agent
- 90-day retention policy

## 🔧 Admin Functions

### Core Functions
- `admin_login(email, password)` - Authenticate admin
- `create_admin_session(email, token)` - Create secure session
- `validate_admin_session(token)` - Validate current session
- `approve_seller(seller_id, admin_id)` - Approve seller registration
- `decline_seller(seller_id, admin_id, reason)` - Decline seller registration

### Utility Functions
- `get_pending_sellers()` - Get all pending seller applications
- `log_admin_activity(...)` - Log admin actions
- `cleanup_admin_data()` - Clean expired sessions and old logs

## 📊 Dashboard Features

### Statistics View
- Total buyers and sellers count
- Pending seller approvals
- Recent activity metrics
- Revenue tracking

### Seller Management
- View pending seller applications
- Approve/decline sellers with ID verification
- Track seller performance
- Audit trail for all actions

### Buyer Management
- Complete buyer directory
- Purchase history tracking
- Registration analytics

## 🚨 Important Security Notes

### 1. Change Default Passwords
```sql
-- Update admin password
UPDATE admin_users 
SET password_hash = hash_password('your_new_password')
WHERE email = 'admin@gmail.com';
```

### 2. Add Your Own Admin Accounts
```sql
-- Create new admin
INSERT INTO admin_users (email, password_hash, first_name, last_name, role)
VALUES (
    'your_email@domain.com',
    hash_password('secure_password'),
    'Your',
    'Name',
    'admin'
);
```

### 3. Regular Maintenance
- Run `cleanup_admin_data()` periodically
- Monitor `admin_activities` for suspicious behavior
- Rotate session tokens regularly

## 🔄 Migration from Hardcoded System

The new system automatically replaces the hardcoded admin credentials:

1. **Old System**: Hardcoded `admin@gmail.com` / `admin123`
2. **New System**: Database-stored credentials with proper hashing
3. **Backward Compatibility**: Same login credentials work seamlessly

## 🐛 Troubleshooting

### Common Issues

**1. "Invalid credentials" error**
- Check if admin account exists in `admin_users` table
- Verify password is correct
- Ensure account is active (`is_active = true`)

**2. Session validation fails**
- Check if session token exists in `admin_sessions`
- Verify session hasn't expired
- Clear localStorage and try again

**3. Permission denied errors**
- Check RLS policies are properly set
- Verify admin role has necessary permissions
- Check function permissions

### Debug Queries

```sql
-- Check admin users
SELECT * FROM admin_users WHERE is_active = true;

-- Check active sessions
SELECT * FROM admin_sessions WHERE expires_at > NOW();

-- Check recent activities
SELECT * FROM admin_activities ORDER BY created_at DESC LIMIT 10;
```

## 📈 Performance Optimization

### Indexes
The script creates optimized indexes for:
- Email lookups
- Session token validation
- Activity logging queries
- Dashboard statistics

### Cleanup Schedule
Set up a cron job to run `cleanup_admin_data()` daily:
```sql
-- Run this daily to clean expired data
SELECT cleanup_admin_data();
```

## 🔐 Production Recommendations

### 1. Enhanced Security
- Use bcrypt for password hashing
- Implement 2FA for admin accounts
- Add IP whitelisting
- Enable SSL/TLS

### 2. Monitoring
- Set up alerts for failed login attempts
- Monitor admin activity patterns
- Regular security audits

### 3. Backup
- Regular database backups
- Export admin configurations
- Document admin procedures

## ✅ Verification Checklist

After setup, verify these features work:

- [ ] Admin login with database credentials
- [ ] Session management and validation
- [ ] Seller approval/decline functionality
- [ ] Dashboard statistics loading
- [ ] Activity logging
- [ ] Logout and session cleanup
- [ ] RLS policies working correctly

## 🆘 Support

If you encounter issues:

1. Check the browser console for errors
2. Verify Supabase connection and permissions
3. Check the `admin_activities` table for error logs
4. Ensure all SQL functions were created successfully

---

**Your ChiFere admin system is now secure and database-driven!** 🎉


























