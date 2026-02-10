# 🎨 Virtual Try-On Admin Feature

## Overview

The Virtual Try-On feature allows LuxeFinds administrators to generate professional model photos showing accessories being worn by luxury models. This feature uses AI (Stable Diffusion via Ollama) to create lifestyle images for marketing purposes.

## ✨ Features

- **AI-Powered Generation**: Automatically generates images of models wearing accessories
- **Multiple Photography Styles**: Choose from luxury, elegant, editorial, or casual styles
- **Category-Aware Placement**: AI understands where accessories should be positioned (rings on hands, necklaces on neck, etc.)
- **Image Management**: Save multiple generated images per product and delete unwanted ones
- **Real-Time Preview**: Preview generated images before saving to product

## 🚀 Setup

### Prerequisites

1. **Ollama Service Running**: Make sure Ollama is installed and running
2. **Stable Diffusion Model**: The model must be installed in Ollama

### Installation

Run the setup script to install both required models:

```bash
./setup-ollama.sh
```

This will:
- Start the Ollama service
- Pull the `llava` model (for product image analysis)
- Pull the `stable-diffusion` model (for generating model photos)

### Manual Installation

If you prefer to install manually:

```bash
# Start Ollama
docker compose up -d ollama

# Pull the models
docker compose exec ollama ollama pull llava
docker compose exec ollama ollama pull stable-diffusion
```

## 📖 Usage Guide

### Accessing the Feature

1. Log in to the admin panel at `/admin`
2. Navigate to **Products** from the sidebar
3. Find the product you want to generate a model photo for
4. Click the **User icon** button in the Actions column

### Generating Model Photos

1. **Select Photography Style**:
   - **Luxury**: Professional studio lighting, clean elegant background, ultra high-end boutique photography
   - **Elegant**: Soft lighting, neutral background, refined and sophisticated atmosphere
   - **Editorial**: Dramatic lighting, artistic composition, high fashion magazine quality
   - **Casual**: Natural lighting, lifestyle setting, relaxed and approachable feel

2. **Click "Generate Model Photo"**:
   - The AI will analyze the product category and generate an appropriate image
   - Generation takes 30-60 seconds depending on your system
   - Progress is shown with a loading indicator

3. **Review Generated Image**:
   - Preview the generated image
   - Check the AI prompt used for generation
   - Decide if you want to save it or regenerate

4. **Save or Regenerate**:
   - **Save to Product**: Adds the image to the product's model images collection
   - **Regenerate**: Creates a new image with the same settings (results will vary)
   - **Close**: Discard the generated image without saving

### Managing Model Images

- **View Existing Images**: All saved model photos are displayed in the dialog
- **Delete Images**: Hover over an image and click the X button to remove it
- **Multiple Images**: You can generate and save multiple model photos per product

## 🎯 How It Works

### Category-Aware Positioning

The AI automatically determines the best way to showcase each accessory type:

| Category | AI Positioning |
|----------|---------------|
| Rings | Elegant hand modeling pose |
| Bracelets | Graceful arm position showing wrist |
| Necklaces | Sophisticated portrait with décolletage |
| Earrings | Side profile beauty shot |
| Anklets | Refined leg pose |
| Belts | Fashion editorial waist shot |
| Watches | Luxury timepiece wrist display |

### Photography Styles

Each style produces different aesthetic results:

- **Luxury** (Recommended): Creates ultra high-end boutique photography with professional studio lighting and clean backgrounds
- **Elegant**: Produces refined, sophisticated images with soft lighting
- **Editorial**: Generates dramatic, artistic compositions for magazine-quality results
- **Casual**: Creates natural, approachable lifestyle images

## 💾 Storage

Generated images are stored in:
- **File System**: `/public/model-images/model-{productId}-{timestamp}.png`
- **Database**: URLs stored in the `modelImages` field of the Product model
- **Format**: PNG files (base64 encoded during generation, converted to files on save)

## 🔧 Technical Details

### AI Flow

The generation process uses:
1. **Model**: `ollama/stable-diffusion`
2. **Input**: Product name, category, description, and selected style
3. **Output**: Base64-encoded PNG image
4. **Processing Time**: 30-60 seconds per image

### Database Schema

```prisma
model Product {
  // ... other fields
  modelImages String[] @default([]) // AI-generated model photos
}
```

### Server Actions

- `generateModelPhoto(productId, style)`: Generates a new model photo
- `saveProductModelImage(productId, imageBase64)`: Saves generated image to product
- `deleteProductModelImage(productId, imageUrl)`: Removes a model image from product

## ⚠️ Limitations

1. **Performance**: Image generation is compute-intensive and takes 30-60 seconds
2. **GPU Recommended**: Faster generation with GPU support (CPU works but slower)
3. **Model Size**: Stable Diffusion model is ~3.5GB (requires sufficient disk space)
4. **Quality Variance**: Generated images may vary in quality; regeneration may be needed
5. **Ollama Required**: Feature only works when Ollama service is running

## 🐛 Troubleshooting

### "Failed to generate model photo"

**Possible Causes**:
- Ollama service not running
- Stable Diffusion model not installed
- Insufficient system resources

**Solutions**:
```bash
# Check if Ollama is running
docker compose ps

# Verify models are installed
docker compose exec ollama ollama list

# Restart Ollama if needed
docker compose restart ollama

# Pull model if missing
docker compose exec ollama ollama pull stable-diffusion
```

### Generation Takes Too Long

- **With GPU**: Should take 20-30 seconds
- **Without GPU**: Can take 45-60 seconds or more
- **Tip**: Be patient, check browser console for progress

### Images Look Poor Quality

- Try regenerating with a different style
- Luxury and Editorial styles typically produce best results
- Consider using the product image analysis feature to improve product descriptions (better descriptions = better generated images)

## 🎨 Best Practices

1. **Start with Luxury Style**: It's optimized for high-end accessories
2. **Generate Multiple Variations**: Create 2-3 images and keep the best
3. **Use Descriptive Product Info**: Better product descriptions lead to better AI-generated images
4. **Review Before Saving**: Always preview and confirm quality before saving
5. **Regular Cleanup**: Delete poor-quality images to keep product pages clean

## 📊 Use Cases

### Marketing Materials
- Generate lifestyle images for social media posts
- Create carousel images showing products being worn
- Produce email campaign visuals

### Product Pages
- Add "lifestyle" images alongside standard product photos
- Show customers how accessories look when worn
- Enhance product listings with professional model photos

### A/B Testing
- Generate multiple styles and test which converts better
- Compare editorial vs. luxury photography styles
- Test different model poses and compositions

## 🔮 Future Enhancements

Potential improvements for future versions:
- Custom prompt editing for advanced users
- Batch generation for multiple products
- Integration with customer-facing virtual try-on
- Background customization options
- Model diversity settings
- Image upscaling and enhancement

## 📝 Notes

- Generated images are AI-created and may not be 100% photorealistic
- Always review generated content before using in production
- Consider legal implications of AI-generated imagery in your region
- Model photos complement but don't replace professional photography
