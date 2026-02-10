# n8n Integration for LuxeFinds

## 📋 Connection Information

### n8n Instance
- **URL**: https://vmi2935537.contaboserver.net/signin
- **Email**: admin@vmi2935537.contaboserver.net
- **Password**: If(exper)login@2025

### API Key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMGQzOGVhOS0wMjFjLTQ4NjAtYjdmMC1iYzVjNjYyNzkxYjciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5OTcwMjgyfQ.8JNFTSz9fdHJlp23bszs2pavpX8wQAJoIWZy0NZEPo0
```

### Users
- **Owner**: admin@vmi2935537.contaboserver.net
- **Member**: abdu.albanna@proton.me (Pending)


---

## 🏗️ Architecture Overview

LuxeFinds uses a **bidirectional webhook architecture** for social media automation:

1. **LuxeFinds → n8n**: Admin clicks "Share to Social" → triggers n8n webhook with product data
2. **n8n processes**: Workflow formats content and posts to selected platforms
3. **n8n → LuxeFinds**: Callback webhook updates post status (published/failed)

### Workflow Diagram
```
┌─────────────┐         ┌──────────┐         ┌─────────────────┐
│  LuxeFinds  │ ──────> │   n8n    │ ──────> │ Social Platforms│
│   Admin     │ Trigger │ Workflow │  Post   │ FB/IG/X/TikTok │
└─────────────┘         └──────────┘         └─────────────────┘
                              │
                              │ Callback
                              ▼
                        ┌─────────────┐
                        │  LuxeFinds  │
                        │  Database   │
                        └─────────────┘
```

---

## 🔧 Setup Instructions

### Step 1: Configure Environment Variables in LuxeFinds

Add to your `.env` file:

```env
# n8n Integration
N8N_WEBHOOK_URL=https://vmi2935537.contaboserver.net/webhook/luxefinds-social-publish
N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMGQzOGVhOS0wMjFjLTQ4NjAtYjdmMC1iYzVjNjYyNzkxYjciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5OTcwMjgyfQ.8JNFTSz9fdHJlp23bszs2pavpX8wQAJoIWZy0NZEPo0

# Callback Secret (generate a random string)
LUXEFINDS_CALLBACK_SECRET=your-secure-random-secret-here

# Your LuxeFinds URL
NEXT_PUBLIC_APP_URL=https://your-luxefinds-domain.com
```

### Step 2: Create n8n Workflow

1. **Login to n8n**: https://vmi2935537.contaboserver.net/signin
2. **Create New Workflow**: Name it "LuxeFinds Social Media Publisher"
3. **Add Webhook Trigger Node**:
   - Path: `/luxefinds-social-publish`
   - Method: `POST`
   - Authentication: `Header Auth` (use N8N_API_KEY)

### Step 3: Add Platform Nodes

For each platform, add conditional logic and platform-specific nodes:

#### Facebook/Instagram (Meta Graph API)
- **Node**: HTTP Request
- **URL**: `https://graph.facebook.com/v18.0/me/photos`
- **Method**: POST
- **Authentication**: OAuth2 (setup Meta App credentials)
- **Body**:
  ```json
  {
    "url": "{{ $json.imageUrl }}",
    "caption": "{{ $json.productName }} - {{ $json.description }}\n\nPrice: ${{ $json.price }}\n\n#LuxeFinds #Luxury"
  }
  ```

#### Twitter/X API
- **Node**: HTTP Request
- **URL**: `https://api.twitter.com/2/tweets`
- **Method**: POST
- **Authentication**: OAuth 1.0a
- **Body**:
  ```json
  {
    "text": "✨ {{ $json.productName }}\n\n{{ $json.description }}\n\nShop now: [link]\n\n#LuxeFinds"
  }
  ```

#### Pinterest API
- **Node**: HTTP Request
- **URL**: `https://api.pinterest.com/v5/pins`
- **Method**: POST
- **Authentication**: OAuth2
- **Body**:
  ```json
  {
    "link": "[product-page-url]",
    "title": "{{ $json.productName }}",
    "description": "{{ $json.description }}",
    "media_source": {
      "source_type": "image_url",
      "url": "{{ $json.imageUrl }}"
    }
  }
  ```

#### TikTok API
- **Note**: TikTok requires video content. Consider using TikTok Business API for photo posts or skip for now.

### Step 4: Add Callback Node

After posting to each platform, send status back to LuxeFinds:

**HTTP Request Node**:
- **URL**: `{{ $json.callbackUrl }}`
- **Method**: POST
- **Headers**:
  ```json
  {
    "Authorization": "Bearer YOUR_LUXEFINDS_CALLBACK_SECRET",
    "Content-Type": "application/json"
  }
  ```
- **Body**:
  ```json
  {
    "socialMediaPostId": "{{ $json.socialMediaPostIds[0].id }}",
    "platform": "{{ $json.socialMediaPostIds[0].platform }}",
    "status": "published",
    "postUrl": "{{ $node['Facebook Post'].json.post_url }}",
    "metadata": {
      "postId": "{{ $node['Facebook Post'].json.id }}"
    }
  }
  ```

---

## 📦 Payload Formats

### LuxeFinds → n8n (Trigger Payload)

```json
{
  "productId": "clx123abc",
  "productName": "Hermès Birkin Bag",
  "description": "Exquisite handcrafted leather masterpiece...",
  "price": 12500,
  "currency": "USD",
  "imageUrl": "https://luxefinds.com/products/birkin.jpg",
  "images": ["url1", "url2", "url3"],
  "category": "Handbags",
  "platforms": ["facebook", "instagram", "twitter"],
  "callbackUrl": "https://luxefinds.com/api/webhooks/n8n/callback",
  "socialMediaPostIds": [
    { "platform": "facebook", "id": "clx456def" },
    { "platform": "instagram", "id": "clx789ghi" }
  ]
}
```

### n8n → LuxeFinds (Callback Payload)

```json
{
  "socialMediaPostId": "clx456def",
  "platform": "facebook",
  "status": "published",
  "postUrl": "https://facebook.com/posts/123456",
  "metadata": {
    "postId": "123456",
    "timestamp": "2026-02-01T18:00:00Z"
  }
}
```

**For failures**:
```json
{
  "socialMediaPostId": "clx789ghi",
  "platform": "instagram",
  "status": "failed",
  "errorMessage": "Authentication failed: Invalid access token"
}
```

---

## 🔐 Platform API Setup

### Facebook & Instagram (Meta)
1. Create app at https://developers.facebook.com
2. Add **Instagram Graph API** and **Pages API**
3. Generate **User Access Token** with permissions:
   - `pages_manage_posts`
   - `instagram_content_publish`
4. Store token in n8n credentials

### Twitter/X
1. Apply for **Elevated Access** at https://developer.twitter.com
2. Create app and generate **API Key & Secret**
3. Generate **Access Token & Secret**
4. Store in n8n OAuth1 credentials

### Pinterest
1. Create app at https://developers.pinterest.com
2. Request **API Access**
3. Generate **OAuth2 credentials**
4. Store in n8n

### TikTok
1. Apply for **TikTok for Business** at https://business-api.tiktok.com
2. Requires video content (skip for now if photo-only)

---

## 🐛 Troubleshooting

### Issue: "n8n configuration missing"
**Solution**: Ensure `N8N_WEBHOOK_URL` and `N8N_API_KEY` are set in `.env`

### Issue: "Unauthorized" callback error
**Solution**: Verify `LUXEFINDS_CALLBACK_SECRET` matches in both LuxeFinds and n8n workflow

### Issue: "Post status stuck on pending"
**Solution**: Check n8n workflow execution logs for errors. Ensure callback node is executing.

### Issue: Platform API authentication failures
**Solution**: 
- Refresh OAuth tokens in n8n credentials
- Verify API app permissions
- Check rate limits

### Issue: Image upload fails
**Solution**: Ensure image URLs are publicly accessible (not localhost in production)

---

## 📊 Monitoring & Analytics

- **LuxeFinds Admin**: Visit `/admin/social-media` to view post history and stats
- **n8n Dashboard**: Monitor workflow executions at https://vmi2935537.contaboserver.net/workflows
- **Platform Analytics**: Check native platform insights for engagement metrics

---

## 🚀 Future Enhancements

- [ ] Add scheduling support (future post dates)
- [ ] Video content support for TikTok and Reels
- [ ] AI-generated captions per platform
- [ ] A/B testing for post variations
- [ ] Engagement tracking and analytics dashboard
- [ ] Multi-language post support

---
─── Implementation Complete ───────────────────────────────────────────────────────────────────────────────────────────── 
Original plan below:

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                  n8n Social Media Automation Implementation Plan                                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛


                                                       Overview

Expand n8n.md documentation with multi-platform social media automation guide and implement webhook-based publishing
feature in LuxeFinds admin panel.


                                                   Files to Modify

                                           1. n8n.md - Expand Documentation

 • Keep existing credentials section
 • Add n8n workflow architecture for multi-platform posting
 • Document webhook endpoint structure and payload format
 • Include Meta Graph API, Twitter/X API, Pinterest API, TikTok API setup steps
 • Add workflow JSON examples for each platform
 • Include troubleshooting section

                                      2. prisma/schema.prisma - Database Schema

 • Add SocialMediaPost model to track published posts
 • Add SocialMediaConfig model for storing platform credentials
 • Add fields to Product model for social media metadata

                                3. src/app/actions/admin-products.ts - Server Actions

 • Add publishProductToSocial() action
 • Add getSocialMediaConfig() action
 • Add updateSocialMediaConfig() action
 • Add getSocialMediaPosts() action for history

                                    4. src/app/admin/products/page.tsx - Admin UI

 • Add social media publishing section to product form
 • Add multi-platform checkboxes (Facebook, Instagram, Twitter, Pinterest, TikTok)
 • Add content format selectors (Feed, Story, Reel)
 • Add "Publish to Social" button with loading states
 • Add social media post history display

                                   5. src/app/admin/social-media/ - New Admin Page

 • Create page.tsx for social media configuration
 • UI for managing platform credentials
 • UI for viewing post history across all products
 • Analytics dashboard for social posts

                               6. src/app/api/webhooks/n8n/route.ts - New API Endpoint

 • Create POST handler for n8n webhook trigger
 • Validate requests with API key from n8n.md
 • Format product data for n8n workflow
 • Handle response and update database


                                                 Implementation Steps

 1 Update database schema and run migration
 2 Create webhook API endpoint
 3 Add server actions for social media operations
 4 Update admin products page UI
 5 Create social media configuration admin page
 6 Expand n8n.md with complete workflow guide
 7 Test end-to-end workflow


                                                     Key Features

 • Multi-platform support (Facebook, Instagram, Twitter/X, Pinterest, TikTok)
 • Flexible content formats (Feed, Story, Reel, Tweet, Pin)
 • Post history tracking with status
 • Webhook-based n8n integration
 • Secure credential management
 • Extensible architecture for adding new platforms