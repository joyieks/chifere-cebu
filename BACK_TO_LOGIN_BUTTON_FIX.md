# Back to Login Button Fix

## Issue
The "Back to Login" button in the "Account Pending Review" page was not working properly when clicked.

## Root Cause
The button was using `window.location.href = '/login'` which can sometimes fail or not work as expected in React applications.

## Solution
Updated the button to use React Router's `navigate()` function and added proper logout functionality.

## Changes Made

### 1. **Added React Router Navigation**
- Imported `useNavigate` from 'react-router-dom'
- Added `navigate` hook to the component
- Replaced `window.location.href` with `navigate('/login')`

### 2. **Added Logout Functionality**
- Imported `logout` function from `useAuth()`
- Added proper logout before navigation
- Added error handling for logout failures

### 3. **Enhanced User Experience**
- User is properly logged out when clicking "Back to Login"
- Can login with a different account if needed
- Proper error handling ensures navigation works even if logout fails

## Code Changes

### Before:
```jsx
<button
  onClick={() => window.location.href = '/login'}
  className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition"
>
  Back to Login
</button>
```

### After:
```jsx
<button
  onClick={async () => {
    console.log('🔄 [ProtectedRoute] Logging out and navigating to login');
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('❌ [ProtectedRoute] Logout error:', error);
      navigate('/login');
    }
  }}
  className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition"
>
  Back to Login
</button>
```

## Benefits
- ✅ **Reliable Navigation**: Uses React Router's navigate function
- ✅ **Proper Logout**: User is logged out before going to login page
- ✅ **Error Handling**: Works even if logout fails
- ✅ **Better UX**: User can login with different account
- ✅ **Debug Logging**: Console logs for troubleshooting

## Testing
1. Register as a seller (pending status)
2. Try to access seller dashboard
3. Should see "Account Pending Review" page
4. Click "Back to Login" button
5. Should be logged out and redirected to login page
6. Should be able to login with different account

## Files Modified
- `src/components/ProtectedRoute.jsx` - Fixed the "Back to Login" button functionality

