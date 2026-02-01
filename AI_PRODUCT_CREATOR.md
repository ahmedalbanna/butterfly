# 🎨 AI Product Creator - Feature Documentation

## Overview

The AI Product Creator is an automated system that allows LuxeFinds administrators to create luxury product listings by simply uploading an image. The AI analyzes the image and generates:

- **Product Name**: Elegant, sophisticated naming
- **Description**: Luxury-focused copy using refined language
- **Category**: Automatic classification (Jewelry, Watches, Bags, Accessories)
- **Price Suggestion**: Realistic pricing for luxury items

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Interface                          │
│              /admin/products/ai-create                       │
│                                                              │
│  [Upload Image] → [AI Analysis] → [Review & Complete]       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Server Action Layer                         │
│          generateProductFromImage()                          │
│                                                              │
│  • Save image to /public/products/                          │
│  • Call AI flow                                             │
│  • Return suggestions                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Genkit AI Flow                              │
│          productImageAnalyzerFlow                            │
│                                                              │
│  • Send image to Ollama                                     │
│  • Parse AI response                                        │
│  • Validate output                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Ollama Service                              │
│              Docker Container                                │
│                                                              │
│  Model: llava (vision)                                      │
│  Port: 11434                                                │
└─────────────────────────────────────────────────────────────┘
```

## Files Created

### Core Implementation

1. **`src/ai/flows/product-image-analyzer-flow.ts`**
   - Genkit flow for image analysis
   - Uses Ollama's llava vision model
   - Returns structured product data

2. **`src/app/actions/admin-products.ts`** (modified)
   - Added `generateProductFromImage()` server action
   - Handles file upload and storage
   - Calls AI flow and returns results

3. **`src/app/admin/products/ai-create/page.tsx`**
   - Complete admin UI for AI product creation
   - Image upload with preview
   - Form to complete product details
   - Real-time AI analysis feedback

4. **`src/ai/genkit.ts`** (modified)
   - Added Ollama plugin configuration
   - Configured llava model

5. **`src/components/admin/admin-sidebar.tsx`** (modified)
   - Added "AI Product Creator" navigation link

### Infrastructure

6. **`docker-compose.yml`** (modified)
   - Added Ollama service with GPU support

7. **`docker-compose.ollama.yml`**
   - CPU-only Ollama configuration
   - For systems without GPU

8. **`setup-ollama.sh`**
   - Automated setup script
   - Starts Ollama and downloads llava model

### Documentation

9. **`OLLAMA_SETUP.md`**
   - Complete Ollama setup guide
   - Troubleshooting tips
   - Performance optimization

## Usage Workflow

### 1. Setup (One-time)

```bash
# Run automated setup
./setup-ollama.sh

# Or manually:
docker compose up -d ollama
docker compose exec ollama ollama pull llava
```

### 2. Create Products

1. Navigate to **Admin Panel** → **AI Product Creator**
2. **Upload** a product image (jewelry, watch, bag, or accessory)
3. Click **"Analyze with AI"** button
4. **Review** AI-generated suggestions:
   - Product name
   - Description
   - Category
   - Suggested price
5. **Complete** remaining fields:
   - Adjust price if needed
   - Add materials (e.g., "18k Gold, Diamond")
   - Add care instructions
6. Click **"Create Product"** to save

### 3. Result

Product is immediately added to:
- Product catalog
- Admin products page
- Customer-facing store

## AI Prompt Engineering

The AI uses a carefully crafted prompt to maintain LuxeFinds' luxury brand voice:

```typescript
You are a luxury product expert for LuxeFinds, an exquisite 
boutique specializing in high-end jewelry, watches, bags, 
and accessories.

Key vocabulary: "exquisite", "meticulous", "timeless", "refined"
```

### Example Output

**Input**: Image of a gold bracelet

**AI Output**:
```json
{
  "name": "Elegant Gold Chain Bracelet",
  "description": "An exquisite piece featuring meticulous 
    craftsmanship in lustrous gold. This timeless bracelet 
    embodies refined elegance perfect for any occasion.",
  "category": "Jewelry",
  "suggestedPrice": 450
}
```

## Performance

| Environment | Model | Speed | Quality |
|-------------|-------|-------|---------|
| GPU | llava | 2-5s | Good |
| GPU | llava:13b | 5-10s | Excellent |
| CPU | llava | 10-30s | Good |
| CPU | llava:13b | 30-60s | Excellent |

## Customization

### Change Vision Model

Edit `src/ai/genkit.ts`:

```typescript
ollama({
  models: [
    {
      name: 'llava:13b',  // Use 13B model for better quality
      type: 'generate',
    }
  ],
  serverAddress: 'http://127.0.0.1:11434',
})
```

### Modify AI Prompt

Edit `src/ai/flows/product-image-analyzer-flow.ts`:

```typescript
const { text } = await ai.generate({
  model: 'ollama/llava',
  prompt: [
    {
      text: `Your custom prompt here...`
    },
    // ...
  ],
});
```

### Adjust Price Ranges

Update the prompt to include price guidance:

```typescript
4. A suggested price in USD (be realistic for luxury items)
   - Jewelry: $200-$5,000
   - Watches: $500-$10,000
   - Bags: $300-$3,000
   - Accessories: $100-$800
```

## Error Handling

The flow includes robust error handling:

1. **Image validation**: Checks file type
2. **AI fallback**: Returns default luxury description if parsing fails
3. **Network errors**: Graceful error messages to admin
4. **Model not found**: Clear instructions in logs

## Testing

### Manual Test

```bash
# 1. Ensure Ollama is running
curl http://localhost:11434/

# 2. Test model
docker compose exec ollama ollama list

# 3. Start dev server
npm run dev

# 4. Visit http://localhost:9002/admin/products/ai-create
```

### Test with Sample Images

Good test images:
- Clear product photos
- Single item (not multiple products)
- Good lighting
- Minimal background

## Troubleshooting

### "Failed to analyze image"

1. Check Ollama is running: `docker compose ps`
2. Check model is installed: `docker compose exec ollama ollama list`
3. View logs: `docker compose logs -f ollama`

### Slow performance

- Use GPU if available
- Consider smaller model for development
- Close other applications
- Increase Docker memory limit

### Wrong category suggestions

- AI may need clearer images
- Update prompt with better category descriptions
- Add training examples to prompt

## Future Enhancements

Potential improvements:

1. **Batch Processing**: Upload multiple images at once
2. **Image Enhancement**: Auto-crop, enhance, remove background
3. **Multi-language**: Generate descriptions in multiple languages
4. **A/B Testing**: Generate multiple description variations
5. **Learning**: Fine-tune model on LuxeFinds products
6. **Analytics**: Track which AI suggestions are accepted/modified

## Security Considerations

1. **File validation**: Only images allowed
2. **Storage limits**: Monitor /public/products/ size
3. **Rate limiting**: Consider adding for production
4. **Access control**: Admin-only access (no auth in demo)

## Cost Analysis

| Component | Cost | Notes |
|-----------|------|-------|
| Ollama | Free | Self-hosted, open source |
| llava model | Free | Open source vision model |
| Storage | Minimal | Local disk only |
| Compute | Hardware | Uses your own CPU/GPU |

**Total monthly cost**: $0 (self-hosted)

Compare to:
- OpenAI GPT-4 Vision: ~$0.01 per image
- Google Gemini Vision: ~$0.0025 per image

## Support

For issues or questions:

1. Review **OLLAMA_SETUP.md** for setup help
2. Check Docker logs: `docker compose logs -f ollama`
3. Verify model installation: `ollama list`
4. Test API directly: `curl http://localhost:11434/api/tags`

---

**Built with**: Next.js 15, Genkit, Ollama, llava Vision Model, Docker
