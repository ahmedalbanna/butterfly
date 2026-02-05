# 🤖 Information for Future Agents

This document provides critical technical context for AI agents working on the **Butterfly Store** (LuxeFinds) project.

## 🏛️ Architecture Overview

The Butterfly Store is an elite digital boutique built with **Next.js 15**, **Firebase**, and **PostgreSQL**. It utilizes a **Cinematic Engine** for product discovery and a robust **Intelligence Suite** for administrative management.

### Key State Managers (Contexts)

1. **`CartProvider`**: Manages the luxury bag. Persists to `localStorage` under `luxefinds_cart`.
2. **`ChatProvider`**: Real-time concierge messaging with a dedicated polling/heartbeat system.
3. **`VoiceCallProvider`**: Manages WebRTC-based voice sessions with real-time audio visualization.
4. **`SearchProvider`**: Controls the global, full-screen luxury discovery overlay.

### 🔄 Database Synchronization & CRM
- **Dual-Layer Storage**: Authentication and role-based profiles are stored in **Firestore**, while the product catalog, order ledger, and CRM data reside in **PostgreSQL**.
- **Unified Contacts**: Every person interacting with the boutique (Account holders OR Guest shoppers) must be synchronized via the `syncUserToDb` action. This ensures the **Admin Contacts** page remains an exhaustive source of truth for elite clientele.

## 🧠 AI Integration (Genkit & Ollama)

- **The Luxe Stylist**: Tone is sophisticated, meticulous, and professional. (Persona located in `src/ai/flows/`).
- **Vision AI**: Uses **Ollama (llava)** for the **AI Product Creator**. Admins can upload images to automatically generate luxury descriptions and metadata.
- **Stable Diffusion**: Utilized for generating lifestyle "Model Photos" for pieces in the collection.

## 🛡️ Security & Authorization

- **Admin Guard**: Access to `/admin` is strictly controlled by the `AdminLayout`. It verifies the `isAdmin: true` flag within the user's Firestore profile (`/users/{uid}`).
- **Stock Integrity**: The `createOrder` server action uses Prisma transactions to perform **atomic stock validation**, preventing the over-selling of limited-edition pieces.

## 🎨 UI/UX Guidelines

- **Typography**: `Alegreya` (Serif) is used for its editorial, high-fashion aesthetic.
- **Cinematic Effects**:
  - `TypewriterEffect`: For rhythmic data reveals.
  - `Magic Sparkles`: For visual resonance during image interactions.
  - `Audio Visualization`: Dynamic pulsing meters during voice calls.
- **Colors**: Primary is **Golden Yellow** (`hsl(45, 100%, 50%)`) on a **Deep Black** (`#000000`) background.

## 🛠️ Important Files

- `src/lib/db.ts`: PostgreSQL connection pool using Prisma.
- `src/app/actions/`: Central hub for CRM, Order, and Product logic (Server Actions).
- `src/hooks/use-webrtc-call.ts`: Core logic for P2P audio and recording.
- `src/app/order/[id]/page.tsx`: The "Boutique Ledger" view for acquisition tracking.

## ⚠️ Constraints

- **No Binary Files**: Do not generate images. Use `PlaceHolderImages` from `src/lib/placeholder-images.ts`.
- **Client Components**: All interaction-heavy modules MUST use `'use client'`.
- **Frugality**: Maintain the minimalist, high-contrast luxury aesthetic. Avoid cluttered layouts.
