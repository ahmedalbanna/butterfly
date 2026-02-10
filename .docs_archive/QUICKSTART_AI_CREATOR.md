# 🚀 Quick Start: AI Product Creator

## ✅ Current Status

- ✅ **Docker Services**: Running
  - PostgreSQL (Port 5432) - Healthy
  - Ollama (Port 11434) - Running
- ✅ **AI Model**: llava (4.7 GB) - Installed
- ✅ **Database**: 20 products seeded
- ✅ **Image Storage**: `/public/products/` - Ready

## 🎯 3-Minute Setup

### Step 1: Verify Services (Optional)
```bash
# Check all services are running
docker compose ps

# Should show:
# luxefinds-postgres - healthy
# luxefinds-ollama - running
```

### Step 2: Start Next.js
```bash
npm run dev
```

### Step 3: Access AI Product Creator
1. Open browser: `http://localhost:9002/admin`
2. Click **"AI Product Creator"** in sidebar
3. Or navigate directly: `http://localhost:9002/admin/products/ai-create`

## 📸 How to Create a Product

### Method 1: AI-Assisted (New!)
1. Click **"Choose File"** and select a product image
2. Preview appears
3. Click **"Analyze with AI"** button
4. Wait 10-30 seconds (first time may be slower)
5. Review AI suggestions:
   - ✅ Product name
   - ✅ Luxury description
   - ✅ Category
   - ✅ Suggested price
6. Complete required fields:
   - Materials (e.g., "18k Gold, Diamond")
   - Care instructions
7. Adjust price if needed
8. Click **"Create Product"**
9. Done! ✨

### Method 2: Manual
1. Go to `/admin/products`
2. Use existing product creation form

## 🖼️ Best Images for AI Analysis

### ✅ Good Images:
- Clear product photo
- Single item (not multiple products)
- Good lighting
- Minimal background
- High resolution
- Close-up view

### ❌ Avoid:
- Multiple products in one image
- Blurry or low quality
- Dark lighting
- Busy backgrounds
- Text overlays

## 💡 Tips

1. **First Run**: Initial analysis may take longer (30-40s)
2. **Subsequent Runs**: Faster (10-20s on CPU)
3. **Edit AI Suggestions**: All fields are editable
4. **Price**: AI suggests realistic luxury prices
5. **Description**: Uses LuxeFinds brand voice automatically

## 🎨 Example Workflow

```
1. Upload: jewelry-bracelet.jpg
   ↓
2. AI Analyzes (15 seconds)
   ↓
3. AI Suggests:
   - Name: "Elegant Gold Chain Bracelet"
   - Description: "An exquisite piece featuring meticulous..."
   - Category: Jewelry
   - Price: $450
   ↓
4. You Add:
   - Materials: "14k Yellow Gold"
   - Care: "Store in dry place..."
   ↓
5. Save → Product Created! 🎉
```

## 🔧 Troubleshooting

### AI Analysis Fails
```bash
# 1. Check Ollama is running
curl http://localhost:11434/

# 2. Check model exists
docker compose exec ollama ollama list

# 3. View logs
docker compose logs -f ollama

# 4. Restart if needed
docker compose restart ollama
```

### Slow Performance
- **Normal on CPU**: 10-30 seconds
- **First request**: May take longer
- **Solution**: Use smaller images (<5MB)

### "File too large" Error
- Resize image to <5MB
- Compress with online tools
- Use JPEG instead of PNG

## 📊 What Happens Behind the Scenes

```
Your Image
    ↓
[Upload to /public/products/]
    ↓
[Send to Ollama AI]
    ↓
[llava Model Analyzes]
    ↓
[Generate Luxury Description]
    ↓
[Return to UI]
    ↓
[You Review & Save]
    ↓
[Product in Database]
```

## 🎓 Next Steps

After creating products:

1. **View on Storefront**: `http://localhost:9002`
2. **Manage Products**: `/admin/products`
3. **Check Orders**: `/admin/orders`
4. **Test AI Chat**: Click chat button on homepage
5. **Test Voice Call**: Click phone button

## 📚 Learn More

- **Full Documentation**: `AI_PRODUCT_CREATOR.md`
- **Ollama Setup**: `OLLAMA_SETUP.md`
- **Database Guide**: `DATABASE_SETUP.md`

## 🆘 Need Help?

Common commands:
```bash
# Stop services
docker compose down

# Start services
docker compose up -d

# View all logs
docker compose logs -f

# Restart everything
docker compose restart

# Check service health
docker compose ps
```

---

**Ready to create your first AI-powered product?** 🚀

Navigate to: `http://localhost:9002/admin/products/ai-create`
