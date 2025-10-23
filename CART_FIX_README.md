# 🛒 Cart Persistence Fix - Quick Start

## Problem
Cart items were lost after logout because:
- Cart state was cleared on logout ❌
- Database policies might not be correct ❌

## ✅ Solution (2 Steps)

### Step 1: Fix Existing Cart Table (2 minutes)

**Since your `buyer_add_to_cart` table already exists, use this script:**

1. Open **Supabase Dashboard** → **SQL Editor**
2. Open file: `FIX_EXISTING_CART_TABLE.sql` ⭐ (Use this one!)
3. Copy all contents
4. Paste in SQL Editor
5. Click **Run** (or Ctrl+Enter)
6. ✅ Should see "SETUP COMPLETE!"

### Step 2: Test It (2 minutes)

1. Open file: `TEST_CART_DATABASE.sql`
2. Copy all contents
3. Paste in SQL Editor
4. Click **Run**
5. ✅ Check results - all should say "PASS"

---

## 🧪 How to Test the Cart

### Test A: Cart Persists After Logout
```
1. Login as buyer
2. Add products to cart
3. Logout
4. Login again
✅ Cart should have all your items!
```

### Test B: Items Can Be Deleted
```
1. Login as buyer
2. Add 3 items to cart
3. Remove 1 item
4. Logout and login again
✅ The removed item should still be gone
```

### Test C: Guest Cart Merges on Login
```
1. Logout (be a guest)
2. Add 2 items to cart
3. Login as buyer
✅ Guest items + database items = merged cart
```

---

## 📁 Files Created

| File | Purpose | Use This? |
|------|---------|-----------|
| `FIX_EXISTING_CART_TABLE.sql` ⭐ | Fix your existing table | **YES - Run this!** |
| `SETUP_CART_DATABASE.sql` | Create new table (not needed) | No - table exists |
| `TEST_CART_DATABASE.sql` | Verifies setup is correct | Yes - for testing |
| `CART_DATABASE_PERSISTENCE_FIX.md` | Complete documentation | Yes - for reference |
| `CartContext.jsx` (modified) | Fixed logout behavior | Already applied ✅ |

---

## ❓ FAQ

**Q: Do I need to run the SQL every time?**
A: No! Only run it once to set up the database.

**Q: What if I see errors?**
A: Check `CART_DATABASE_PERSISTENCE_FIX.md` → Troubleshooting section

**Q: Will old cart items be lost?**
A: Existing items in database are preserved. New users start with empty cart.

**Q: What about sellers?**
A: Sellers don't have carts (they can't buy). This is buyer-only.

---

## 🎯 What Changed?

### Before:
```javascript
// CartContext.jsx
if (!user && cartSynced) {
  setCart([]); // ❌ Cart cleared on logout!
}
```

### After:
```javascript
// CartContext.jsx
if (!user && cartSynced) {
  // ✅ Cart stays in database!
  // Only load guest cart from localStorage
  const savedCart = localStorage.getItem('chifere_cart');
  setCart(savedCart ? JSON.parse(savedCart) : []);
}
```

---

## ✅ Success Checklist

After setup, verify:
- [ ] SQL ran without errors
- [ ] All tests in `TEST_CART_DATABASE.sql` pass
- [ ] Cart items persist after logout/login
- [ ] Can add items to cart (shows in database)
- [ ] Can remove items from cart
- [ ] No console errors when adding to cart

---

## 🆘 Need Help?

1. Check browser console (F12 → Console)
2. Look for logs starting with `🛒 [CartContext]` or `🛒 [CartService]`
3. Read full docs in `CART_DATABASE_PERSISTENCE_FIX.md`
4. Check Supabase Dashboard → Table Editor → `buyer_add_to_cart`

---

**That's it! Your cart will now persist across sessions.** 🎉
