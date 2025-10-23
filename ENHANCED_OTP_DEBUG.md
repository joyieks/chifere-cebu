# Enhanced OTP Debug Logging

## Problem
User receives OTP email but the OTP verification popup doesn't appear. The debug logs show that the OTP is being sent, but the step is not being set to 3.

## Enhanced Debug Changes
Added comprehensive debug logging to both the Signup component and OTP service to trace the entire flow.

## Changes Made

### **1. Enhanced Signup Component Debug Logging:**
```jsx
// Send OTP
const otpResult = await otpService.generateAndSendOTP(formData.email, 'buyer', 'email_verification', formData.firstName);
console.log('🔍 [Signup] OTP result:', otpResult);
if (otpResult.success) {
  console.log('✅ [Signup] OTP sent successfully');
  console.log('🔍 [Signup] Setting step to 3 for OTP verification');
  setLoading(false); // Set loading false first
  setOtpSent(true);
  setShowOtpModal(true);
  setStep(3); // Go to OTP verification step
  console.log('🔍 [Signup] Step should now be 3, userType:', userType);
} else {
  console.error('❌ [Signup] Failed to send OTP:', otpResult.error);
  console.log('🔍 [Signup] OTP failed, going to success step instead');
  showToast('Registration successful, but failed to send verification code. Please contact support.', 'warning');
  setLoading(false);
  setStep(4); // Go to success step anyway
}
```

### **2. Enhanced OTP Service Debug Logging:**
```jsx
async generateAndSendOTP(email, userType = 'buyer', purpose = 'verification', firstName = null) {
  try {
    console.log('🔍 [OTPService] generateAndSendOTP called with:', { email, userType, purpose, firstName });
    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔍 [OTPService] Generated OTP code:', otpCode);
    
    // Set expiration time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    console.log('🔍 [OTPService] OTP expires at:', expiresAt);
    
    // Store OTP in Supabase
    const { data, error } = await supabase.from('otp_verifications').insert([...]);
    
    if (error) {
      console.error('❌ [OTPService] Error storing OTP in Supabase:', error);
      return { success: false, error: 'Failed to generate OTP' };
    }
    console.log('✅ [OTPService] OTP stored in Supabase successfully');
    
    // Send OTP via email
    console.log('🔍 [OTPService] Sending OTP via email...');
    const emailResult = await emailService.sendOTPVerification(email, otpCode, userType, firstName);
    console.log('🔍 [OTPService] Email result:', emailResult);
    
    if (emailResult.success) {
      console.log('✅ [OTPService] OTP sent successfully via email');
      return { success: true, message: 'OTP generated and sent successfully', otpId: data?.[0]?.id };
    } else {
      console.warn('⚠️ [OTPService] OTP generated but email sending failed:', emailResult.error);
      return { success: true, message: 'OTP generated successfully (email may not have been sent)', otpId: data?.[0]?.id, warning: emailResult.error };
    }
  } catch (error) {
    console.error('❌ [OTPService] Error generating OTP:', error);
    return { success: false, error: error.message };
  }
}
```

## Expected Console Output

### **Successful OTP Flow:**
```
📧 [Signup] Sending OTP to buyer email: user@example.com
🔍 [OTPService] generateAndSendOTP called with: { email: "user@example.com", userType: "buyer", purpose: "email_verification", firstName: "John" }
🔍 [OTPService] Generated OTP code: 123456
🔍 [OTPService] OTP expires at: 2024-01-01T12:10:00.000Z
✅ [OTPService] OTP stored in Supabase successfully
🔍 [OTPService] Sending OTP via email...
🔍 [OTPService] Email result: { success: true, message: "OTP sent successfully" }
✅ [OTPService] OTP sent successfully via email
🔍 [Signup] OTP result: { success: true, message: "OTP generated and sent successfully", otpId: "123" }
✅ [Signup] OTP sent successfully
🔍 [Signup] Setting step to 3 for OTP verification
🔍 [Signup] Step should now be 3, userType: buyer
🔍 [Signup] Checking OTP step - step: 3 userType: buyer condition: true
🔍 [Signup] Rendering OTP verification step
```

### **OTP Storage Failure:**
```
📧 [Signup] Sending OTP to buyer email: user@example.com
🔍 [OTPService] generateAndSendOTP called with: { email: "user@example.com", userType: "buyer", purpose: "email_verification", firstName: "John" }
🔍 [OTPService] Generated OTP code: 123456
🔍 [OTPService] OTP expires at: 2024-01-01T12:10:00.000Z
❌ [OTPService] Error storing OTP in Supabase: [error details]
🔍 [Signup] OTP result: { success: false, error: "Failed to generate OTP" }
❌ [Signup] Failed to send OTP: Failed to generate OTP
🔍 [Signup] OTP failed, going to success step instead
```

### **Email Service Failure:**
```
📧 [Signup] Sending OTP to buyer email: user@example.com
🔍 [OTPService] generateAndSendOTP called with: { email: "user@example.com", userType: "buyer", purpose: "email_verification", firstName: "John" }
🔍 [OTPService] Generated OTP code: 123456
🔍 [OTPService] OTP expires at: 2024-01-01T12:10:00.000Z
✅ [OTPService] OTP stored in Supabase successfully
🔍 [OTPService] Sending OTP via email...
🔍 [OTPService] Email result: { success: false, error: "Email service error" }
⚠️ [OTPService] OTP generated but email sending failed: Email service error
🔍 [Signup] OTP result: { success: true, message: "OTP generated successfully (email may not have been sent)", warning: "Email service error" }
✅ [Signup] OTP sent successfully
🔍 [Signup] Setting step to 3 for OTP verification
🔍 [Signup] Step should now be 3, userType: buyer
```

## Possible Issues to Identify

### **1. OTP Service Not Being Called:**
- Missing: `🔍 [OTPService] generateAndSendOTP called with:`
- Cause: Function call not reaching the service

### **2. OTP Generation Failure:**
- Missing: `🔍 [OTPService] Generated OTP code:`
- Cause: Error in OTP generation logic

### **3. Database Storage Failure:**
- Present: `❌ [OTPService] Error storing OTP in Supabase:`
- Cause: Database connection or table issues

### **4. Email Service Failure:**
- Present: `⚠️ [OTPService] OTP generated but email sending failed:`
- Cause: EmailJS configuration or service issues

### **5. Step Not Being Set:**
- Missing: `🔍 [Signup] Setting step to 3 for OTP verification`
- Cause: OTP result success is false

### **6. Step Rendering Issue:**
- Missing: `🔍 [Signup] Rendering OTP verification step`
- Cause: Step state not persisting or condition not met

## Testing Steps

### **1. Register as Buyer:**
1. Fill out buyer registration form
2. Submit form
3. Check console logs for debug messages
4. Identify which step is failing

### **2. Analyze Console Output:**
- Look for the complete flow from OTP generation to step rendering
- Identify where the flow breaks
- Check for any error messages

### **3. Common Issues:**
- **Database table missing**: `otp_verifications` table doesn't exist
- **EmailJS not configured**: Email service fails
- **State management**: Step state not persisting
- **Component re-render**: State being reset

## Files Modified
- `src/components/pages/Authentication/signup.jsx` - Enhanced debug logging
- `src/services/otpService.js` - Added comprehensive debug logging

## Next Steps
1. Test buyer registration with enhanced logging
2. Analyze console output to identify the exact failure point
3. Apply targeted fix based on debug information
4. Remove debug logging once issue is resolved

The enhanced debug logging will provide complete visibility into the OTP flow and help identify exactly where the process is failing.

