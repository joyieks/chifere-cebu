# Seller Logout Fix

## Issue
The logout button in the seller PendingApproval component was not redirecting to the landing page after logout. The logout function was working (clearing session data), but the navigation wasn't happening.

## Root Cause
The `handleLogout` function in `PendingApproval.jsx` was calling `logout()` and showing a success toast, but it wasn't navigating to the landing page after logout completion.

## Solution
Updated the seller logout handler to properly navigate to the landing page after successful logout.

## Changes Made

### **PendingApproval.jsx**
- Added `useNavigate` import from 'react-router-dom'
- Added `navigate` hook to the component
- Updated `handleLogout` to navigate to landing page (`/`) after logout
- Added proper error handling with console logging

## Code Changes

### Before:
```jsx
const handleLogout = async () => {
  try {
    await logout();
    showToast('Logged out successfully', 'success');
  } catch (error) {
    showToast('Error logging out', 'error');
  }
};
```

### After:
```jsx
const handleLogout = async () => {
  try {
    await logout();
    showToast('Logged out successfully', 'success');
    navigate('/');
  } catch (error) {
    console.error('Logout error:', error);
    showToast('Logout failed. Please try again.', 'error');
  }
};
```

## Benefits
- ✅ **Proper Navigation**: Seller logout now redirects to landing page
- ✅ **Consistent Behavior**: Matches logout behavior in other components
- ✅ **Better Error Handling**: Console logging for debugging
- ✅ **Improved UX**: User is properly redirected after logout

## Testing
1. Login as a seller with pending status
2. Should see the PendingApproval page
3. Click the "Logout" button
4. Should see "Logged out successfully" toast
5. Should be redirected to landing page (`/`)
6. Should not be able to access seller routes

## Files Modified
- `src/components/pages/Seller/PendingApproval.jsx` - Fixed seller logout navigation

## Notes
The seller logout now properly navigates to the landing page after logout, ensuring consistent behavior across all user types (admin, buyer, seller).


