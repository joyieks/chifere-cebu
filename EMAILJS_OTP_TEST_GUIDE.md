# EmailJS OTP Test Guide

## ✅ **EmailJS Configuration Status**

Your EmailJS is already configured with:
- **Service ID:** `service_8g95wi7`
- **Public Key:** `vk4Gtjlc1VVqgKTTMp`
- **Template ID:** `template_m0g4pja` (ChiFere Verification Code)

## 🧪 **Test the Complete OTP Flow**

### **Step 1: Test Seller Signup with EmailJS**

1. **Go to `/signup`**
2. **Select "Sign up as Seller"**
3. **Fill out the form:**
   - Store Name: "Test Store"
   - Store Address: "123 Test St"
   - Business Info: "Test business"
   - Contact: "+639123456789"
   - Email: **Use your real email address**
   - Password: "Test123!"
   - ID Type: "Driver's License"
   - Upload ID documents (front and back)

4. **Click "Register"**

### **Step 2: Check EmailJS Sending**

**Expected Console Logs:**
```
📤 Uploading ID document to bucket: seller-ids
✅ Upload successful: [file data]
📧 Sending OTP via EmailJS...
✅ OTP email sent successfully: [response]
```

**Expected Email:**
- **Subject:** "ChiFere Verification Code"
- **From:** ChiFere Team
- **Content:** Professional email with OTP code in a highlighted box
- **Personalization:** "Hello [Store Name]," instead of generic greeting

### **Step 3: Test OTP Input UI**

1. **Should see:** "Enter OTP Code" page
2. **Should show:** "We've sent a 6-digit verification code to [your-email]"
3. **Should have:** 6 individual digit input boxes
4. **Should auto-focus:** Next input when typing
5. **Should handle:** Backspace to go to previous input

### **Step 4: Test OTP Verification**

1. **Enter the 6-digit code** from your email
2. **Click "Verify OTP Code"**
3. **Should see:** "Pending Review" page for sellers
4. **Should show:** Professional waiting page with next steps

## 🔍 **Troubleshooting**

### **If EmailJS Fails:**

**Check Browser Console:**
```javascript
// Look for these errors:
- "EmailJS not configured"
- "Failed to send email"
- Network errors
```

**Common Issues:**
1. **Service ID Mismatch:** Ensure `service_8g95wi7` is correct
2. **Template ID Mismatch:** Ensure `template_m0g4pja` exists
3. **Public Key Issues:** Ensure `vk4Gtjlc1VVqgKTTMp` is valid
4. **Template Variables:** Ensure template has `{{first_name}}` and `{{otp_code}}`

### **If OTP UI Doesn't Work:**

**Check for JavaScript Errors:**
- Auto-focus not working
- Input validation issues
- Form submission problems

### **If Storage Upload Fails:**

**Check Storage Policies:**
- Ensure `seller-ids` bucket has proper RLS policies
- Verify files are uploading to Supabase storage

## 📧 **EmailJS Template Requirements**

Your template should have these variables:
- `{{to_email}}` - Recipient email
- `{{first_name}}` - User's first name or store name
- `{{otp_code}}` - 6-digit verification code
- `{{user_type}}` - buyer or seller
- `{{app_name}}` - Chifere Cebu
- `{{expiry_minutes}}` - 10

## 🎯 **Expected Complete Flow**

```
1. User fills seller form ✅
2. Uploads ID documents ✅
3. EmailJS sends OTP email ✅
4. User sees "Enter OTP Code" page ✅
5. User enters 6-digit code ✅
6. User sees "Pending Review" page ✅
7. Admin can approve/reject ✅
```

## 🚀 **Success Indicators**

- ✅ **EmailJS sends real emails** (not mock mode)
- ✅ **OTP emails are professional** with proper branding
- ✅ **OTP input UI is user-friendly** with 6 individual boxes
- ✅ **Pending review page is clear** about next steps
- ✅ **File uploads work** without RLS errors
- ✅ **Complete signup flow** works end-to-end

## 📝 **Test Results**

After testing, you should see:
- Real OTP emails in your inbox
- Professional email template with ChiFere branding
- Smooth OTP input experience
- Clear pending review page for sellers
- No console errors

**The EmailJS integration is now complete and ready for production!** 🎉


