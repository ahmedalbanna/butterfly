# 💎 LuxeFinds | Boutique Cinematic Experience — v1.0

High-end accessories boutique — cinematic scroll experience + grounded AI stylist — now production-ready.

**Stack:** Next.js 15 App Router, Tailwind + ShadCN, Genkit + Gemini 2.5 Flash, `next/font` Alegreya, Zod, Vitest.

## ✨ Features (1.0)

- **🎬 Cinematic Home** `src/app/page.tsx:172` — `snap-y/x` boutique, `IntersectionObserver` category tracking, `TypewriterEffect` `src/app/page.tsx:30`, `Magic Sparkles` with analytics `track('sparkle_interact')`.
- **🛍️ Shop** `src/app/shop/page.tsx:1` — category pills (`All` via `CATEGORIES`), price `Slider` `src/components/ui/slider.tsx`, sort `Select`, stock badges (`SKU`, `Low stock`).
- **🔍 Product** `src/app/product/[id]/page.tsx:1` + `src/app/product/[id]/layout.tsx:1` — SSG `generateStaticParams` (8 paths) + `generateMetadata` OG, gallery 4 thumbs, stock guard.
- **👜 Cart** `src/app/cart/page.tsx:1` — full page (hydrated via `CartProvider`), qty `Minus/Plus` with `aria-label`, `isHydrated` guard.
- **💳 Checkout** `src/app/checkout/page.tsx:1` — `react-hook-form`+`zodResolver` `checkoutSchema` (8 fields, regex card/expiry/cvc), `createOrderFromCart` → `saveOrder` `src/lib/orders.ts:1`, `track('purchase')`, success `LX-…` view.
- **🤖 AI Stylist** `src/components/chat-overlay.tsx:1` — catalog-grounded `CATALOG` `src/ai/flows/ai-stylist-chat-flow.ts:11`, history trimmed `slice(-10)`, rate-limit `8/min`, `localStorage luxefinds_chat`, `clearChat`, `aria-label`s.
- **📸 Style AI Showcase** `src/app/showcase/page.tsx:1` — `generateAccessorySuggestions` `src/ai/flows/generate-accessory-suggestions.ts:1` (image 4MB `FileReader` XOR `styleDescription`), catalog-filtered suggestions.
- **📞 Voice Call** `src/context/voice-call-context.tsx:1` — attempts real `productVoiceInquiry` TTS (`gemini-2.5-flash-preview-tts`), falls back to `DEMO_AUDIO` with `isDemo` badge `src/components/voice-call-overlay.tsx:104`, `useRef` cleanup.
- **🛡️ Platform** — `ErrorBoundary` `src/components/error-boundary.tsx`, `AuthProvider` `src/context/auth-context.tsx` (mock `localStorage`, Firestore-ready), `ConsentBanner` `src/components/consent-banner.tsx` GDPR, `OrganizationJsonLd` `src/components/json-ld.tsx`, `track()` `src/lib/analytics.ts`.
- **✅ Quality** — `vitest` `jsdom` + `src/lib/products.test.ts`/`orders.test.ts`/`cart-context.test.ts` `10/10`, `tsc --noEmit` clean, `next build` `18/18 SSG`.

## 🛠️ Tech Stack

- **Framework:** Next.js 15.5.9 App Router, `next/font` `Alegreya` `src/app/layout.tsx:2` (`variable --font-alegreya`, `display swap`)
- **Styling:** Tailwind `3.4.1` + `tailwind.config.ts:14` `var(--font-alegreya)` + ShadCN + `globals.css:44` `prefers-reduced-motion`
- **AI:** Genkit `1.20` `src/ai/genkit.ts:4` (`getGoogleAIKey` + `assertGenkitConfigured`), `gemini-2.5-flash` chat + `preview-tts`
- **State:** `CartProvider` `src/context/cart-context.tsx` (`zod` `CartItemSchema` `src/lib/cart-schema.ts`, `isHydrated`, `storage` sync) + `ChatProvider` + `VoiceCallProvider` + `AuthProvider` `src/app/layout.tsx:48`
- **Forms:** `react-hook-form` + `@hookform/resolvers` + `zod` `src/app/checkout/page.tsx:10`
- **Testing:** Vitest `4.1.11` `vitest.config.ts:1`

## 🚀 Getting Started

```bash
cp .env.example .env  # set GEMINI_API_KEY (or GOOGLE_API_KEY)
npm ci
npm run dev        # http://localhost:9002
npm run typecheck  # tsc --noEmit
npm test           # vitest 10/10
npm run build      # 18/18 SSG, ~14.8kB /
```

**Env:** `GEMINI_API_KEY` required for AI (chat/style/voice). Without it, chat/toasts show `Stylist unavailable` and voice falls back to demo `SoundHelix` (see `src/context/voice-call-context.tsx:34`). Firebase vars optional until Auth/Firestore enabled.

**Deploy (Firebase App Hosting):** `apphosting.yaml:4` `min 0 → max 3` `80 concurrency` `512MiB`; secret `GEMINI_API_KEY` available at `BUILD`+`RUNTIME`.

## 📂 Project Structure

- `src/app/` — App Router (`layout.tsx:48` wraps `ErrorBoundary`+`Auth`+`Chat`+`Voice`+`Cart`; `page.tsx:172` cinematic; `shop/`, `product/[id]/`, `cart/`, `checkout/`, `showcase/` each with `layout.tsx` metadata)
- `src/ai/` — `genkit.ts:4` + `flows/` (`ai-stylist-chat-flow.ts` catalog-grounded, `generate-accessory-suggestions.ts` filtered, `product-voice-inquiry-flow.ts` TTS+`wav`)
- `src/context/` — `cart-context.tsx` (+ `.test.ts`, `cart-schema.ts` reused), `chat-context.tsx`, `voice-call-context.tsx`, `auth-context.tsx`
- `src/lib/` — `products.ts` (`sku/stock/ProductCategory`, `getProductById`, `MIN/MAX`), `orders.ts` (`OrderSchema` + `saveOrder`), `analytics.ts` (`track`), `cart-schema.ts`, `utils.ts`, `placeholder-images.ts`
- `src/components/` — `chat-overlay.tsx`, `voice-call-overlay.tsx`, `error-boundary.tsx`, `consent-banner.tsx`, `json-ld.tsx`, `navbar.tsx`, `ui/*`
- `vitest.config.ts` + `vitest.setup.ts` — quality

## 🔐 Security & Compliance

- Cart validates `JSON.parse` via `zod` `safeParseCart` `src/context/cart-context.tsx:34`.
- Images locked to `placehold.co` + `images.unsplash.com/photo-**` + `picsum.photos/seed/**` `next.config.ts:11`.
- `ConsentBanner` `src/components/consent-banner.tsx:1` persists `luxefinds_consent`; `track()` respects dev vs prod.

## 📈 Roadmap

See `ROADMAP.md:1` — Phases 0–4 completed `v0.2→1.0`. Next: real Stripe, Firestore orders, Genkit evals, Playwright E2E.

## 🤖 Agents

See `AGENTS.md:1` for state managers, AI persona (exquisite/meticulous/timeless), effects, constraints, and `src/lib/products.ts:4` source of truth.
