# 🤖 AI Setup Guide

Complete setup guide for LuxeFinds AI features including Ollama and the AI Product Creator.

## Overview

LuxeFinds uses two main AI systems:

1. **Genkit AI** - Cloud-based AI for chat and voice interactions (Google Gemini 2.5 Flash)
2. **Ollama + llava** - Local vision AI for product image analysis

## Genkit AI Setup

### Prerequisites

```bash
npm install @genkit-ai/genkit @genkit-ai/google-genkit
```

### Environment Configuration

Add to `.env`:

```bash
GEMINI_API_KEY=your_gemini_api_key
```

Get your API key from [Google AI Studio](https://aistudio.google.com/apikey).

### Genkit Flows

Genkit flows are located in `src/ai/flows/`:

- `ai-stylist-chat-flow.ts` - Chat with AI fashion consultant
- `product-voice-inquiry-flow.ts` - Voice call interaction
- `product-image-analyzer-flow.ts` - Image analysis (primary)
- `generate-product-model-photo.ts` - Generate lifestyle photos
- `generate-accessory-suggestions.ts` - Product recommendations

### Testing Genkit

```bash
npm run dev

# Chat API will be available at /api/chat
# Voice API will be available at /api/calls
```

## Ollama & AI Product Creator

The AI Product Creator allows admins to upload product images and automatically generate:
- Product name and description
- Category classification
- Luxury price suggestions
- Material recommendations

### Quick Start (3 minutes)

```bash
# 1. Start Ollama service
docker compose up -d ollama

# 2. Pull the llava model
docker compose exec ollama ollama pull llava

# 3. Access AI Product Creator
# Navigate to: http://localhost:9002/admin/products/ai-create
```

### Detailed Setup

#### Step 1: Start Ollama Container

```bash
# Option A: Using docker-compose (recommended)
docker compose up -d ollama

# Option B: Manual Docker
docker run -d \
  --name ollama \
  -p 11434:11434 \
  -v ollama_data:/root/.ollama \
  ollama/ollama:latest
```

#### Step 2: Pull the llava Model

```bash
# Using docker-compose
docker compose exec ollama ollama pull llava

# Or direct docker
docker exec ollama ollama pull llava
```

**First time setup note:** The llava model is ~4.7GB. Initial download may take 5-15 minutes depending on internet speed.

#### Step 3: Verify Installation

```bash
# Check if model is installed
docker compose exec ollama ollama list

# Should output:
# NAME            ID              SIZE      MODIFIED
# llava:latest    abc123def...    4.7 GB    2 minutes ago
```

#### Step 4: Test Ollama

```bash
# Test API endpoint
curl http://localhost:11434/api/tags

# Or test with image analysis
curl http://localhost:11434/api/generate \
  -d '{
    "model": "llava",
    "prompt": "Describe this image",
    "stream": false
  }'
```

### Using AI Product Creator

#### Access the Feature

1. Log in to admin panel: `/admin`
2. Click **"AI Product Creator"** in sidebar
3. Or navigate directly: `/admin/products/ai-create`

#### Create a Product

1. **Upload Image**
   - Click "Choose File" button
   - Select a product image
   - Image preview appears

2. **Analyze with AI**
   - Click "Analyze with AI" button
   - Wait 10-30 seconds for analysis
   - AI generates suggestions:
     - Product name
     - Luxury description
     - Category
     - Suggested price

3. **Review & Complete**
   - All fields are editable
   - Add materials (e.g., "18k Gold, Diamond")
   - Add care instructions
   - Adjust price if needed

4. **Save Product**
   - Click "Create Product"
   - Product is saved to database
   - Appears on storefront

#### Best Practices

**✅ Good Images:**
- Clear product photo
- Single item (not multiple)
- Good lighting
- Minimal background
- High resolution (1MB-5MB)
- Close-up view

**❌ Avoid:**
- Multiple products in one image
- Blurry or low quality
- Dark lighting
- Busy backgrounds
- Text overlays
- Very large files (>10MB)

### Performance Tips

| Scenario | Time | Notes |
|----------|------|-------|
| First analysis | 30-40s | Model loads to memory |
| Subsequent analyses | 10-20s | Model stays in memory |
| CPU-only machine | 20-60s | Depends on processor |
| GPU-enabled | 5-15s | Much faster with CUDA/Metal |

**Tips for faster performance:**
1. Resize images to under 5MB
2. Use JPEG format instead of PNG
3. Keep Ollama running (don't restart between analyses)
4. Consider GPU acceleration if available

### GPU Acceleration (Optional)

#### CUDA (NVIDIA GPUs)

```bash
# Install NVIDIA Docker runtime
# Then update docker-compose.yml:

services:
  ollama:
    image: ollama/ollama:latest
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

#### Metal (Apple Silicon)

Ollama automatically detects and uses Metal on Apple Silicon Macs. No additional setup needed.

### Advanced Configuration

#### Custom Model Parameters

Edit environment variables in docker-compose.yml:

```yaml
services:
  ollama:
    environment:
      - OLLAMA_NUM_PARALLEL=2  # Parallel requests
      - OLLAMA_NUM_THREAD=8    # Thread count
```

#### Different Models

To use a different vision model:

```bash
# List available models
docker compose exec ollama ollama list

# Pull a different model
docker compose exec ollama ollama pull phi
docker compose exec ollama ollama pull neural-chat

# Update application to use the model
# (Modify src/app/actions/admin-products.ts)
```

Available vision models:
- `llava:latest` - Recommended, balanced quality/speed
- `llava:7b` - Smaller, faster
- `llava:13b` - Larger, higher quality

### Troubleshooting

#### AI Analysis Fails

```bash
# 1. Check Ollama is running
docker compose ps ollama

# 2. Check model is installed
docker compose exec ollama ollama list

# 3. Test API directly
curl http://localhost:11434/api/tags

# 4. View logs
docker compose logs -f ollama

# 5. Restart if needed
docker compose restart ollama
```

#### Slow Performance

**Normal performance:**
- CPU-only: 10-30 seconds per image
- First request: May take longer
- Subsequent requests: Faster

**If slower than expected:**
1. Check CPU usage: `docker stats ollama`
2. Reduce image size
3. Close other applications
4. Check system memory: `docker compose exec ollama ollama show llava`

#### "File Too Large" Error

```bash
# Resize image to under 5MB
# Using ImageMagick:
convert large-image.jpg -resize 50% resized-image.jpg

# Using online tools:
# https://squoosh.app/
# https://imageoptimizer.com/
```

#### Model Download Fails

```bash
# Check internet connection
ping ollama.ai

# Clear cache and retry
docker compose exec ollama rm -rf /root/.ollama/models
docker compose exec ollama ollama pull llava

# Or restart container
docker compose restart ollama
docker compose exec ollama ollama pull llava
```

#### Out of Memory

```bash
# Check memory usage
docker stats ollama

# Reduce parallel requests in docker-compose.yml:
environment:
  - OLLAMA_NUM_PARALLEL=1

# Or increase Docker memory limit
```

### Integration Details

The AI Product Creator is implemented in:

- **Frontend:** `src/app/admin/products/ai-create/page.tsx`
- **API Route:** `src/app/api/admin/products/analyze-with-ai` (creates this)
- **Server Action:** `src/app/actions/admin-products.ts` - `analyzeProductImage` function
- **AI Flow:** `src/ai/flows/product-image-analyzer-flow.ts`

### Environment Variables

For AI Product Creator, ensure these are set in `.env`:

```bash
# Ollama
OLLAMA_URL=http://localhost:11434

# Gemini (for natural language processing)
GEMINI_API_KEY=your_gemini_api_key
```

## Disabling AI Features (Optional)

To disable AI features temporarily:

1. Stop Ollama: `docker compose stop ollama`
2. Comment out AI-related routes in Next.js
3. Fallback to manual product creation

To re-enable:
1. Start Ollama: `docker compose up -d ollama`
2. Uncomment routes
3. Access AI Product Creator

## Production Considerations

⚠️ **For production deployment:**

1. **Model Size:** llava is 4.7GB. Ensure adequate storage
2. **Performance:** Consider dedicated ML server
3. **Scaling:** Each instance needs its own Ollama
4. **Monitoring:** Track API response times and model performance
5. **Updates:** Plan for model version updates
6. **Resources:** Allocate sufficient CPU/GPU for inference

See `docs/deployment/` for production deployment guidelines.

## Next Steps

1. **Test AI Product Creator:** `/admin/products/ai-create`
2. **Create a test product:** Upload an image and analyze
3. **Customize prompts:** Edit `src/ai/flows/product-image-analyzer-flow.ts`
4. **Integrate other features:** Chat and voice call
5. **Monitor performance:** Check logs and metrics

## Learning Resources

- [Ollama Documentation](https://ollama.ai/)
- [LLaVA Model](https://github.com/haotian-liu/LLaVA)
- [Genkit Documentation](https://firebase.google.com/docs/genkit)
- [Google Gemini API](https://ai.google.dev/)

---

For troubleshooting specific AI features, see `docs/troubleshooting/`.
