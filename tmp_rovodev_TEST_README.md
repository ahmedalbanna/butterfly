# n8n Webhook Integration Test Guide

## Quick Start

### Prerequisites
- Node.js 16+ installed
- LuxeFinds environment variables configured in `.env`
- (Optional) LuxeFinds server running on port 9002

### Running the Test

**Option 1: Using Node (Recommended)**
```bash
node tmp_rovodev_test_n8n_webhook.js
```

**Option 2: Using npx**
```bash
npx ts-node tmp_rovodev_test_n8n_webhook.ts
```

## What the Test Does

The test script runs 4 main tests:

### 1. Configuration Check ✓
Verifies all required environment variables are set:
- `N8N_WEBHOOK_URL`
- `N8N_API_KEY`
- `LUXEFINDS_CALLBACK_SECRET`
- `NEXT_PUBLIC_APP_URL`

### 2. n8n Webhook Test
Sends a test product payload to your n8n webhook endpoint:
```json
{
  "productId": "test-product-123",
  "productName": "Test Hermès Birkin Bag",
  "description": "...",
  "price": 12500,
  "platforms": ["facebook", "instagram"]
}
```

**Expected Results:**
- ✓ Status 200/201/202: Webhook is working
- ❌ Status 404: n8n webhook URL not found
- ❌ Status 401: API key invalid

### 3. Callback Test
Tests the LuxeFinds callback endpoint:
- Sends a sample "published" status update
- Requires LuxeFinds to be running on port 9002

**Expected Results:**
- ✓ Status 200/201: Callback endpoint working
- ⚠ Status 404: LuxeFinds not running (OK for now)
- ❌ Status 401: Callback secret invalid

### 4. Publish Action Test
Tests the `/api/webhooks/n8n/publish` endpoint directly:
- Requires LuxeFinds to be running
- Simulates admin publishing a product

**Expected Results:**
- ✓ Status 200/201: Publish endpoint working
- ⚠ Status 404: LuxeFinds not running (OK for now)

## Understanding the Results

### All Tests Pass ✓
```
✓ Configuration
✓ n8n Webhook Endpoint
✓ Callback Endpoint
✓ Publish Endpoint
```
**Next Steps:** Set up n8n workflow and test from admin panel

### Partial Results (Some Failed)
```
✓ Configuration
✓ n8n Webhook Endpoint
⚠ Callback Endpoint (404)
⚠ Publish Endpoint (404)
```
**Meaning:** n8n connectivity works, but LuxeFinds server not running yet.
**Fix:** Start LuxeFinds with `npm run dev` then test callbacks.

### Configuration Failed
```
❌ Configuration Issues:
  - N8N_WEBHOOK_URL is not set
  - N8N_API_KEY is not set
```
**Fix:** Add missing variables to `.env` file

## Troubleshooting

### "n8n webhook URL not found (404)"
- Verify `N8N_WEBHOOK_URL` is correct in `.env`
- Check that n8n server is running and accessible
- Ensure webhook path exists in n8n

### "Unauthorized (401)"
- Verify `N8N_API_KEY` matches in `.env`
- Check API key isn't expired or revoked in n8n

### "Callback endpoint not found (404)"
- This is normal if LuxeFinds isn't running yet
- Start LuxeFinds with `npm run dev`
- Re-run the test

### "Request failed: connect ECONNREFUSED"
- n8n server may be down
- Check n8n is running at the URL in `N8N_WEBHOOK_URL`

## Sample Test Output

```
============================================================
🚀 n8n Webhook Integration Test Suite

============================================================
1. Testing Configuration
============================================================

✓ N8N_WEBHOOK_URL: https://vmi2935537.contaboserver.net/webhook-test/...
✓ N8N_API_KEY: eyJhbGciOiJIUzI1NiIsInR5c...
✓ LUXEFINDS_CALLBACK_SECRET: https://vmi2935537.contaboserver.net...
✓ NEXT_PUBLIC_APP_URL: http://localhost:9002

✓ All configuration values are set

============================================================
2. Testing Webhook Endpoint
============================================================

Test Payload:
{
  "productId": "test-product-123",
  "productName": "Test Hermès Birkin Bag",
  ...
}

📤 Sending request to n8n webhook...
Response Status: 200 OK

✓ Response (JSON):
{
  "success": true,
  "message": "Webhook received"
}

✓ Webhook accepted successfully!

...
```

## Next Steps

Once tests pass, follow these steps:

1. **Set up n8n workflow**
   - See `n8n.md` for detailed instructions
   - Add nodes for each social media platform

2. **Configure platform credentials**
   - Meta (Facebook/Instagram) OAuth
   - Twitter API v2
   - Pinterest API
   - TikTok Business API

3. **Test from admin panel**
   - Go to `/admin/products`
   - Click "Share to Social" button
   - Select platforms and publish

4. **Monitor posts**
   - Visit `/admin/social-media` dashboard
   - View post status and analytics

## Test Files

These files are temporary and can be deleted after testing:
- `tmp_rovodev_test_n8n_webhook.js` - Main test script (Node.js)
- `tmp_rovodev_test_n8n_webhook.ts` - TypeScript version
- `tmp_rovodev_TEST_README.md` - This file
