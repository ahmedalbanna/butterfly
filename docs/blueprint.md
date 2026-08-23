# Blueprint — LuxeFinds v1.0

*Source: original core features + style guidelines, now implemented.*

## App Name

**LuxeFinds** — Elite digital boutique for high-end accessories. Cinematic journey + purchasable boutique.

## Core Features — Implemented

| Feature | Spec | Implementation | Status |
|---|---|---|---|
| **Product Browsing** | Browse by category with high-quality images and intuitive filtering | Cinematic `src/app/page.tsx:172` `snap-y/x` + `src/app/shop/page.tsx:1` filterable grid (category `CATEGORIES` pills, price `Slider` `src/components/ui/slider.tsx`, sort `Select`, 3-col cards) | ✅ |
| **Product Detail Pages** | Descriptions, materials, care, multiple images | `src/app/product/[id]/page.tsx:1` client gallery `activeImageIndex` 4 thumbs (was mock `alt="alt"`), `generateStaticParams`+`generateMetadata` `src/app/product/[id]/layout.tsx:1` (8 SSG paths), `Accordion` materials/care/sustainability, SKU/stock badges, `sizes` | ✅ |
| **Shopping Cart** | Persistent cart, quantity adjust | `CartProvider` `src/context/cart-context.tsx:1` `zod` `CartItemSchema` `src/lib/cart-schema.ts`, `isHydrated` guard, `safeParseCart` + `storage` sync, full `src/app/cart/page.tsx:1` + Sheet `src/app/page.tsx:213` | ✅ |
| **Secure Checkout** | Payment + confirmation | `src/app/checkout/page.tsx:1` `react-hook-form`+`zod` `checkoutSchema` (8 fields incl. `cardNumber` `^\d{16}$`), `createOrderFromCart`→`saveOrder` `src/lib/orders.ts:1`, `track('purchase')`, order `LX-…` success view, `isHydrated` guard | ✅ |
| **Style AI Tool** | Suggest accessories from image or style text | `src/ai/flows/generate-accessory-suggestions.ts:1` prompt constrained to `CATALOG_NAMES`, XOR validation, valid-set filter; UI `src/app/showcase/page.tsx:1` (`Textarea`+`Input file` 4MB `FileReader`, skeletons, filtered `PRODUCTS` results) | ✅ |
| **AI Stylist Chat** | 24/7 fashion consultant | `src/ai/flows/ai-stylist-chat-flow.ts:11` `CATALOG` injected (sku/stock/price), `slice(-10)` history; `ChatProvider` `src/context/chat-context.tsx:1` rate-limit `8/min`, `localStorage luxefinds_chat`, `clearChat`; `ChatOverlay` `src/components/chat-overlay.tsx:1` `aria-label`s, catalog-grounded subtitle | ✅ |
| **Voice Stylist** | Concierge call for product inquiries | `src/ai/flows/product-voice-inquiry-flow.ts:1` `gemini-2.5-flash-preview-tts` `Algenib` → `wav`; `VoiceCallProvider` `src/context/voice-call-context.tsx:1` attempts real TTS then `DEMO_AUDIO` fallback with `isDemo`, `useRef` cleanup; overlay `src/components/voice-call-overlay.tsx:104` demo badge | ✅ |

**Deferred to post-1.0:** Real Stripe/PayPal charge (currently `4242` demo), Firestore persistence (localStorage TODO), Genkit evals, Playwright visual regression.

## Style Guidelines — As Built

- **Primary:** Rose gold `hsl(351 33% 58%)` `src/app/globals.css:14` (`--primary`), text `text-primary`, badges `bg-primary`.
- **Background:** Deep Black `#000000` cinematic `src/app/page.tsx:173` vs Off-white `hsl(0 0% 96%)` `src/app/globals.css:8` for catalog (`bg-background`).
- **Accent:** Soft grey `hsl(0 0% 66%)` `secondary` + `border` `hsl(0 0% 88%)`.
- **Typography:** `Alegreya` via `next/font/google` `src/app/layout.tsx:2` (`variable --font-alegreya`, `display swap`, `400-800`), `tailwind.config.ts:14` `body`/`headline` `var(--font-alegreya)`. Editorial, luxury.
- **Icons:** `lucide-react` minimalist line rose-gold (e.g., `Sparkles`, `ShoppingBag`, `Bot`).
- **Layout:** Cinematic `snap-mandatory` + boutique `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` `src/app/shop/page.tsx:70` + `container` `Navbar` `src/components/navbar.tsx:1`.
- **Animations:** `TypewriterEffect` `src/app/page.tsx:30` (hoisted interval cleanup, reduced-motion kill), `Magic Sparkles` `src/app/page.tsx:182` (`track('sparkle_interact')`), `animate-subtle-zoom 20s` → `30s` mobile `src/app/page.tsx:193` with `prefers-reduced-motion` global `src/app/globals.css:44`, transitions `cubic-bezier(0.22,1,0.36,1)`.
- **Accessibility:** `aria-label` for all icon buttons (`src/app/page.tsx:214` cart, `src/components/voice-call-overlay.tsx:35` call controls), `role="navigation"` side dots `src/app/page.tsx:488`, `sr-only` labels `src/components/chat-overlay.tsx:1`, contrast `white/40→60` help overlay.

## Non-Functional — v1.0

- **Performance:** `next/font` eliminates CLS, `next/image` `sizes` + `priority` LCP, `prefers-reduced-motion`, `18/18` SSG (`product` 8 paths), `First Load ~102kB` `src/app/layout.tsx:46`.
- **Reliability:** `CartProvider` `zod` validation, `ErrorBoundary` `src/components/error-boundary.tsx:1` at root, `assertGenkitConfigured` `src/ai/genkit.ts:4` with user-visible toast, `genkit` `GEMINI_API_KEY` secret `apphosting.yaml:8`.
- **Quality:** `vitest` `3 suites 10/10` `src/lib/products.test.ts` etc., `tsc --noEmit` clean, `next build` `✓ 18/18`.
- **Compliance:** `ConsentBanner` `src/components/consent-banner.tsx:1` `luxefinds_consent` GDPR, `apphosting.yaml:4` `maxInstances 3` `80 concurrency`.

## References

- `src/lib/products.ts:4` — source of truth (sku, stock, images, `MIN/MAX`)
- `ROADMAP.md:1` — Phases 0–4 ✅
- `AGENTS.md:1` — agent context
