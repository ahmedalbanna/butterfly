# 💎 LuxeFinds | Boutique Cinematic Experience

Welcome to **LuxeFinds**, an elite digital boutique for high-end accessories. This project isn't just an e-commerce platform; it's a cinematic journey through luxury, powered by Next.js 15 and Genkit AI.

## ✨ Key Features

- **🎬 Cinematic UI:** A scroll-snap mandatory layout with immersive product displays and elegant typography.
- **🤖 AI Stylist Chat:** An intelligent fashion consultant available 24/7 to provide personalized advice.
- **📞 Voice Stylist Call:** Real-time WebRTC voice calls with Redis-powered signaling for product inquiries.
- **🎨 AI Product Creator:** Upload product images and let AI generate luxury descriptions automatically (Admin feature).
- **✨ Magic Interactions:** Visual feedback with sparkle effects and smooth "typewriter" data reveals.
- **🛍️ Luxury Bag:** A sophisticated shopping cart experience with seamless checkout transition.

## 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [ShadCN UI](https://ui.shadcn.com/)
- **AI Engine:** [Genkit](https://firebase.google.com/docs/genkit) (Google Gemini 2.5 Flash)
- **Vision AI:** [Ollama](https://ollama.ai/) with llava model for image analysis
- **Database:** [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Cache & Signaling:** [Redis](https://redis.io/) with Server-Sent Events for WebRTC
- **Icons:** [Lucide React](https://lucide.dev/)
- **Fonts:** [Alegreya](https://fonts.google.com/specimen/Alegreya) (Serif)

## 🚀 Getting Started

### Basic Setup (Without Database)

1. **Setup Environment:** Ensure you have your `GEMINI_API_KEY` in the `.env` file.
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Run Development:**
   ```bash
   npm run dev
   ```

The app will work with hardcoded product data if no database is configured.

### Full Setup (With PostgreSQL + Redis) - **Recommended**

For full e-commerce functionality including order persistence, cart sync, chat history, and voice calls:

1. **Start PostgreSQL and Redis with Docker:**
   ```bash
   docker compose up -d postgres redis
   ```
   
2. **Setup Database Schema and Seed Data:**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

3. **Start Development:**
   ```bash
   npm run dev
   ```

**Database Credentials** (already configured in `.env`):
- User: `luxefinds_admin`
- Password: `luxefinds_secure_pass_2026`
- Database: `luxefinds`

For detailed setup instructions, see the **[Getting Started Guide](./docs/setup/getting-started.md)** which covers all setup options including:
- Basic setup without database
- Full setup with PostgreSQL and Redis
- AI Product Creator with Ollama

### AI Product Creator Setup (Optional)

To enable the AI-powered product creation feature for admins:

1. **Start Ollama service:**
   ```bash
   ./setup-ollama.sh
   ```
   Or manually:
   ```bash
   docker compose up -d ollama
   docker compose exec ollama ollama pull llava
   ```

2. **Access the feature:**
   - Navigate to `/admin/products/ai-create`
   - Upload a product image
   - AI will generate name, description, category, and price suggestions
   - Complete remaining fields and save

See **[AI Setup Guide](./docs/setup/ai-setup.md)** for detailed setup instructions and **[AI Product Creator](./docs/features/ai-product-creator.md)** for feature documentation.

## 📂 Project Structure

- `src/app/`: Next.js App Router pages and layouts.
- `src/app/actions/`: Server actions for database operations.
- `src/ai/`: Genkit AI flows and configurations.
- `src/components/`: Reusable UI components (ShadCN + Custom).
- `src/context/`: Global state management for Cart, Chat, and Voice Calls.
- `src/lib/`: Product data, database client, and utility functions.
- `prisma/`: Database schema and migrations.

## 🗄️ Database & Cache

### PostgreSQL
LuxeFinds uses **PostgreSQL** with **Prisma ORM** for:
- Product catalog management
- Order processing and history
- Shopping cart persistence
- AI chat history

The app gracefully falls back to hardcoded data if no database is configured. See **[Docker Setup Guide](./docs/setup/docker-setup.md)** for detailed database instructions.

### Redis
**Redis** is used for:
- WebRTC signaling for voice calls (replaces in-memory solution)
- Real-time message delivery via Pub/Sub
- Server-Sent Events (SSE) for instant notifications
- Automatic message expiration (10-minute TTL)

**Benefits:**
- ✅ Horizontal scalability (multiple Next.js instances)
- ✅ Persistent signaling across server restarts
- ✅ Real-time delivery (no polling delays)
- ✅ Production-ready architecture

See **[Redis Setup Guide](./docs/setup/redis-setup.md)** for detailed implementation and **[Voice Calls](./docs/features/voice-calls.md)** for quick setup.
