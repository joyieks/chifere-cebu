# 🔧 DATABASE SETUP - QUICK GUIDE

## ⚡ IMMEDIATE FIX (Do this first!)

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard
2. Select your **ChiFere** project
3. Click **SQL Editor** in the left sidebar

### Step 2: Run Quick Fix
1. Open the file: **`QUICK_FIX_CART.sql`**
2. Copy ALL the code
3. Paste into Supabase SQL Editor
4. Click **RUN** (or Ctrl+Enter)
5. Wait for "Success" message

### Step 3: Test
1. Refresh your browser (F5)
2. The cart errors should be GONE! ✅

---

## 📦 COMPLETE SETUP (Optional - for full features)

If you want checkout, orders, and payment features:

### Run This File:
**`SETUP_MISSING_TABLES.sql`**

This creates:
- ✅ buyer_addresses
- ✅ buyer_orders
- ✅ order_items  
- ✅ payment_transactions
- ✅ delivery_tracking

### How to Run:
1. Open **SETUP_MISSING_TABLES.sql**
2. Copy ALL the code
3. Paste into Supabase SQL Editor
4. Click **RUN**
5. Check for success messages

---

## 🎯 What Each File Does

| File | Purpose | When to Use |
|------|---------|-------------|
| **QUICK_FIX_CART.sql** | Fixes cart errors IMMEDIATELY | Run this NOW |
| **SETUP_MISSING_TABLES.sql** | Complete database setup | Run for full features |

---

## ✅ Verification

After running the scripts, verify in Supabase:

1. Go to **Table Editor**
2. You should see these tables:
   - `buyer_addresses` ✓
   - `buyer_add_to_cart` ✓
   - `buyer_orders` ✓
   - `order_items` ✓
   - `payment_transactions` ✓
   - `delivery_tracking` ✓

---

## 🆘 Troubleshooting

### Error: "relation buyer_users does not exist"
**Solution:** Run `docs/BUYER_SETUP.sql` first

### Error: "extension uuid-ossp does not exist"
**Solution:** The script creates it automatically

### Still seeing errors?
1. Check Supabase project is active
2. Verify you're logged into correct project
3. Clear browser cache and refresh

---

## 🎉 Done!

After running **QUICK_FIX_CART.sql**, your app should work immediately!

Refresh your browser and test the cart functionality.
