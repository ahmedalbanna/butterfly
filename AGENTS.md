# 🤖 Information for Future Agents

This document provides critical technical context for AI agents working on the **LuxeFinds** project.

## 🏛️ Architecture Overview

LuxeFinds is built as a **Cinematic Single-Page Experience** with secondary routes for Checkout and Customer Service. It relies heavily on React Context for real-time interactivity.

### Key State Managers (Contexts)

1. **`CartProvider`**: Manages the luxury bag. Persists to `localStorage` under `luxefinds_cart`.
2. **`ChatProvider`**: Handles the AI Stylist conversation. Integrates with the `aiStylistChat` server action.
3. **`VoiceCallProvider`**: Manages the global voice call state, allowing the call overlay to persist across route changes.

## 🧠 AI Integration (Genkit)

The AI logic is located in `src/ai/flows/`. 

- **Persona**: "The Luxe Stylist". Tone must be sophisticated, elegant, and professional. Use words like "exquisite", "meticulous", "timeless".
- **Models**: Primarily uses `googleai/gemini-2.5-flash` for high-speed, high-quality responses.

## 🎨 UI/UX Guidelines

- **Typography**: `Alegreya` is the primary serif font used for both headings and body to maintain a luxury "editorial" feel.
- **Colors**:
  - `Primary`: Rose Gold / Dusty Pink (`hsl(351, 33%, 58%)`).
  - `Background`: Deep Black (`#000000`) for the cinematic mode, Off-white for light pages.
- **Effects**:
  - `TypewriterEffect`: Used on home page data reveals to prevent information overload and add a "live" feel.
  - `Magic Sparkles`: Triggered on image interactions to simulate the "shimmer" of jewelry.

## 🛠️ Important Files

- `src/lib/products.ts`: Central source of truth for all boutique items.
- `src/app/page.tsx`: The core cinematic engine. Uses Intersection Observer for category tracking.
- `src/components/voice-call-overlay.tsx`: The global UI for the simulated call experience.
- `src/components/chat-overlay.tsx`: The full-screen immersive AI chat interface.

## ⚠️ Constraints

- **No Binary Files**: Do not generate images or binary assets. Use `PlaceHolderImages` from `src/lib/placeholder-images.ts`.
- **Client Components**: Most interaction-heavy components must use `'use client'`.
- **Frugality**: Keep code concise and follow the existing luxury aesthetic.
