# EmailJS Setup Guide for ChiFere App

## 🚀 Quick Setup

This guide will help you set up EmailJS for sending OTP verification emails in your ChiFere app.

### 1. Create EmailJS Account

1. **Go to [EmailJS.com](https://www.emailjs.com/)**
2. **Sign up** for a free account
3. **Verify your email** address

### 2. Create Email Service

1. **Go to Email Services** in your EmailJS dashboard
2. **Click "Add New Service"**
3. **Choose your email provider:**
   - Gmail (recommended for testing)
   - Outlook
   - Yahoo
   - Custom SMTP
4. **Follow the setup instructions** for your chosen provider
5. **Note your Service ID** (e.g., `service_abc123`)

### 3. Create Email Template

1. **Go to Email Templates** in your EmailJS dashboard
2. **Click "Create New Template"**
3. **Use this template content:**

```html
Subject: ChiFere Verification Code - {{otp_code}}

Hello,

Thank you for signing up for ChiFere!

Your verification code is: {{otp_code}}

This code will expire in {{expiry_minutes}} minutes.

If you didn't request this code, please ignore this email.

Best regards,
The ChiFere Team
```

4. **Save the template** and note your Template ID (e.g., `template_xyz789`)

### 4. Get Public Key

1. **Go to Account** in your EmailJS dashboard
2. **Find your Public Key** (e.g., `user_abcdef123456`)
3. **Copy this key**

### 5. Update Environment Variables

Update your `.env` file with your EmailJS credentials:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://msaeanvstzgrzphslcjz.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# EmailJS Configuration
REACT_APP_EMAILJS_SERVICE_ID=your_service_id_here
REACT_APP_EMAILJS_TEMPLATE_ID=your_template_id_here
REACT_APP_EMAILJS_PUBLIC_KEY=your_public_key_here
```

### 6. Test EmailJS Setup

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Go to the signup page**
3. **Fill out the form** and click "Send Verification Code"
4. **Check your email** for the OTP code
5. **Enter the code** to complete verification

## 📧 Email Template Variables

The OTP service uses these variables in your email template:

- `{{to_email}}` - Recipient's email address
- `{{otp_code}}` - 6-digit verification code
- `{{user_type}}` - 'buyer' or 'seller'
- `{{app_name}}` - 'ChiFere'
- `{{expiry_minutes}}` - Code expiry time (10 minutes)

## 🔧 Troubleshooting

### Common Issues

#### 1. "EmailJS not configured" error
- **Check:** Your `.env` file has the correct EmailJS variables
- **Solution:** Restart your development server after updating `.env`

#### 2. "Failed to send OTP" error
- **Check:** Your EmailJS service is active
- **Check:** Your email template exists and is published
- **Check:** Your public key is correct

#### 3. Emails not received
- **Check:** Spam/junk folder
- **Check:** Email provider settings (Gmail may require app passwords)
- **Check:** EmailJS service status

#### 4. Template variables not working
- **Check:** Template syntax is correct (`{{variable_name}}`)
- **Check:** Variable names match exactly (case-sensitive)

## 📱 Testing

### Test the Complete Flow

1. **Choose user type** (Buyer or Seller)
2. **Fill registration form**
3. **Click "Send Verification Code"**
4. **Check email** for OTP
5. **Enter OTP code**
6. **Verify successful registration**

### Test Different Scenarios

- **Valid email** - Should receive OTP
- **Invalid email format** - Should show error
- **Wrong OTP** - Should show error
- **Expired OTP** - Should show error
- **Resend OTP** - Should work after countdown

## 🎯 Production Setup

### For Production:

1. **Use a professional email service** (SendGrid, Mailgun, etc.)
2. **Set up custom domain** for emails
3. **Configure SPF/DKIM records**
4. **Monitor email delivery rates**
5. **Set up email analytics**

### Security Considerations:

- **Rate limiting** - Prevent spam
- **OTP expiry** - 10 minutes max
- **Attempt limits** - 3 attempts max
- **Cleanup** - Remove expired OTPs

## 📊 EmailJS Limits (Free Plan)

- **200 emails/month**
- **2 email services**
- **2 email templates**
- **Basic support**

## 🚀 You're Ready!

Your ChiFere app now has:
- ✅ **OTP verification** via EmailJS
- ✅ **Email templates** for verification
- ✅ **Error handling** for failed sends
- ✅ **Resend functionality** with countdown
- ✅ **Success messages** for users

The signup flow is now complete with email verification! 🎉



## 🚀 Quick Setup

This guide will help you set up EmailJS for sending OTP verification emails in your ChiFere app.

### 1. Create EmailJS Account

1. **Go to [EmailJS.com](https://www.emailjs.com/)**
2. **Sign up** for a free account
3. **Verify your email** address

### 2. Create Email Service

1. **Go to Email Services** in your EmailJS dashboard
2. **Click "Add New Service"**
3. **Choose your email provider:**
   - Gmail (recommended for testing)
   - Outlook
   - Yahoo
   - Custom SMTP
4. **Follow the setup instructions** for your chosen provider
5. **Note your Service ID** (e.g., `service_abc123`)

### 3. Create Email Template

1. **Go to Email Templates** in your EmailJS dashboard
2. **Click "Create New Template"**
3. **Use this template content:**

```html
Subject: ChiFere Verification Code - {{otp_code}}

Hello,

Thank you for signing up for ChiFere!

Your verification code is: {{otp_code}}

This code will expire in {{expiry_minutes}} minutes.

If you didn't request this code, please ignore this email.

Best regards,
The ChiFere Team
```

4. **Save the template** and note your Template ID (e.g., `template_xyz789`)

### 4. Get Public Key

1. **Go to Account** in your EmailJS dashboard
2. **Find your Public Key** (e.g., `user_abcdef123456`)
3. **Copy this key**

### 5. Update Environment Variables

Update your `.env` file with your EmailJS credentials:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://msaeanvstzgrzphslcjz.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# EmailJS Configuration
REACT_APP_EMAILJS_SERVICE_ID=your_service_id_here
REACT_APP_EMAILJS_TEMPLATE_ID=your_template_id_here
REACT_APP_EMAILJS_PUBLIC_KEY=your_public_key_here
```

### 6. Test EmailJS Setup

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Go to the signup page**
3. **Fill out the form** and click "Send Verification Code"
4. **Check your email** for the OTP code
5. **Enter the code** to complete verification

## 📧 Email Template Variables

The OTP service uses these variables in your email template:

- `{{to_email}}` - Recipient's email address
- `{{otp_code}}` - 6-digit verification code
- `{{user_type}}` - 'buyer' or 'seller'
- `{{app_name}}` - 'ChiFere'
- `{{expiry_minutes}}` - Code expiry time (10 minutes)

## 🔧 Troubleshooting

### Common Issues

#### 1. "EmailJS not configured" error
- **Check:** Your `.env` file has the correct EmailJS variables
- **Solution:** Restart your development server after updating `.env`

#### 2. "Failed to send OTP" error
- **Check:** Your EmailJS service is active
- **Check:** Your email template exists and is published
- **Check:** Your public key is correct

#### 3. Emails not received
- **Check:** Spam/junk folder
- **Check:** Email provider settings (Gmail may require app passwords)
- **Check:** EmailJS service status

#### 4. Template variables not working
- **Check:** Template syntax is correct (`{{variable_name}}`)
- **Check:** Variable names match exactly (case-sensitive)

## 📱 Testing

### Test the Complete Flow

1. **Choose user type** (Buyer or Seller)
2. **Fill registration form**
3. **Click "Send Verification Code"**
4. **Check email** for OTP
5. **Enter OTP code**
6. **Verify successful registration**

### Test Different Scenarios

- **Valid email** - Should receive OTP
- **Invalid email format** - Should show error
- **Wrong OTP** - Should show error
- **Expired OTP** - Should show error
- **Resend OTP** - Should work after countdown

## 🎯 Production Setup

### For Production:

1. **Use a professional email service** (SendGrid, Mailgun, etc.)
2. **Set up custom domain** for emails
3. **Configure SPF/DKIM records**
4. **Monitor email delivery rates**
5. **Set up email analytics**

### Security Considerations:

- **Rate limiting** - Prevent spam
- **OTP expiry** - 10 minutes max
- **Attempt limits** - 3 attempts max
- **Cleanup** - Remove expired OTPs

## 📊 EmailJS Limits (Free Plan)

- **200 emails/month**
- **2 email services**
- **2 email templates**
- **Basic support**

## 🚀 You're Ready!

Your ChiFere app now has:
- ✅ **OTP verification** via EmailJS
- ✅ **Email templates** for verification
- ✅ **Error handling** for failed sends
- ✅ **Resend functionality** with countdown
- ✅ **Success messages** for users

The signup flow is now complete with email verification! 🎉


























