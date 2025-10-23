# ChiFere Database Scripts

This directory contains utility scripts for managing your Firestore database.

## Available Scripts

### 1. `verify-collections.js`
Checks which collections exist in Firestore and displays their document counts.

**Usage:**
```bash
node scripts/verify-collections.js
```

**Output:**
- ✅ Lists all expected collections with document counts
- ⚠️ Identifies old collections that should be removed
- 📊 Provides summary statistics

---

### 2. `migrate-collections.js`
Migrates data from old collection structure to new naming schema.

**Collections Migrated:**
- `users` → `buyer_users` / `seller_users`
- `orders` → `buyer_orderItem`
- `notifications` → `Notifications`
- `carts` → `buyer_AddToCart`
- `items` → `seller_addItemPreloved` / `seller_addBarterItem`
- `barters` → `buyer_barterOffer`
- `deliveries` → `Delivery`

**Usage:**
```bash
# Dry run (no changes)
node scripts/migrate-collections.js

# Live migration (edit DRY_RUN to false in the file)
node scripts/migrate-collections.js
```

**Features:**
- Batch processing (500 docs per batch)
- Dry-run mode for testing
- Detailed statistics and error handling
- Preserves original data

---

### 3. `delete-old-collections.js`
Removes old collections after successful migration.

**⚠️ WARNING:** This permanently deletes data! Only run after verifying migration success.

**Usage:**
```bash
node scripts/delete-old-collections.js
```

**What it deletes:**
- `users`
- `orders`
- `notifications`
- `carts`
- `items`
- `barters`
- `deliveries`

---

### 4. `seed-database.js`
Populates the database with sample data for testing and development.

**Usage:**
```bash
node scripts/seed-database.js
```

**Sample Data Created:**
- **Buyer Users:** 2 test accounts
  - `buyer1@test.com` / `Test@123`
  - `buyer2@test.com` / `Test@123`
  
- **Seller Users:** 1 test account
  - `seller1@test.com` / `Test@123`

- **Sample Items:** 3 items (jacket, phone, dining table)
- **Notifications:** Welcome messages

**Collections Seeded:**
- `buyer_users`
- `seller_users`
- `seller_addItemPreloved`
- `seller_addBarterItem`
- `Notifications`

---

## Current Collection Structure

### ✅ Active Collections (New Schema)

| Collection | Purpose | Documents |
|------------|---------|-----------|
| `buyer_users` | Buyer profiles | 5 |
| `seller_users` | Seller profiles | 1 |
| `buyer_AddToCart` | Shopping carts | 0 (empty) |
| `buyer_orderItem` | Purchase orders | 6 |
| `seller_addItemPreloved` | Preloved items | 0 (empty) |
| `seller_addBarterItem` | Barter-only items | 0 (empty) |
| `buyer_barterOffer` | Barter offers | 0 (empty) |
| `seller_paymentMethod` | Seller payout methods | 0 (empty) |
| `buyer_paymentMethod` | Buyer payment methods | 0 (empty) |
| `Notifications` | User notifications | 6 |
| `Delivery` | Delivery tracking | 0 (empty) |
| `buyer_profile` | Extended buyer profiles | 0 (empty) |
| `seller_profile` | Extended seller profiles | 0 (empty) |
| `messages` | Chat messages | 0 (empty) |

### ❌ Old Collections (Removed)
- ~~`users`~~ - Deleted ✅
- ~~`orders`~~ - Deleted ✅
- ~~`notifications`~~ - Deleted ✅
- ~~`carts`~~ - Deleted ✅
- ~~`items`~~ - Deleted ✅
- ~~`barters`~~ - Deleted ✅
- ~~`deliveries`~~ - Deleted ✅

---

## Prerequisites

All scripts require:
- **Service Account Key:** `service-account-key.json` in the root directory
- **Firebase Admin SDK:** Already installed via `package.json`
- **Node.js:** Version 22+ with ES modules support

## Security Notes

⚠️ **Important:**
- Never commit `service-account-key.json` to git
- Keep the service account key secure
- Only run deletion scripts after backing up data
- Test migration with dry-run before live execution

## Migration Workflow

Recommended order for migration:

1. **Verify Current State:**
   ```bash
   node scripts/verify-collections.js
   ```

2. **Test Migration (Dry Run):**
   ```bash
   # DRY_RUN = true in migrate-collections.js
   node scripts/migrate-collections.js
   ```

3. **Run Live Migration:**
   ```bash
   # Set DRY_RUN = false in migrate-collections.js
   node scripts/migrate-collections.js
   ```

4. **Verify Migration Success:**
   ```bash
   node scripts/verify-collections.js
   ```

5. **Delete Old Collections:**
   ```bash
   node scripts/delete-old-collections.js
   ```

6. **Seed Test Data (Optional):**
   ```bash
   node scripts/seed-database.js
   ```

---

## Migration Status

✅ **Migration Completed:** October 13, 2025
- 17 documents migrated successfully
- 0 errors
- Old collections removed
- New schema active

---

## Support

For issues or questions about these scripts, refer to:
- `docs/MIGRATION_SUMMARY_2025-10-13.md`
- `docs/PHASE1_MIGRATION_COMPLETE.md`

