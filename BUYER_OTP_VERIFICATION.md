# Buyer OTP Email Verification

## Overview
Added OTP email verification for buyer registration. Now the buyer signup flow is:

1. **Fill up form** (registration)
2. **Verify OTP code** (email verification) 
3. **Login again** (redirect to login page)

## Flow Changes

### **Before:**
- Buyer registration → Direct success → Login button

### **After:**
- Buyer registration → OTP sent to email → OTP verification → Success → Login Again button

## Implementation Details

### **New States Added:**
```jsx
const [otpSent, setOtpSent] = useState(false); // Track if OTP has been sent
const [showOtpModal, setShowOtpModal] = useState(false); // Show OTP modal
```

### **Form Data Updated:**
```jsx
// OTP Verification
code: '',
```

### **Form Submission Logic:**
```jsx
if (userType === 'buyer') {
  // For buyers, send OTP and show verification step
  console.log('📧 [Signup] Sending OTP to buyer email:', formData.email);
  showToast('Registration successful! Please check your email for the verification code.', 'success');
  
  // Send OTP
  const otpResult = await otpService.sendOTP(formData.email, 'email_verification');
  if (otpResult.success) {
    console.log('✅ [Signup] OTP sent successfully');
    setOtpSent(true);
    setShowOtpModal(true);
    setStep(3); // Go to OTP verification step
  } else {
    console.error('❌ [Signup] Failed to send OTP:', otpResult.error);
    showToast('Registration successful, but failed to send verification code. Please contact support.', 'warning');
    setStep(4); // Go to success step anyway
  }
} else {
  // For sellers, go directly to success step (pending admin approval)
  console.log('✅ [Signup] Seller registration successful, going to success step');
  setStep(4);
  showToast('Registration successful! Your account is pending admin approval.', 'success');
}
```

## New Step 3: OTP Verification

### **Features:**
- ✅ **Email Display**: Shows the email where OTP was sent
- ✅ **6-digit Code Input**: Centered, large text, tracking-widest
- ✅ **Verify Button**: Disabled until 6 digits entered
- ✅ **Resend Code**: Button to resend OTP if needed
- ✅ **Back Button**: Returns to registration form
- ✅ **Loading States**: Shows spinner during verification
- ✅ **Error Handling**: Shows error messages for invalid codes

### **UI Elements:**
```jsx
<h1 className="text-3xl font-bold text-gray-900 mb-4">Verify Your Email</h1>
<p className="text-gray-600 mb-6 text-center">
  We've sent a verification code to <strong>{formData.email}</strong>. 
  Please enter the code below to complete your registration.
</p>

<input
  type="text"
  name="code"
  value={formData.code}
  onChange={handleInputChange}
  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
  placeholder="Enter 6-digit code"
  maxLength="6"
  required
/>
```

## Updated Success Step (Step 4)

### **Buyer Success:**
```jsx
<h1 className="text-3xl font-bold text-gray-900 mb-4">Email Verified!</h1>
<p className="text-gray-600 mb-8 text-center">
  Your buyer account has been successfully created and verified. You can now login to start shopping!
</p>
<button
  className="w-full py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
  onClick={() => navigate('/login')}
>
  Login Again
</button>
```

### **Seller Success (Unchanged):**
- Still goes directly to "Pending Review" without OTP
- Shows admin approval message

## User Experience

### **Buyer Registration Flow:**
1. **Step 1**: Choose "Buyer" account type
2. **Step 2**: Fill registration form (name, email, password, etc.)
3. **Step 3**: Verify email with 6-digit OTP code
4. **Step 4**: Success message with "Login Again" button

### **Seller Registration Flow (Unchanged):**
1. **Step 1**: Choose "Seller" account type  
2. **Step 2**: Fill registration form + upload ID documents
3. **Step 4**: Pending admin approval message

## Error Handling

### **OTP Sending Failures:**
- Shows warning toast: "Registration successful, but failed to send verification code. Please contact support."
- Still proceeds to success step

### **OTP Verification Failures:**
- Shows error toast: "Invalid verification code. Please try again."
- Stays on OTP verification step
- User can try again or resend code

### **Network Errors:**
- Shows generic error: "An error occurred during verification. Please try again."
- Allows retry

## Console Logging

### **Registration:**
- `📝 [Signup] Form submitted`
- `✅ [Signup] Registration successful`
- `📧 [Signup] Sending OTP to buyer email: user@example.com`
- `✅ [Signup] OTP sent successfully`

### **Verification:**
- `🔐 [Signup] OTP verification submitted`
- `✅ [Signup] OTP verification successful`
- `🔄 [Signup] Resending OTP to: user@example.com`

## Files Modified
- `src/components/pages/Authentication/signup.jsx` - Added OTP verification step for buyers

## Dependencies
- `otpService.js` - For sending and verifying OTP codes
- `emailService.js` - For sending emails via EmailJS

## Testing
1. **Register as buyer** with valid email
2. **Check email** for 6-digit verification code
3. **Enter code** in verification form
4. **Verify success** message appears
5. **Click "Login Again"** to go to login page
6. **Login with credentials** to access buyer dashboard

## Notes
- **Sellers still bypass OTP** and go directly to admin approval
- **Buyers must verify email** before account is fully activated
- **OTP codes expire** based on `otpService` configuration
- **Resend functionality** available if code not received
- **Back navigation** allows returning to registration form

