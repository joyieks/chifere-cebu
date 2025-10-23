# PayMongo Integration Setup Guide

Complete guide for setting up PayMongo payment processing in ChiFere marketplace app.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Getting API Keys](#getting-api-keys)
4. [Frontend Setup](#frontend-setup)
5. [Firebase Cloud Functions Setup](#firebase-cloud-functions-setup)
6. [Webhook Configuration](#webhook-configuration)
7. [Testing](#testing)
8. [Going Live](#going-live)
9. [Payment Methods](#payment-methods)
10. [Troubleshooting](#troubleshooting)

---

## Overview

ChiFere uses **PayMongo** as the payment gateway for Philippine-specific payment methods. This integration provides:

- **Cards**: Visa and Mastercard (3.5% + ₱15 fee)
- **E-wallets**: GCash (2.5%), Maya (2.2%), GrabPay (2.0%)
- **Online Banking**: BPI, UBP, BDO, Landbank, Metrobank (₱15 flat fee)
- **QR Ph**: Scan to Pay (1.5% fee)
- **Cash on Delivery**: Free (no payment processing)

**Architecture:**

- Client-side: React app with PayMongo public key
- Server-side: Firebase Cloud Functions with PayMongo secret key
- Webhooks: Automatic order status updates on payment events

---

## Prerequisites

Before starting, ensure you have:

1. ✅ **PayMongo Account** - Sign up at [paymongo.com](https://paymongo.com)
2. ✅ **Firebase Project** - With Cloud Functions enabled
3. ✅ **Node.js** - Version 18+ for Cloud Functions
4. ✅ **Firebase CLI** - Install with `npm install -g firebase-tools`

---

## Getting API Keys

### Step 1: Create PayMongo Account

1. Visit [dashboard.paymongo.com](https://dashboard.paymongo.com)
2. Sign up or log in
3. Complete business verification (required for LIVE mode)

### Step 2: Get API Keys

1. Navigate to **Developers > API Keys** in PayMongo dashboard
2. You'll see two sets of keys:

**TEST Mode Keys** (for development):

```
Public Key: pk_test_6K3hLvtXDgwr2vmhEsgYG21U
Secret Key: sk_test_YOUR_SECRET_KEY_HERE
```

**LIVE Mode Keys** (for production):

```
Public Key: pk_live_FD4ug6W9nMbhTU8cxur1mpDY
Secret Key: sk_live_YOUR_SECRET_KEY_HERE
```

⚠️ **Security Note**:

- **PUBLIC keys** (`pk_*`) are safe to use in frontend code
- **SECRET keys** (`sk_*`) must NEVER be exposed in frontend code
- Always use TEST keys during development

---

## Frontend Setup

### Step 1: Set Environment Variables

1. Copy the example environment file:

```bash
cd chifere-app
cp .env.example .env
```

2. Edit `.env` and add your PayMongo **PUBLIC** key:

```env
# TEST Mode (development)
VITE_PAYMONGO_PUBLIC_KEY=pk_test_your_actual_key_here

# LIVE Mode (production) - Only use after testing
# VITE_PAYMONGO_PUBLIC_KEY=pk_live_your_actual_key_here
```

### Step 2: Verify Frontend Configuration

The frontend is already configured to use PayMongo. Verify the setup:

1. **Payment Service** (`src/services/paymentService.js`):

   - ✅ Reads public key from `VITE_PAYMONGO_PUBLIC_KEY`
   - ✅ Provides payment method list with fees
   - ✅ Calls Cloud Function for secure payment intent creation

2. **Checkout Component** (`src/components/pages/Buyer/.../Checkout.jsx`):
   - ✅ Displays Philippine payment methods
   - ✅ Shows fee breakdown
   - ✅ Handles redirect-based payment flow

### Step 3: Test Frontend

```bash
npm run dev
```

Navigate to checkout page and verify:

- ✅ Payment methods are displayed with fees
- ✅ No console errors about missing PayMongo key
- ✅ Payment method selection works

---

## Firebase Cloud Functions Setup

### Step 1: Install Dependencies

```bash
cd firebase-setup/functions
npm install
```

Verify `package.json` includes:

```json
{
  "dependencies": {
    "firebase-admin": "^12.6.0",
    "firebase-functions": "^6.0.1",
    "axios": "^1.6.0"
  }
}
```

### Step 2: Configure PayMongo Secret Key

⚠️ **IMPORTANT**: Secret keys must be stored securely using Firebase Functions config.

```bash
# Set PayMongo secret key (use TEST key for development)
firebase functions:config:set paymongo.secret_key="sk_test_your_secret_key_here"

# Verify configuration
firebase functions:config:get
```

Expected output:

```json
{
  "paymongo": {
    "secret_key": "sk_test_..."
  }
}
```

### Step 3: Deploy Cloud Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific functions
firebase deploy --only functions:createPaymentIntent,functions:handlePayMongoWebhook
```

Expected output:

```
✔  functions[asia-southeast1-createPaymentIntent(...)]: Successful create operation.
✔  functions[asia-southeast1-handlePayMongoWebhook(...)]: Successful create operation.
```

### Step 4: Get Function URLs

After deployment, note these URLs:

1. **createPaymentIntent** (callable function):

   - Used automatically by Firebase SDK
   - No URL needed (called via `httpsCallable`)

2. **handlePayMongoWebhook** (HTTP function):
   ```
   https://asia-southeast1-YOUR_PROJECT_ID.cloudfunctions.net/handlePayMongoWebhook
   ```
   - Save this URL for webhook configuration

---

## Webhook Configuration

Webhooks allow PayMongo to notify your app when payments succeed/fail.

### Step 1: Get Webhook URL

Your webhook URL from Cloud Functions deployment:

```
https://asia-southeast1-YOUR_PROJECT_ID.cloudfunctions.net/handlePayMongoWebhook
```

### Step 2: Create Webhook in PayMongo

**Option A: Using PayMongo Dashboard** (Recommended)

1. Go to [dashboard.paymongo.com](https://dashboard.paymongo.com)
2. Navigate to **Developers > Webhooks**
3. Click **Create Webhook**
4. Configure:
   - **URL**: Your Cloud Function webhook URL
   - **Events**: Select these events:
     - ✅ `payment.paid`
     - ✅ `payment.failed`
     - ✅ `payment.refunded`
     - ✅ `payment.refund.updated`
5. Click **Create**

**Option B: Using API** (Advanced)

```bash
curl -X POST https://api.paymongo.com/v1/webhooks \
  -u sk_test_your_secret_key: \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "attributes": {
        "url": "https://asia-southeast1-YOUR_PROJECT_ID.cloudfunctions.net/handlePayMongoWebhook",
        "events": [
          "payment.paid",
          "payment.failed",
          "payment.refunded",
          "payment.refund.updated"
        ]
      }
    }
  }'
```

### Step 3: Verify Webhook

Test webhook functionality:

1. Make a test payment (see [Testing](#testing) section)
2. Check Firebase Functions logs:

```bash
firebase functions:log --only handlePayMongoWebhook
```

Expected logs:

```
Received PayMongo webhook
Webhook event type: payment.paid
Payment succeeded: pay_...
Order updated and notifications sent: order_...
```

---

## Testing

### Test Mode Setup

Always test with **TEST keys** before going live:

```env
# Frontend (.env)
VITE_PAYMONGO_PUBLIC_KEY=pk_test_...

# Backend (Firebase Functions config)
paymongo.secret_key=sk_test_...
```

### Test Cards

PayMongo provides test cards that simulate different scenarios:

**Successful Payment:**

```
Card Number: 4123 4567 8901 2346
Expiry: 12/25
CVV: 123
```

**3D Secure Authentication:**

```
Card Number: 4571 7360 0000 0008
Expiry: 12/25
CVV: 123
```

**Failed Payment:**

```
Card Number: 4000 0000 0000 0002
Expiry: 12/25
CVV: 123
```

### Testing E-wallets (GCash, Maya, GrabPay)

In TEST mode, e-wallet payments will:

1. Redirect to PayMongo test page
2. Show "Authorize Payment" button
3. Click button to simulate successful payment

### Testing Checklist

Run through this checklist before going live:

- [ ] **Payment Intent Creation**

  - [ ] Create order with card payment
  - [ ] Create order with GCash payment
  - [ ] Create order with COD
  - [ ] Verify minimum amount validation (₱20)

- [ ] **Payment Processing**

  - [ ] Complete card payment successfully
  - [ ] Test 3D Secure flow
  - [ ] Test failed payment
  - [ ] Test e-wallet redirect flow

- [ ] **Webhook Events**

  - [ ] Verify `payment.paid` updates order status
  - [ ] Verify buyer notification sent
  - [ ] Verify seller notification sent
  - [ ] Test `payment.failed` handling

- [ ] **Error Handling**
  - [ ] Test with invalid card
  - [ ] Test with insufficient funds card
  - [ ] Test without internet connection
  - [ ] Verify error messages display correctly

---

## Going Live

### Pre-Launch Checklist

Before switching to LIVE mode:

1. ✅ **Complete PayMongo Verification**

   - Submit business documents
   - Complete KYC process
   - Get LIVE keys approved

2. ✅ **Security Audit**

   - [ ] Confirm SECRET keys never exposed in frontend
   - [ ] Verify HTTPS enabled on all endpoints
   - [ ] Test webhook signature verification
   - [ ] Review Firestore security rules

3. ✅ **Testing Complete**
   - [ ] All test cases passed
   - [ ] Webhook events working
   - [ ] Error handling tested
   - [ ] User flow validated

### Step 1: Update Environment Variables

**Frontend (.env):**

```env
# Switch to LIVE key
VITE_PAYMONGO_PUBLIC_KEY=pk_live_your_live_key_here
```

**Backend (Firebase Functions):**

```bash
# Set LIVE secret key
firebase functions:config:set paymongo.secret_key="sk_live_your_live_key_here"
```

### Step 2: Update Webhooks

1. Go to PayMongo Dashboard > Webhooks
2. Create new webhook with same URL but for LIVE mode
3. Delete TEST mode webhook

### Step 3: Deploy to Production

```bash
# Build frontend
npm run build

# Deploy everything
firebase deploy
```

### Step 4: Verify Production

1. Make a small real payment (₱20-50)
2. Complete payment with real card/e-wallet
3. Verify order status updates
4. Check notifications sent correctly

---

## Payment Methods

### Supported Methods

| Method                | Key             | Fee        | Redirect Required |
| --------------------- | --------------- | ---------- | ----------------- |
| **Credit/Debit Card** | `card`          | 3.5% + ₱15 | No                |
| **GCash**             | `gcash`         | 2.5%       | Yes               |
| **Maya (PayMaya)**    | `paymaya`       | 2.2%       | Yes               |
| **GrabPay**           | `grab_pay`      | 2.0%       | Yes               |
| **Online Banking**    | `bank_transfer` | ₱15 flat   | Yes               |
| **QR Ph**             | `qrph`          | 1.5%       | Yes               |
| **Cash on Delivery**  | `cod`           | Free       | No                |

### Payment Flow by Method

**Cards (card):**

1. User enters card details on your site
2. Direct payment processing
3. 3D Secure if required
4. Immediate confirmation

**E-wallets (gcash, paymaya, grab_pay):**

1. User selects e-wallet
2. Redirects to PayMongo > E-wallet app
3. User authorizes payment in app
4. Redirects back to your site
5. Webhook confirms payment

**Online Banking (bank_transfer):**

1. User selects bank
2. Redirects to PayMongo > Bank portal
3. User logs in and confirms
4. Redirects back to your site
5. Webhook confirms payment

**QR Ph (qrph):**

1. User selects QR Ph
2. QR code displayed
3. User scans with banking app
4. Payment confirmed
5. Webhook updates order

**Cash on Delivery (cod):**

1. User selects COD
2. Order created immediately
3. No payment processing
4. Payment collected on delivery

### Fee Calculation

PayMongo service calculates fees automatically:

```javascript
// Example: ₱1,000 order
import paymentService from './services/paymentService';

// Card payment
const cardFee = paymentService.calculateFee('card', 1000);
// { grossAmount: 1000, fee: 50, netAmount: 950 }
// Fee: (1000 * 0.035) + 15 = ₱50

// GCash payment
const gcashFee = paymentService.calculateFee('gcash', 1000);
// { grossAmount: 1000, fee: 25, netAmount: 975 }
// Fee: 1000 * 0.025 = ₱25

// Online banking
const bankFee = paymentService.calculateFee('bank_transfer', 1000);
// { grossAmount: 1000, fee: 15, netAmount: 985 }
// Fee: ₱15 flat
```

### Payment Recommendations

ChiFere automatically recommends payment methods based on amount:

```javascript
// Small amounts (< ₱100): GCash
// Fee: 2.5% vs Card 3.5% + ₱15

// Medium amounts (₱100-₱1,875): GrabPay
// Fee: 2.0% - lowest percentage

// Large amounts (> ₱1,875): Online Banking
// Fee: ₱15 flat - best for high values
// Break-even point: ₱1,875 where 0.8% = ₱15
```

---

## Troubleshooting

### Common Issues

#### 1. "PayMongo public key not configured"

**Cause**: Missing or invalid `VITE_PAYMONGO_PUBLIC_KEY` in `.env`

**Solution**:

```bash
# Check .env file exists
ls -la .env

# Verify key format (should start with pk_test_ or pk_live_)
cat .env | grep PAYMONGO

# Restart dev server after changing .env
npm run dev
```

#### 2. "Unauthenticated" error on payment

**Cause**: User not logged in or Firebase Auth not initialized

**Solution**:

```javascript
// Verify user is logged in before payment
if (!user) {
  setError('You must be logged in to place an order');
  return;
}
```

#### 3. "Failed to create payment intent"

**Possible Causes**:

- Cloud Function not deployed
- Invalid secret key in Firebase config
- Network connectivity issues

**Solution**:

```bash
# Check Cloud Functions deployment
firebase functions:list

# Verify secret key configured
firebase functions:config:get

# Check function logs
firebase functions:log --only createPaymentIntent

# Redeploy if needed
firebase deploy --only functions:createPaymentIntent
```

#### 4. "Minimum payment amount is ₱20"

**Cause**: PayMongo requires minimum ₱20 payment

**Solution**:

```javascript
// Validate amount before payment
if (amount < 20) {
  setError('Minimum payment amount is ₱20.00');
  return;
}
```

#### 5. Webhooks not firing

**Possible Causes**:

- Webhook not created in PayMongo
- Wrong webhook URL
- Webhook verification failing

**Solution**:

```bash
# Check webhook logs
firebase functions:log --only handlePayMongoWebhook

# Verify webhook URL is correct
firebase functions:list | grep webhook

# Test webhook manually
curl -X POST https://your-webhook-url \
  -H "Content-Type: application/json" \
  -d '{"data": {"attributes": {"type": "payment.paid"}}}'
```

#### 6. Payment succeeds but order not updated

**Cause**: Webhook received but order update failed

**Solution**:

```bash
# Check Firestore security rules
# Ensure Cloud Functions have write permission

# View detailed logs
firebase functions:log --only handlePayMongoWebhook

# Check order exists in Firestore
# Navigate to Firebase Console > Firestore > orders collection
```

### Debug Mode

Enable detailed logging:

```javascript
// In src/services/paymentService.js
async createPaymentIntent(paymentData) {
  console.log('Payment data:', paymentData);

  const result = await createIntent(paymentData);

  console.log('Payment result:', result);

  return result;
}
```

### Getting Help

If issues persist:

1. **Check PayMongo Status**: [status.paymongo.com](https://status.paymongo.com)
2. **PayMongo Docs**: [developers.paymongo.com/docs](https://developers.paymongo.com/docs)
3. **PayMongo Support**: support@paymongo.com
4. **Firebase Support**: [firebase.google.com/support](https://firebase.google.com/support)

---

## Additional Resources

### Official Documentation

- **PayMongo API Docs**: [developers.paymongo.com/docs](https://developers.paymongo.com/docs)
- **PayMongo API Reference**: [developers.paymongo.com/reference](https://developers.paymongo.com/reference)
- **Firebase Cloud Functions**: [firebase.google.com/docs/functions](https://firebase.google.com/docs/functions)

### Code Examples

All PayMongo integration code is located in:

- **Client Service**: `src/services/paymentService.js`
- **Checkout Component**: `src/components/pages/Buyer/.../Checkout.jsx`
- **Cloud Functions**: `firebase-setup/functions/paymongo/`
  - `paymongoClient.js` - API client
  - `createPaymentIntent.js` - Payment creation
  - `webhookHandler.js` - Webhook processing

### Testing Resources

- **Test Cards**: [developers.paymongo.com/docs/testing](https://developers.paymongo.com/docs/testing)
- **Webhook Testing**: Use [webhook.site](https://webhook.site) to inspect webhook payloads
- **Postman Collection**: Import from [developers.paymongo.com](https://developers.paymongo.com)

---

## Security Best Practices

### Do's ✅

- ✅ Use environment variables for API keys
- ✅ Keep SECRET keys in Firebase Functions config only
- ✅ Verify webhook events by calling PayMongo API
- ✅ Validate payment amounts on server-side
- ✅ Use HTTPS for all endpoints
- ✅ Log all payment attempts for audit
- ✅ Test thoroughly before going live
- ✅ Monitor webhook failures

### Don'ts ❌

- ❌ NEVER expose SECRET keys in frontend code
- ❌ NEVER commit API keys to Git
- ❌ NEVER skip amount validation
- ❌ NEVER trust webhook payloads without verification
- ❌ NEVER use LIVE keys during development
- ❌ NEVER bypass security rules for testing
- ❌ NEVER store card details (PCI compliance)

---

## Migration from Stripe

If you're migrating from Stripe:

### Key Differences

| Feature                  | Stripe        | PayMongo                    |
| ------------------------ | ------------- | --------------------------- |
| **API Style**            | REST with SDK | REST only (no official SDK) |
| **Authentication**       | Bearer token  | Basic Auth (Base64)         |
| **Amount Unit**          | Cents         | Centavos (same)             |
| **Webhook Verification** | Signature     | API call verification       |
| **Payment Methods**      | Global        | Philippines-focused         |
| **Minimum Amount**       | $0.50         | ₱20.00                      |

### Migration Steps

1. ✅ Remove Stripe dependencies from `package.json`
2. ✅ Replace Stripe imports with PayMongo service
3. ✅ Update payment method list to Philippine methods
4. ✅ Change webhook event handlers
5. ✅ Update environment variables
6. ✅ Test all payment flows
7. ✅ Update user documentation

All migration code changes are already completed in this implementation.

---

## Support

For issues specific to ChiFere implementation:

- Review code in `firebase-setup/functions/paymongo/`
- Check `src/services/paymentService.js` implementation
- Verify Firestore security rules allow order updates

For PayMongo-specific questions:

- Email: support@paymongo.com
- Dashboard: [dashboard.paymongo.com](https://dashboard.paymongo.com)
- Docs: [developers.paymongo.com](https://developers.paymongo.com)

---

**Last Updated**: 2025-10-12
**Version**: 1.0.0
**Integration Status**: Complete ✅
