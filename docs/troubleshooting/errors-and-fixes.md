# 🚨 Common Errors & Solutions

This document catalogs common errors you might encounter in LuxeFinds and their solutions.

## Table of Contents

1. [Database Errors](#database-errors)
2. [Ollama & AI Errors](#ollama--ai-errors)
3. [Docker Errors](#docker-errors)
4. [Build & Runtime Errors](#build--runtime-errors)
5. [Image Upload Errors](#image-upload-errors)
6. [Network Errors](#network-errors)

---

## Database Errors

### ❌ Error: "Foreign key constraint failed"

```
PrismaClientKnownRequestError: Foreign key constraint failed on the field
```

**Cause:** Trying to delete products that have related order items.

**Solution:**
```bash
# Clear related data first in seed script
await prisma.orderItem.deleteMany();
await prisma.order.deleteMany();
await prisma.product.deleteMany();
```

**Prevention:** The seed script now handles this automatically.

---

### ❌ Error: "Connection refused to localhost:5432"

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Cause:** PostgreSQL is not running.

**Solution:**
```bash
# Start PostgreSQL
docker compose up -d postgres

# Verify it's running
docker compose ps

# Check logs if needed
docker compose logs postgres
```

---

### ❌ Error: "Invalid DATABASE_URL"

```
Error: P1001: Can't reach database server
```

**Cause:** Incorrect database connection string.

**Solution:** Check `.env` file has correct credentials:
```env
DATABASE_URL="postgresql://luxefinds_admin:luxefinds_secure_pass_2026@localhost:5432/luxefinds"
```

---

### ❌ Error: "Table does not exist"

```
Error: The table `main.Product` does not exist
```

**Cause:** Database schema not applied.

**Solution:**
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial data
npm run db:seed
```

---

## Ollama & AI Errors

### ❌ Error: "Connection refused to localhost:11434"

```
Error: connect ECONNREFUSED 127.0.0.1:11434
```

**Cause:** Ollama service is not running.

**Solution:**
```bash
# Check if Ollama is running
docker compose ps

# Start Ollama
docker compose up -d ollama

# Or use CPU-only version
docker compose -f docker-compose.ollama.yml up -d

# Verify it's accessible
curl http://localhost:11434/
```

---

### ❌ Error: "Model 'llava' not found"

```
Error: model 'llava' not found, try pulling it first
```

**Cause:** llava model not downloaded.

**Solution:**
```bash
# Pull the model
docker compose exec ollama ollama pull llava

# Verify installation
docker compose exec ollama ollama list

# Should show: llava:latest
```

---

### ❌ Error: "AI analysis failed"

```
Error: Failed to analyze image
```

**Possible Causes & Solutions:**

1. **Ollama not ready:**
   ```bash
   # Wait 30 seconds after starting Ollama
   sleep 30
   curl http://localhost:11434/
   ```

2. **Model not loaded:**
   ```bash
   # Check model status
   docker compose exec ollama ollama list
   ```

3. **Out of memory:**
   ```bash
   # Check Docker memory
   docker stats
   
   # Increase Docker memory limit
   # Docker Desktop > Settings > Resources > Memory
   ```

4. **Invalid image:**
   - Check file is actually an image
   - Try a different image format (JPEG/PNG)
   - Reduce image size (<5MB)

---

### ❌ Error: "GPU not available" (when using docker-compose.yml)

```
Error: could not select device driver "" with capabilities: [[gpu]]
```

**Cause:** NVIDIA Docker runtime not installed or no GPU available.

**Solution:** Use CPU-only version:
```bash
# Stop GPU version
docker compose down

# Use CPU-only version
docker compose -f docker-compose.ollama.yml up -d
```

---

### ❌ Error: "Parsing AI response failed"

```
Error: No JSON found in response
```

**Cause:** AI returned malformed JSON or unexpected format.

**Solution:** The flow has automatic fallback. Check logs:
```bash
# View detailed logs
docker compose logs -f ollama

# The system will return default values:
{
  "name": "Luxury Item",
  "description": "An exquisite piece...",
  "category": "Accessories",
  "suggestedPrice": 250
}
```

**Prevention:** Already handled in code with try-catch and fallback.

---

## Docker Errors

### ❌ Error: "Docker daemon not running"

```
Error: Cannot connect to the Docker daemon
```

**Solution:**
```bash
# Start Docker Desktop (macOS/Windows)
# Or on Linux:
sudo systemctl start docker
```

---

### ❌ Error: "Port already in use"

```
Error: bind: address already in use
```

**Cause:** Port 5432 or 11434 already in use.

**Solution:**
```bash
# Find process using the port
lsof -i :5432
lsof -i :11434

# Kill the process (replace PID)
kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "5433:5432"  # Use different host port
```

---

### ❌ Error: "Volume not found"

```
Error: volume not found
```

**Solution:**
```bash
# Remove and recreate volumes
docker compose down -v
docker compose up -d
```

**⚠️ Warning:** This will delete all data!

---

### ❌ Error: "Image pull failed"

```
Error: failed to pull image
```

**Cause:** Network issues or Docker Hub unavailable.

**Solution:**
```bash
# Retry pull
docker compose pull

# Or pull manually
docker pull postgres:16-alpine
docker pull ollama/ollama:latest

# Then start services
docker compose up -d
```

---

## Build & Runtime Errors

### ❌ Error: "Module not found: 'genkitx-ollama'"

```
Error: Cannot find module 'genkitx-ollama'
```

**Solution:**
```bash
# Install dependencies
npm install

# If still fails, install specifically
npm install genkitx-ollama@1.20.0 --legacy-peer-deps
```

---

### ❌ Error: "GEMINI_API_KEY not found"

```
Error: GEMINI_API_KEY is required
```

**Solution:** Add to `.env` file:
```env
GEMINI_API_KEY=your_api_key_here
```

Get key from: https://aistudio.google.com/app/apikey

---

### ❌ Error: "Port 9002 already in use"

```
Error: Port 9002 is already in use
```

**Solution:**
```bash
# Option 1: Stop the other process
lsof -i :9002
kill -9 <PID>

# Option 2: Use different port
npm run dev -- -p 9003
```

---

### ❌ Error: "Type error in genkit.ts"

```
Type 'typeof ollama' is not assignable to type 'Plugin'
```

**Cause:** Version mismatch between Genkit packages.

**Solution:**
```bash
# Install matching versions
npm install genkitx-ollama@1.20.0 --legacy-peer-deps

# Verify versions match
npm list | grep genkit
```

---

## Image Upload Errors

### ❌ Error: "Body exceeded 1MB limit"

```
Error: Body exceeded 1 MB limit.
statusCode: 413
```

**Cause:** Next.js server action body size limit (default 1MB).

**Solution:** Already fixed in `next.config.ts`:
```typescript
serverActions: {
  bodySizeLimit: '10mb', // Increased for image uploads
}
```

**Restart dev server** after changing config:
```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

### ❌ Error: "File too large"

```
Error: File size exceeds limit
```

**Solution:**
- Maximum allowed: 10MB (configured in next.config.ts)
- Recommended: 5MB or less for better performance
- Compress image before upload
- Use online tools: TinyPNG, Squoosh

---

### ❌ Error: "Invalid file type"

```
Error: File must be an image
```

**Solution:**
- Only upload: JPEG, PNG, WebP, GIF
- Check file extension matches actual type
- Try converting to JPEG

---

### ❌ Error: "Failed to save image"

```
Error: ENOENT: no such file or directory, open '/public/products/...'
```

**Solution:**
```bash
# Create directory
mkdir -p public/products

# Check permissions
chmod 755 public/products

# Verify in code (already handled):
await mkdir(productsDir, { recursive: true });
```

---

### ❌ Error: "Image URL not found (404)"

```
GET /products/image.jpg 404
```

**Cause:** Image not in public directory or incorrect path.

**Solution:**
```bash
# Verify image exists
ls -la public/products/

# Check URL format
# Should be: /products/filename.jpg
# Not: /public/products/filename.jpg
```

---

## Network Errors

### ❌ Error: "CORS error in API route"

```
Access to fetch blocked by CORS policy
```

**Solution:** Already handled in Next.js API routes. If issue persists:

```typescript
// Add to API route
export async function POST(request: Request) {
  const response = NextResponse.json(data);
  response.headers.set('Access-Control-Allow-Origin', '*');
  return response;
}
```

---

### ❌ Error: "WebSocket connection failed"

```
WebSocket connection to 'ws://localhost:9002/' failed
```

**Cause:** WebSocket support not available or server issue.

**Solution:**
- This is for live chat feature
- Ensure Next.js dev server is running
- Check firewall settings
- Try restarting dev server

---

## Performance Issues

### ⚠️ Issue: "AI analysis very slow"

**Causes & Solutions:**

1. **Running on CPU:** Normal (10-30 seconds)
   - Consider GPU if available
   - Use smaller model for testing

2. **First request slow:** Model loading
   - Keep Ollama running
   - Subsequent requests faster

3. **Large images:** 
   ```bash
   # Resize before upload
   # Recommended: 800x800px max
   ```

4. **Low memory:**
   ```bash
   # Check available memory
   docker stats
   
   # Increase Docker memory limit
   # Docker Desktop > Resources > Memory > 4GB+
   ```

---

### ⚠️ Issue: "Page load slow"

**Solutions:**

1. **Large images:**
   - Optimize images in `/public/products/`
   - Use WebP format
   - Add image optimization

2. **Database queries:**
   ```bash
   # Check query performance
   npm run db:studio
   ```

3. **Development mode:**
   - Normal in dev mode
   - Production build is faster:
   ```bash
   npm run build
   npm start
   ```

---

## Debugging Tips

### Enable Verbose Logging

```bash
# Ollama logs
docker compose logs -f ollama

# PostgreSQL logs
docker compose logs -f postgres

# Next.js logs
npm run dev

# Check all services
docker compose ps
```

### Test Individual Components

```bash
# Test database connection
docker compose exec postgres psql -U luxefinds_admin -d luxefinds

# Test Ollama
curl http://localhost:11434/api/tags

# Test model
docker compose exec ollama ollama run llava "describe this image"
```

### Reset Everything

```bash
# Nuclear option - reset all services
docker compose down -v
rm -rf node_modules package-lock.json
npm install
docker compose up -d
npm run db:generate
npm run db:push
npm run db:seed
```

**⚠️ Warning:** Deletes all data!

---

## Getting Help

If your issue isn't listed here:

1. **Check logs:**
   ```bash
   docker compose logs -f
   npm run dev
   ```

2. **Verify services:**
   ```bash
   docker compose ps
   curl http://localhost:11434/
   curl http://localhost:9002/
   ```

3. **Review documentation:**
   - `OLLAMA_SETUP.md`
   - `AI_PRODUCT_CREATOR.md`
   - `DATABASE_SETUP.md`

4. **Check versions:**
   ```bash
   node --version  # Should be 18+
   npm --version
   docker --version
   ```

---

## Prevention Best Practices

1. **Always check services before starting:**
   ```bash
   docker compose ps
   ```

2. **Keep dependencies updated:**
   ```bash
   npm update
   ```

3. **Monitor Docker resources:**
   ```bash
   docker stats
   ```

4. **Regular backups:**
   ```bash
   docker compose exec postgres pg_dump -U luxefinds_admin luxefinds > backup.sql
   ```

5. **Use environment variables:**
   - Never commit `.env` file
   - Keep sensitive data secure

---

**Last Updated:** 2026-01-31

For additional help, check the documentation files or review service logs.
# 🔧 Fixes Applied

## Issue: Image Upload Body Size Limit Error

### Problem
When uploading product images via the AI Product Creator, users encountered:

```
Error: Body exceeded 1 MB limit.
statusCode: 413
```

This prevented images larger than 1MB from being uploaded for AI analysis.

### Root Cause
Next.js 15 has a default body size limit of **1MB** for server actions. High-quality product images often exceed this limit.

### Solution Applied

**File:** `next.config.ts`

Added configuration to increase the body size limit:

```typescript
serverActions: {
  bodySizeLimit: '10mb', // Allow up to 10MB for product images
}
```

### Impact
- ✅ Users can now upload images up to **10MB**
- ✅ Supports high-quality product photography
- ✅ Better user experience for AI Product Creator
- ✅ Recommended limit: 5MB for optimal performance

### Testing
To test the fix:

1. **Restart the dev server** (required for config changes):
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Upload a large image**:
   - Navigate to: `http://localhost:9002/admin/products/ai-create`
   - Upload an image between 1-10MB
   - Should work without errors now

3. **Verify the upload**:
   - Image should be saved to `/public/products/`
   - AI analysis should proceed normally

### Additional Improvements

#### Error Documentation
Created **`ERRORS.md`** with comprehensive troubleshooting guide covering:
- Database errors
- Ollama & AI errors
- Docker errors
- Build & runtime errors
- Image upload errors
- Network errors
- Performance issues

#### Best Practices Added
- Recommend 5MB max for better performance
- Image optimization tips
- Compression tool suggestions

### Files Modified
1. `next.config.ts` - Increased body size limit
2. `ERRORS.md` - Added comprehensive error documentation
3. `errors.md` - Removed (was just a log file)

---

## Configuration Reference

### Current Body Size Limits

| Type | Limit | Purpose |
|------|-------|---------|
| Server Actions | 10MB | Image uploads for AI Product Creator |
| Recommended Image Size | 5MB | Optimal performance |
| Maximum Image Size | 10MB | Hard limit |

### Image Upload Guidelines

**Recommended Image Specs for AI Analysis:**
- **Format**: JPEG (best), PNG, WebP
- **Size**: 800x800 to 1920x1920 pixels
- **File Size**: 1-5MB (optimal), max 10MB
- **Quality**: High enough to see product details
- **Background**: Clean, minimal preferred

### Image Optimization Tips

Before uploading large images:

```bash
# Use online tools:
- TinyPNG (https://tinypng.com)
- Squoosh (https://squoosh.app)
- ImageOptim (Mac)

# Or command line:
- convert image.jpg -quality 85 -resize 1920x1920 optimized.jpg
```

---

## Next Steps

### For Developers

1. **Restart dev server** if currently running:
   ```bash
   npm run dev
   ```

2. **Test the AI Product Creator**:
   - Upload various image sizes
   - Verify AI analysis works
   - Check images save correctly

3. **Monitor performance**:
   - Large images take longer to upload
   - AI analysis time varies with image size
   - Consider adding progress indicators

### For Production

Consider adding:

1. **Client-side image validation**:
   ```typescript
   if (file.size > 10 * 1024 * 1024) {
     toast.error('Image too large. Max 10MB.');
     return;
   }
   ```

2. **Image compression on upload**:
   - Auto-resize to max dimensions
   - Compress before saving
   - Convert to WebP format

3. **Progress indicators**:
   - Upload progress bar
   - AI analysis status
   - Time estimates

4. **Rate limiting**:
   - Prevent abuse
   - Limit uploads per minute
   - Queue large files

---

## Validation Checklist

- [x] Configuration updated in `next.config.ts`
- [x] Body size limit increased to 10MB
- [x] Error documentation created
- [x] Best practices documented
- [ ] Dev server restarted (user must do this)
- [ ] Large image upload tested
- [ ] AI analysis verified with large images

---

## Related Documentation

- **Setup Guide**: `QUICKSTART_AI_CREATOR.md`
- **Error Reference**: `ERRORS.md`
- **Feature Docs**: `AI_PRODUCT_CREATOR.md`
- **Ollama Setup**: `OLLAMA_SETUP.md`

---

**Status**: ✅ Fix applied and documented  
**Testing Required**: Restart dev server and test with large images  
**Last Updated**: 2026-01-31
