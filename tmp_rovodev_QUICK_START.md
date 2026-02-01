# n8n Integration - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Verify Environment Variables (1 min)
Check `.env` file has these values:
```env
N8N_WEBHOOK_URL=https://vmi2935537.contaboserver.net/webhook-test/6da272c3-1d10-45d1-9be0-0f416c7a00bd
N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
LUXEFINDS_CALLBACK_SECRET=https://vmi2935537.contaboserver.net/rest/oauth2-credential/callback
NEXT_PUBLIC_APP_URL=http://localhost:9002
```

✅ Check complete!

---

### Step 2: Run Test Suite (2 min)
```bash
node tmp_rovodev_test_n8n_webhook.js
```

**Expected Output:**
```
✓ Configuration
✓ n8n Webhook Endpoint
⚠ Callback Endpoint (404 is OK if LuxeFinds not running)
⚠ Publish Endpoint (404 is OK if LuxeFinds not running)
```

If tests pass (or only callback/publish show 404):
✅ n8n connectivity is working!

---

### Step 3: Start LuxeFinds (2 min)
```bash
npm run dev
```

Wait for server to start on `http://localhost:9002`

✅ Server is running!

---

### Step 4: Access Admin Panel
1. Open browser: `http://localhost:9002/admin/products`
2. Find any product
3. Look for blue **Share** button (📤 icon) in the actions column

✅ Ready to test!

---

## 🧪 Quick Test

### Option A: Test Without n8n Workflow
1. Click **Share** button on any product
2. Select platforms (e.g., Facebook, Instagram)
3. Click **Publish to 2 Platform(s)**
4. You'll see:
   - ✓ Posts created in database as "pending"
   - ✓ n8n webhook triggered
   - ⚠ Status stays "pending" (n8n not sending callback yet)

### Option B: Full Test (After n8n Setup)
1. Set up n8n workflow (see `n8n.md`)
2. Click **Share** and publish
3. Check `/admin/social-media` dashboard
4. See posts update to "published" with URLs

---

## 📊 View Post History

Visit: `http://localhost:9002/admin/social-media`

See:
- Total posts count
- Posts by platform breakdown
- Complete post history table
- View/Retry buttons for each post

---

## ⚙️ Configure n8n Workflow

### 1. Create Webhook Trigger
```
n8n Dashboard → New Workflow → Add Node → Webhook
Path: /luxefinds-social-publish
Method: POST
```

### 2. Add Platform Nodes
For each platform (Facebook, Instagram, Twitter, etc.):
```
Add Node → HTTP Request
URL: [Platform API endpoint]
Method: POST
Headers: [Auth token]
Body: [Formatted post content]
```

### 3. Add Callback
```
Add Node → HTTP Request
URL: {{ $json.callbackUrl }}
Headers:
  Authorization: Bearer [LUXEFINDS_CALLBACK_SECRET]
Body: {
  "socialMediaPostId": "...",
  "platform": "...",
  "status": "published",
  "postUrl": "..."
}
```

See `n8n.md` for detailed examples!

---

## 🔍 Debugging

### Check n8n Webhook Is Working
```bash
node tmp_rovodev_test_n8n_webhook.js
```

### Check Database
```bash
npx prisma studio
# Navigate to SocialMediaPost table
```

### Check Logs
Start LuxeFinds with:
```bash
npm run dev
```

Look for:
```
[n8n] Triggering workflow for product: [Product Name]
[n8n Callback] Updated post [id] - [platform]: [status]
```

---

## 📱 Supported Platforms

- ✅ Facebook (Meta Graph API)
- ✅ Instagram (Meta Graph API)
- ✅ Twitter/X (API v2)
- ✅ Pinterest (API)
- ✅ TikTok (Business API)

---

## 🚨 Common Issues

### "Unauthorized - check N8N_API_KEY"
- Copy fresh API key from n8n settings
- Paste in `.env` file
- Restart server

### "Webhook URL not found (404)"
- Check n8n server is running
- Verify webhook path in n8n matches `N8N_WEBHOOK_URL`
- Test: `curl -X POST [N8N_WEBHOOK_URL]`

### Posts stuck on "pending"
- n8n workflow not sending callback
- Check n8n workflow execution logs
- Verify `LUXEFINDS_CALLBACK_SECRET` in n8n matches `.env`

### Database error: "SocialMediaPost not found"
- Run: `npx prisma migrate dev`
- Restart server

---

## ✨ Next Features

- [ ] Scheduling posts for future dates
- [ ] AI-generated platform-specific captions
- [ ] A/B testing post variations
- [ ] Engagement analytics integration
- [ ] Multi-language post support
- [ ] Video content for TikTok/Reels

---

## 📞 Need Help?

1. Check `n8n.md` for detailed setup guide
2. Read `tmp_rovodev_IMPLEMENTATION_SUMMARY.md` for architecture
3. Run test script: `node tmp_rovodev_test_n8n_webhook.js`
4. Check server logs: `npm run dev`

---

## ✅ You're All Set!

The n8n social media automation is ready to use. Follow these next steps:

1. **Run tests** to verify connectivity
2. **Start LuxeFinds** with `npm run dev`
3. **Configure n8n workflow** (see n8n.md)
4. **Test from admin** panel (Share button)
5. **Monitor dashboard** at `/admin/social-media`

Happy posting! 🚀
