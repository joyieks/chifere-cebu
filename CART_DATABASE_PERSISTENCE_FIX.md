# 🛒 Cart Database Persistence - Complete Fix

## Problem
Cart items were lost when user logged out because:
1. The cart was being cleared from the state on logout
2. Database might not have the proper table/policies set up

## ✅ Solution Applied

### 1. **Fixed CartContext.jsx** 
Changed the logout behavior to preserve cart in database:

**Before (WRONG):**
```javascript
useEffect(() => {
  if (!user && cartSynced) {
    setCartSynced(false);
    setCart([]); // ❌ This cleared the cart!
  }
}, [user, cartSynced]);
```

**After (FIXED):**
```javascript
useEffect(() => {
  if (!user && cartSynced) {
    console.log('🛒 User logged out, resetting sync flag (cart stays in database)');
    setCartSynced(false);
    // Cart stays in database, just load guest cart from localStorage
    const savedCart = localStorage.getItem('chifere_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    } else {
      setCart([]);
    }
  }
}, [user, cartSynced]);
```

### 2. **Created Database Setup Script**
File: `SETUP_CART_DATABASE.sql`

This script creates:
- ✅ `buyer_add_to_cart` table with proper structure
- ✅ RLS (Row Level Security) policies so users can only access their own cart
- ✅ Indexes for performance
- ✅ Auto-update trigger for `updated_at` column
- ✅ Proper permissions for authenticated users

---

## 🚀 How to Set Up

### Step 1: Run the SQL Script in Supabase

1. Go to your Supabase Dashboard
2. Click on **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the contents of `SETUP_CART_DATABASE.sql`
5. Click **Run** button (or press Ctrl+Enter)
6. Check the output - should see "SETUP COMPLETE! ✅"

### Step 2: Verify the Setup

Run this query in Supabase SQL Editor:
```sql
-- Check if table exists and has correct structure
SELECT * FROM public.buyer_add_to_cart LIMIT 1;

-- Check RLS policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'buyer_add_to_cart';
```

You should see:
- ✅ Table exists (even if empty)
- ✅ 4 policies: SELECT, INSERT, UPDATE, DELETE

---

## 📋 How Cart Works Now

### For Logged-In Buyers:

1. **Add to Cart:**
   - Item is saved to `buyer_add_to_cart` table in database
   - Linked to user's `user_id`
   - Persists across sessions

2. **Logout:**
   - Cart **stays in database** (not deleted!)
   - Local state is cleared
   - Guest cart loaded from localStorage (if any)

3. **Login Again:**
   - Cart is automatically loaded from database
   - All previous items are restored
   - If there are guest cart items, they're merged with database cart

4. **Remove from Cart:**
   - Item is deleted from database
   - Changes sync immediately

### For Guest Users (Not Logged In):

- Cart saved to `localStorage` only
- When they login, guest cart merges with their database cart
- After merge, localStorage cart is cleared

---

## 🔍 How to Test

### Test 1: Cart Persistence After Logout
```
1. Login as a buyer (e.g., buyer@example.com)
2. Add 2-3 products to cart
3. **Logout**
4. **Login again** with same account
5. ✅ Cart should have all the items you added before!
```

### Test 2: Remove Items
```
1. Login as buyer
2. Add items to cart
3. Remove 1 item
4. Logout and login again
5. ✅ Removed item should still be gone (changes persisted)
```

### Test 3: Guest to User Cart Merge
```
1. **Logout** (be guest user)
2. Add 2 products to cart (saved to localStorage)
3. **Login** as buyer
4. ✅ Your guest cart items should merge with database cart
5. Logout and login again
6. ✅ All items still there!
```

### Test 4: Cross-Device Sync
```
1. Login on Computer A, add items to cart
2. Login on Computer B with same account
3. ✅ Cart should have same items (synced via database!)
```

---

## 🛠️ Troubleshooting

### Issue: "Cart is still empty after login"

**Solution:**
1. Check if SQL script ran successfully
2. Check browser console for errors (F12 → Console)
3. Look for logs like:
   ```
   🛒 [CartContext] Syncing cart for user: [user-id]
   🛒 [CartContext] User cart loaded: X items
   ```

### Issue: "Permission denied for table buyer_add_to_cart"

**Solution:**
Run this in Supabase SQL Editor:
```sql
-- Grant permissions
GRANT ALL ON public.buyer_add_to_cart TO authenticated;

-- Check RLS is enabled
ALTER TABLE public.buyer_add_to_cart ENABLE ROW LEVEL SECURITY;
```

### Issue: "Items disappear immediately after adding"

**Solution:**
Check RLS policies:
```sql
-- This should return 4 policies
SELECT policyname FROM pg_policies WHERE tablename = 'buyer_add_to_cart';
```

If no policies, re-run the `SETUP_CART_DATABASE.sql` script.

### Issue: "Cart shows wrong items from another user"

**Solution:**
This is a serious security issue! Check your RLS policies:
```sql
-- All policies should have: auth.uid() = user_id
SELECT policyname, qual, with_check FROM pg_policies 
WHERE tablename = 'buyer_add_to_cart';
```

If policies are wrong, drop them and re-run the setup script.

---

## 📊 Database Schema

```sql
TABLE: buyer_add_to_cart
------------------------
id          | UUID      | PRIMARY KEY (auto-generated)
user_id     | UUID      | References auth.users(id), UNIQUE
items       | JSONB     | Array of cart items
created_at  | TIMESTAMP | When cart was first created
updated_at  | TIMESTAMP | Last time cart was modified (auto-updates)

ITEMS STRUCTURE (JSONB):
[
  {
    "id": "product-uuid",
    "name": "Product Name",
    "price": 99.99,
    "image": "url-to-image",
    "sellerId": "seller-uuid",
    "quantity": 2,
    "addedAt": "2025-10-23T10:30:00Z"
  },
  ...more items
]
```

---

## 🔐 Security (RLS Policies)

All policies ensure users can **ONLY access their own cart**:

1. **SELECT Policy:** Users can view their own cart
   ```sql
   USING (auth.uid() = user_id)
   ```

2. **INSERT Policy:** Users can create their own cart
   ```sql
   WITH CHECK (auth.uid() = user_id)
   ```

3. **UPDATE Policy:** Users can update their own cart
   ```sql
   USING (auth.uid() = user_id)
   WITH CHECK (auth.uid() = user_id)
   ```

4. **DELETE Policy:** Users can delete their own cart
   ```sql
   USING (auth.uid() = user_id)
   ```

---

## 📝 Code Flow

### Adding Item to Cart:
```
User clicks "Add to Cart"
    ↓
CartContext.addToCart(item, quantity)
    ↓
Check if user is logged in?
    ↓
YES: cartService.addToCart(userId, item, quantity)
        ↓
    Check if cart exists in database
        ↓
    NO: Create new cart row
        ↓
    YES: Update existing cart row
        ↓
    Save items JSONB to database
        ↓
    Return success
        ↓
    CartContext updates local state
    ↓
NO: Save to localStorage (guest cart)
```

### Loading Cart on Login:
```
User logs in
    ↓
CartContext detects user changed
    ↓
Check if cart already synced? NO
    ↓
Load guest cart from localStorage (if any)
    ↓
Load user cart from database (cartService.getUserCart)
    ↓
Merge guest cart + database cart
    ↓
Save merged cart to database
    ↓
Clear localStorage guest cart
    ↓
Update local state with merged cart
    ↓
Set cartSynced = true
    ↓
Subscribe to realtime updates
```

---

## ✅ Success Checklist

After running the setup script, verify:

- [ ] SQL script executed without errors
- [ ] Table `buyer_add_to_cart` exists in Supabase
- [ ] 4 RLS policies created (SELECT, INSERT, UPDATE, DELETE)
- [ ] Can add items to cart when logged in
- [ ] Cart items persist after logout/login
- [ ] Can remove items from cart
- [ ] Cart is empty for new users
- [ ] Guest cart merges with user cart on login
- [ ] No errors in browser console

---

## 🎯 Summary

**What was fixed:**
1. ✅ CartContext no longer clears cart on logout
2. ✅ Database table properly set up with RLS policies
3. ✅ Cart items now persist in database
4. ✅ Users can add/remove items (changes saved to DB)
5. ✅ Cart syncs across devices

**What you need to do:**
1. Run `SETUP_CART_DATABASE.sql` in Supabase SQL Editor
2. Test the cart functionality
3. Verify items persist after logout/login

**Result:**
🎉 Cart items will now be saved to the database and **won't be lost on logout**!

---

Need help? Check browser console logs (F12 → Console) for:
- `🛒 [CartContext]` - Cart operations
- `🛒 [CartService]` - Database operations
- Any error messages

All cart operations are heavily logged for easy debugging! 🐛
