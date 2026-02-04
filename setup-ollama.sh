#!/bin/bash

# LuxeFinds Ollama Setup Script
# This script sets up Ollama with the required vision model (llava)

echo "🤖 Setting up Ollama for LuxeFinds AI Product Creator..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Start Ollama service
echo "📦 Starting Ollama service..."
docker compose up -d ollama

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker compose exec -T ollama curl -s http://localhost:11434/ > /dev/null 2>&1; then
        echo "✅ Ollama is ready!"
        break
    fi
    attempt=$((attempt + 1))
    echo "   Attempt $attempt/$max_attempts..."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Ollama failed to start. Check logs with: docker compose logs ollama"
    exit 1
fi

echo ""
echo "📥 Pulling llava vision model (this may take several minutes)..."
echo "   Model size: ~4.7GB"
docker compose exec ollama ollama pull llava

echo ""
echo "📥 Pulling Stable Diffusion model for image generation (this may take several minutes)..."
echo "   Model size: ~3.5GB"
docker compose exec ollama ollama pull stable-diffusion

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Ollama is now running at: http://localhost:11434"
echo ""
echo "Available commands:"
echo "  • Check status:    docker compose ps"
echo "  • View logs:       docker compose logs -f ollama"
echo "  • Stop service:    docker compose down"
echo "  • Pull more models: docker compose exec ollama ollama pull <model-name>"
echo ""
echo "Installed models for LuxeFinds:"
echo "  • llava (vision)           - For product image analysis"
echo "  • stable-diffusion (image) - For generating model photos with accessories"
echo ""
echo "Optional models:"
echo "  • llava:13b        - Higher quality vision model (larger)"
echo "  • bakllava         - Alternative vision model"
echo ""
