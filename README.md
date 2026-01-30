# 💎 LuxeFinds | Boutique Cinematic Experience

Welcome to **LuxeFinds**, an elite digital boutique for high-end accessories. This project isn't just an e-commerce platform; it's a cinematic journey through luxury, powered by Next.js 15 and Genkit AI.

## ✨ Key Features

- **🎬 Cinematic UI:** A scroll-snap mandatory layout with immersive product displays and elegant typography.
- **🤖 AI Stylist Chat:** An intelligent fashion consultant available 24/7 to provide personalized advice.
- **📞 Voice Stylist Call:** A simulated high-end concierge call experience for detailed product inquiries.
- **✨ Magic Interactions:** Visual feedback with sparkle effects and smooth "typewriter" data reveals.
- **🛍️ Luxury Bag:** A sophisticated shopping cart experience with seamless checkout transition.

## 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [ShadCN UI](https://ui.shadcn.com/)
- **AI Engine:** [Genkit](https://firebase.google.com/docs/genkit) (Google Gemini 2.5 Flash)
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

### Full Setup (With PostgreSQL Database) - **Recommended**

For full e-commerce functionality including order persistence, cart sync, and chat history:

1. **Start PostgreSQL with Docker:**
   ```bash
   docker compose up -d
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

See [`DOCKER_DATABASE.md`](./DOCKER_DATABASE.md) for Docker commands and [`DATABASE_SETUP.md`](./DATABASE_SETUP.md) for alternative setups.

## 📂 Project Structure

- `src/app/`: Next.js App Router pages and layouts.
- `src/app/actions/`: Server actions for database operations.
- `src/ai/`: Genkit AI flows and configurations.
- `src/components/`: Reusable UI components (ShadCN + Custom).
- `src/context/`: Global state management for Cart, Chat, and Voice Calls.
- `src/lib/`: Product data, database client, and utility functions.
- `prisma/`: Database schema and migrations.

## 🗄️ Database

LuxeFinds uses **PostgreSQL** with **Prisma ORM** for:
- Product catalog management
- Order processing and history
- Shopping cart persistence
- AI chat history

The app gracefully falls back to hardcoded data if no database is configured. See [`DATABASE_SETUP.md`](./DATABASE_SETUP.md) for setup instructions.
