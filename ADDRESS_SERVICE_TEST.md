# 🧪 Address Service Test Guide

## Issue Fixed
The address service was missing the correct method names that the components were expecting. I've fixed the following issues:

### ✅ **Fixed Issues:**
1. **Method Name Mismatch** - Components were calling `getAddresses()` but service had `getUserAddresses()`
2. **Method Name Mismatch** - Components were calling `addAddress()` but service had `createAddress()`
3. **Method Name Mismatch** - Components were calling `updateAddress()` but service had different signature
4. **Method Name Mismatch** - Components were calling `deleteAddress()` but service had different signature
5. **Field Name Mismatch** - Form fields were using `name`/`phone` but service expected `recipient_name`/`phone_number`

### 🔧 **Changes Made:**

1. **Updated addressService.js:**
   - Renamed `getUserAddresses()` → `getAddresses()`
   - Renamed `createAddress()` → `addAddress()`
   - Added `updateAddressById()` for component compatibility
   - Added `deleteAddressById()` for component compatibility
   - Added role parameter support

2. **Updated Address.jsx:**
   - Fixed method calls to use correct names
   - Updated form fields to use correct field names
   - Fixed state initialization

3. **Updated AddressSelectionModal.jsx:**
   - Fixed method calls to use correct names
   - Updated form fields to use correct field names
   - Fixed state initialization

## 🧪 **How to Test:**

### **Test 1: My Account Address Management**
1. Go to My Account → Address
2. Click "Add New Address"
3. Fill out the form:
   - Address Type: Home
   - Full Name: Joan Joy Diocampo
   - Phone Number: +63 912 345 6789
   - Street Address: 123 Main Street
   - Barangay: Lahug
   - City: Cebu City
   - Province: Cebu
   - ZIP Code: 6000
   - Check "Set as default address"
4. Click "Add Address"
5. ✅ Should successfully add the address

### **Test 2: Checkout Address Selection**
1. Go to checkout page
2. Click on the delivery address section
3. Modal should open showing saved addresses
4. Click "Add New Address" in the modal
5. Fill out the form and click "Add Address"
6. ✅ Should successfully add and select the address

### **Test 3: Address Operations**
1. In My Account → Address:
   - ✅ Edit existing address
   - ✅ Delete address
   - ✅ Set default address
2. In Checkout:
   - ✅ Select different address
   - ✅ Add new address from modal

## 🔍 **What to Look For:**

### ✅ **Success Indicators:**
- No console errors about "is not a function"
- Addresses save successfully
- Addresses load in both My Account and checkout
- Modal opens and closes properly
- Form validation works
- Default address selection works

### ❌ **Error Indicators:**
- Console errors about missing methods
- Form submission fails
- Addresses don't save
- Modal doesn't open
- Addresses don't load

## 🚀 **Expected Behavior:**

1. **My Account Address Page:**
   - Loads existing addresses
   - Add new address works
   - Edit address works
   - Delete address works
   - Set default works

2. **Checkout Address Selection:**
   - Shows saved addresses
   - Click to select address
   - Add new address works
   - Selected address appears in checkout

3. **Data Synchronization:**
   - Changes in My Account reflect in checkout
   - Default address loads automatically
   - All operations work consistently

The address service should now work properly! Try adding an address and let me know if you encounter any issues.



