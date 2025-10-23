# Fix Database Errors - Quick Guide

## Problem
The application is showing errors about missing database tables:
- `buyer_addresses` - table does not exist
- `buyer_add_to_cart` - table does not exist

## Solution

### Step 1: Open Supabase Dashboard
1. Go to your Supabase project: https://supabase.com/dashboard
2. Select your ChiFere project
3. Click on "SQL Editor" in the left sidebar

### Step 2: Run the Setup Script
1. Open the file: `SETUP_MISSING_TABLES.sql`
2. Copy ALL the contents of this file
3. Paste it into the Supabase SQL Editor
4. Click "Run" button (or press Ctrl+Enter)

### Step 3: Verify Tables Were Created
The script will automatically verify that all tables were created. Look for:
```
✓ buyer_addresses table exists
✓ buyer_orders table exists
✓ order_items table exists
✓ payment_transactions table exists
✓ delivery_tracking table exists
```

### Step 4: Refresh Your Application
After running the SQL script:
1. Refresh your browser (F5 or Ctrl+R)
2. The errors should be gone!

## Tables Created
The script creates these essential tables:
1. **buyer_addresses** - Store user delivery addresses
2. **buyer_orders** - Track all orders
3. **order_items** - Individual items in orders
4. **payment_transactions** - Payment records
5. **delivery_tracking** - Track delivery status

## Security
The script also sets up:
- Row Level Security (RLS) policies
- Proper user permissions
- Indexes for fast queries
- Auto-update timestamps

## Need Help?
If you encounter any errors:
1. Make sure `buyer_users` table exists first
2. Check that UUID extension is enabled
3. Run the `docs/BUYER_SETUP.sql` first if needed

---
✅ After running this script, your cart and checkout features will work properly!
