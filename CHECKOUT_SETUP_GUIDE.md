# 🛒 Checkout Database Setup Guide

## Overview
This guide will help you set up the enhanced checkout database schema safely without foreign key constraint errors.

## 📋 Prerequisites
- PostgreSQL database running
- Access to your ChiFere database
- `buyer_users` table should exist (from your existing setup)

## 🚀 Setup Steps

### Step 1: Run the Main Database Enhancement
```sql
-- Run the main database schema enhancement
\i CHECKOUT_DATABASE_ENHANCEMENT.sql
```

This will create:
- `buyer_addresses` table
- `buyer_orders` table  
- `order_items` table
- `payment_transactions` table
- `delivery_tracking` table
- All necessary indexes, functions, and triggers
- RLS policies

### Step 2: Run Sample Data (Optional)
```sql
-- Run sample data insertion (only if you want test data)
\i CHECKOUT_SAMPLE_DATA.sql
```

This will safely insert:
- Sample buyer user (if none exists)
- Sample addresses
- Sample orders
- Verification summary

## 🔧 Alternative: Manual Setup

If you prefer to set up manually or encounter issues:

### 1. Check Existing Tables
```sql
-- Check if buyer_users table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'buyer_users';
```

### 2. Create Sample User (if needed)
```sql
-- Only run if you don't have any buyer users
INSERT INTO buyer_users (id, email, display_name, first_name, last_name, user_type, phone, is_verified, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'test@example.com', 'Test User', 'Test', 'User', 'buyer', '(+63) 9123456789', TRUE, TRUE);
```

### 3. Run Main Schema
```sql
-- Run the main enhancement script
\i CHECKOUT_DATABASE_ENHANCEMENT.sql
```

### 4. Verify Setup
```sql
-- Check if all tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('buyer_addresses', 'buyer_orders', 'order_items', 'payment_transactions', 'delivery_tracking');
```

## 🐛 Troubleshooting

### Foreign Key Constraint Error
If you get the error:
```
ERROR: 23503: insert or update on table "buyer_addresses" violates foreign key constraint
```

**Solution:**
1. Make sure `buyer_users` table exists
2. Make sure you have at least one buyer user
3. Run the sample data script which handles this safely

### Seller Users Table Missing Error
If you get the error:
```
ERROR: 42P01: relation "seller_users" does not exist
```

**Solution:**
1. This is normal if you don't have a seller_users table yet
2. The script now handles this automatically
3. Views will be created with "Unknown Seller" as fallback
4. You can add seller_users table later if needed

### Check Your Database Tables
Run this to see what tables you have:
```sql
\i CHECK_DATABASE_TABLES.sql
```

### Table Already Exists Error
If you get table already exists errors:
```sql
-- Drop tables if you want to recreate them
DROP TABLE IF EXISTS delivery_tracking CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS buyer_orders CASCADE;
DROP TABLE IF EXISTS buyer_addresses CASCADE;
```

### Permission Errors
Make sure your database user has:
- CREATE TABLE permissions
- CREATE FUNCTION permissions
- CREATE TRIGGER permissions
- INSERT permissions

## ✅ Verification

After setup, verify everything works:

```sql
-- Check table structure
\d buyer_addresses
\d buyer_orders

-- Check sample data (if you ran the sample data script)
SELECT COUNT(*) as address_count FROM buyer_addresses;
SELECT COUNT(*) as order_count FROM buyer_orders;

-- Test the order number generation function
SELECT generate_order_number();
```

## 🔄 Next Steps

After database setup:
1. Update your frontend to use the new `EnhancedCheckout` component
2. Import the new services (`addressService`, enhanced `paymentService`)
3. Test the checkout flow with real data
4. Configure your payment gateway integration

## 📞 Support

If you encounter any issues:
1. Check the PostgreSQL logs for detailed error messages
2. Verify all prerequisites are met
3. Run the verification queries above
4. Check that all foreign key references are valid

The enhanced checkout system is now ready to provide a professional shopping experience for your ChiFere marketplace!
