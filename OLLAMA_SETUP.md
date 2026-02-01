# 🤖 Ollama Setup for LuxeFinds AI Product Creator

This guide explains how to set up Ollama for the AI-powered product creation feature.

## Overview

The AI Product Creator uses Ollama with the **llava** vision model to analyze product images and automatically generate:
- Product names
- Luxury-focused descriptions
- Category suggestions
- Price recommendations

## Prerequisites

- Docker and Docker Compose installed
- At least 8GB of free disk space (for the llava model)
- 4GB+ RAM available for Ollama

## Quick Start

### Option 1: Automated Setup (Recommended)

Run the setup script to automatically install and configure Ollama:

```bash
./setup-ollama.sh
```

This script will:
1. Start the Ollama Docker container
2. Wait for the service to be ready
3. Download the llava vision model (~4.7GB)

### Option 2: Manual Setup

#### Step 1: Start Ollama Service

**With GPU support:**
```bash
docker compose up -d ollama
```

**Without GPU (CPU-only):**
```bash
docker compose -f docker-compose.ollama.yml up -d
```

#### Step 2: Pull the Vision Model

```bash
# Wait for Ollama to be ready (check with: docker compose ps)
docker compose exec ollama ollama pull llava
```

## Verify Installation

Check that Ollama is running:

```bash
curl http://localhost:11434/api/tags
```

You should see the llava model listed in the response.

## Using the AI Product Creator

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. Navigate to the admin panel:
   ```
   http://localhost:9002/admin/products/ai-create
   ```

3. Upload a product image and click "Analyze with AI"

## Available Models

| Model | Size | Description | Command |
|-------|------|-------------|---------|
| **llava** | ~4.7GB | Default vision model, good balance | `ollama pull llava` |
| **llava:13b** | ~7.3GB | Higher quality, more accurate | `ollama pull llava:13b` |
| **bakllava** | ~4.7GB | Alternative vision model | `ollama pull bakllava` |

To change the model, update `src/ai/genkit.ts`:

```typescript
ollama({
  models: [
    {
      name: 'llava:13b',  // Change this
      type: 'generate',
    }
  ],
  serverAddress: 'http://127.0.0.1:11434',
})
```

## Troubleshooting

### Ollama not responding

```bash
# Check if container is running
docker compose ps

# View logs
docker compose logs -f ollama

# Restart the service
docker compose restart ollama
```

### Model not found

```bash
# List installed models
docker compose exec ollama ollama list

# Pull the model again
docker compose exec ollama ollama pull llava
```

### Out of memory errors

The llava model requires ~4GB RAM. If you're running out of memory:

1. Close other applications
2. Increase Docker's memory limit (Docker Desktop > Settings > Resources)
3. Use a smaller model or reduce concurrent requests

### Connection refused errors

Make sure Ollama is accessible at `http://127.0.0.1:11434`:

```bash
# Test connection
curl http://localhost:11434/

# Check if port is in use
lsof -i :11434
```

## Performance Tips

### CPU vs GPU

- **GPU**: Much faster inference (~2-5 seconds per image)
- **CPU**: Slower but works everywhere (~10-30 seconds per image)

### Model Selection

- **llava** (default): Good balance, 4.7GB
- **llava:13b**: Better quality, slower, 7.3GB
- **llava:7b**: Smaller alternative

### Optimization

1. Keep Ollama running continuously (don't stop/start frequently)
2. Use GPU if available
3. Consider using a smaller model for development

## Docker Commands Reference

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f ollama

# Check status
docker compose ps

# Execute commands in container
docker compose exec ollama ollama list
docker compose exec ollama ollama pull <model-name>
docker compose exec ollama ollama rm <model-name>

# Restart Ollama
docker compose restart ollama

# Remove everything (including models)
docker compose down -v
```

## Architecture

```
┌─────────────────┐
│   Next.js App   │
│  (Port 9002)    │
└────────┬────────┘
         │
         │ HTTP Request
         │
┌────────▼────────┐
│ Genkit + Ollama │
│   Plugin        │
└────────┬────────┘
         │
         │ API Call
         │
┌────────▼────────┐
│  Ollama Server  │
│  (Port 11434)   │
│                 │
│  ┌───────────┐  │
│  │   llava   │  │
│  │   Model   │  │
│  └───────────┘  │
└─────────────────┘
```

## Environment Variables

You can customize Ollama's behavior with environment variables in `docker-compose.yml`:

```yaml
environment:
  - OLLAMA_HOST=0.0.0.0:11434
  - OLLAMA_ORIGINS=*                    # CORS origins
  - OLLAMA_MODELS=/root/.ollama/models  # Model storage path
  - OLLAMA_NUM_PARALLEL=1               # Concurrent requests
```

## Production Considerations

1. **Use GPU in production** for better performance
2. **Configure proper CORS** settings for security
3. **Monitor memory usage** and set appropriate limits
4. **Consider caching** image analysis results
5. **Set up health checks** to auto-restart on failure
6. **Use persistent volumes** to avoid re-downloading models

## Support

If you encounter issues:

1. Check the [Ollama Documentation](https://github.com/ollama/ollama)
2. Review Docker logs: `docker compose logs ollama`
3. Verify model installation: `docker compose exec ollama ollama list`
4. Test API directly: `curl http://localhost:11434/api/tags`

## Alternative: Local Installation

Instead of Docker, you can install Ollama directly:

```bash
# macOS/Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Download from https://ollama.ai/download

# Pull the model
ollama pull llava

# Run Ollama
ollama serve
```

Then update `src/ai/genkit.ts` to use the local server (already configured for `http://127.0.0.1:11434`).
