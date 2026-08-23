# 🤖 Information for Future Agents — LuxeFinds v1.0

Technical context for AI agents. Updated to 2026-08-23 through Phase 4.

## 🏛️ Architecture Overview

LuxeFinds is a **Cinematic Single-Page Experience** (`src/app/page.tsx:172`) plus full boutique routes (`/shop`, `/product/[id]`, `/cart`, `/checkout`, `/showcase`). All wrapped in `src/app/layout.tsx:48` `ErrorBoundary` → `AuthProvider` → `ChatProvider` → `VoiceCallProvider` → `CartProvider` with `VoiceCallOverlay`+`ChatOverlay`+`ConsentBanner`+`OrganizationJsonLd` persisting across routes.

### Key State Managers (Contexts)

1. **`CartProvider`** `src/context/cart-context.tsx:1` + `src/lib/cart-schema.ts:1` (`CartItemSchema` `CartArraySchema`) — bag, `isHydrated` guard, `safeParseCart` via `zod`, `localStorage luxefinds_cart`, `storage` event sync. Exported `isHydrated` for pages.
2. **`ChatProvider`** `src/context/chat-context.tsx:1` — Luxe Stylist conversation; `history.slice(-10)`, rate-limit `8/min` via `sendTimesRef`, persists `luxefinds_chat`, `isTyping`, `clearChat`; integrates `aiStylistChat` `src/ai/flows/ai-stylist-chat-flow.ts:11`.
3. **`VoiceCallProvider`** `src/context/voice-call-context.tsx:1` — global call; attempts real `productVoiceInquiry` TTS then `DEMO_AUDIO` fallback (`isDemo`), `connectTimeoutRef` `useRef` cleanup, `isMuted/isMinimized/audioUrl`.
4. **`AuthProvider`** `src/context/auth-context.tsx:1` — mock `User` (`email/displayName`) `localStorage luxefinds_user`, `signIn(email)`/`signOut()`; TODO swap to `firebase` `11.9.1`.

### Supporting Libs

- `src/lib/products.ts:4` — **source of truth** 8 products (`sku/stock/ProductCategory`, `getProductById`, `MIN/MAX_PRODUCT_PRICE`, `CATEGORIES as const`).
- `src/lib/orders.ts:1` — `OrderSchema` (`zod`), `saveOrder`/`getOrders`/`createOrderFromCart` (cap 20, localStorage + Firestore TODO) wired to checkout `src/app/checkout/page.tsx:38`.
- `src/lib/analytics.ts:1` — `track(event, props)` (`dataLayer` + console), hooks: `add_to_bag`/`sparkle_interact` `src/app/page.tsx:141` + `purchase` `src/app/checkout/page.tsx:38`.
- `src/lib/cart-schema.ts:1` — extracted for Vitest (avoids JSX `preserve`).

## 🧠 AI Integration (Genkit)

Location `src/ai/flows/`:

- **Persona:** "The Luxe Stylist" — sophisticated, elegant, professional; words `exquisite`, `meticulous`, `timeless`, `curated`. Concise 2–4 sentences, catalog-grounded, never invent.
- **Model:** `googleai/gemini-2.5-flash` `src/ai/genkit.ts:4` (`getGoogleAIKey` reads `GEMINI_API_KEY`/`GOOGLE_API_KEY`/`GOOGLE_GENAI_API_KEY`, `assertGenkitConfigured` throws user-visible error).
- **Flows:**
  - `ai-stylist-chat-flow.ts:11` — injects `CATALOG` (name/category/price/materials/SKU/stock) into `system`, `history` trimmed.
  - `generate-accessory-suggestions.ts:1` — `CATALOG_NAMES` constrained, XOR `imageUri` vs `styleDescription`, valid-set filter, `assertGenkitConfigured`.
  - `product-voice-inquiry-flow.ts:1` — `gemini-2.5-flash-preview-tts` `Algenib` + `wav` → `Buffer[]` base64 `audioUri`.

**Registration:** `src/ai/dev.ts:4` imports all 3. Missing `GEMINI_API_KEY` → chat toast `Stylist unavailable`, voice demo fallback.

## 🎨 UI/UX Guidelines

- **Typography:** `Alegreya` via `next/font/google` `src/app/layout.tsx:2` (`variable --font-alegreya`, `display swap`, `400-800`); `tailwind.config.ts:14` `body`/`headline` `var(--font-alegreya)`.
- **Colors:** `Primary` Rose Gold `hsl(351 33% 58%)` `src/app/globals.css:14`; `Background` Black cinematic `#000000` vs Off-white `hsl(0 0% 96%)` for catalog.
- **Effects:**
  - `TypewriterEffect` `src/app/page.tsx:30` — hoisted `interval`, `clearTimeout`+`clearInterval` on unmount, `delay`+`speed` props.
  - `Magic Sparkles` `src/app/page.tsx:182` — `sparkle-anim 0.8s`, `track('sparkle_interact')`.
  - `animate-subtle-zoom 20s → 30s` mobile `src/app/page.tsx:193` with `prefers-reduced-motion` kill `src/app/globals.css:44`.
- **A11y:** `aria-label` on all icon buttons (`src/app/page.tsx:214`, `src/components/voice-call-overlay.tsx:35`), `sr-only` label `src/components/chat-overlay.tsx:1`, `role=navigation` side dots, contrast `white/60` help overlay, `aria-current` :488.
- **SEO:** `src/app/layout.tsx:10` enriched `metadata` (template, `metadataBase`, `OG`, `robots`), per-route `layout.tsx` + `src/app/product/[id]/layout.tsx:1` `generateStaticParams`→8 SSG + `generateMetadata`, `src/components/json-ld.tsx:4` `Organization`+`Product`.

## 🛠️ Important Files

- `src/lib/products.ts:4` — boutique source of truth.
- `src/app/page.tsx:172` — cinematic engine (`IntersectionObserver` RAF defer, `activeCategoryIndex`).
- `src/app/shop/page.tsx:1` — filterable grid (`Slider`, `Select`).
- `src/app/showcase/page.tsx:1` — Style AI (`FileReader` 4MB, `Textarea`, `generateAccessorySuggestions`).
- `src/app/product/[id]/page.tsx:1` + `layout.tsx:1` — product detail + SSG.
- `src/app/checkout/page.tsx:38` — `react-hook-form`+`zod` checkout `saveOrder`+`track`.
- `src/components/voice-call-overlay.tsx:104` — global call UI (cinematic + bubble, `isDemo`).
- `src/components/chat-overlay.tsx:1` — immersive AI chat (`clearChat`, `aria-label`s).
- `src/components/error-boundary.tsx:1` / `consent-banner.tsx:1` / `json-ld.tsx:4` — platform.
- `src/context/cart-context.tsx:1` / `chat-context.tsx:1` / `voice-call-context.tsx:1` / `auth-context.tsx:1` — state.

## ⚠️ Constraints

- **No Binary Files:** Use `PlaceHolderImages` `src/lib/placeholder-images.ts:10` (`images.unsplash.com/photo-**`, `picsum.photos/seed/**` via `next.config.ts:11`).
- **Client Components:** Interaction-heavy `'use client'` (`page.tsx`, overlays, contexts, `checkout`).
- **Frugality:** Concise luxury aesthetic; avoid gratuitous deps.
- **Testing:** `vitest.config.ts:1` (`jsdom`, `globals`) + `vitest.setup.ts`; `npm test` `10/10` `src/lib/*.test.ts`.
- **Deploy:** `apphosting.yaml:4` `min 0/max 3/80 concurrency/512MiB` + `GEMINI_API_KEY` secret; `.env.example:1` for local.
