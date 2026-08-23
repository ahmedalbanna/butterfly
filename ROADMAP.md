# LuxeFinds — Product & Technical Roadmap
**Version:** 0.1.0 (Cinematic MVP) → 1.0  
**Date:** 2026-08-23  
**Stack:** Next.js 15 App Router, Tailwind + ShadCN, Genkit + Gemini 2.5 Flash

This roadmap turns the current cinematic single-page boutique into a production-ready luxury commerce platform. It is sequenced by risk, not feature flash.

---

## 1. Where We Are

**Built:** `src/app/page.tsx:166` cinematic scroll-snap engine, 8 products in `src/lib/products.ts:17`, `CartProvider` persisted to `luxefinds_cart` `src/context/cart-context.tsx:30`, `ChatProvider` (`aiStylistChat` `src/ai/flows/ai-stylist-chat-flow.ts:24`) + `VoiceCallProvider` overlay `src/components/voice-call-overlay.tsx:10` persisting across routes `src/app/layout.tsx:29`, placeholder `alert`-checkout `src/app/checkout/page.tsx:15`.

**Known gaps (from review):** `next.config.ts:5` `ignoreBuildErrors:true` hides type errors (`src/app/page.tsx:130` `any`), cart hydration race + unguarded `JSON.parse` `src/context/cart-context.tsx:30-37`, mocked voice audio `src/context/voice-call-context.tsx:35` vs orphaned TTS flow `src/ai/flows/product-voice-inquiry-flow.ts:33`, no payment, redirects on `/shop` `/cart` `/ai-stylist` `src/app/shop/page.tsx:4`, missing a11y labels, no tests, fonts via `<link>` `src/app/layout.tsx:25`.

---

## 2. Guiding Principles

1. **Cinematic but purchasable** – every effect must not cost conversion.
2. **Persona-consistent AI** – "The Luxe Stylist" `exquisite/meticulous/timeless` stays concise; no hallucinated inventory.
3. **Frugal luxury** – concise code, `Alegreya`, Rose Gold `hsl(351 33% 58%)` `src/app/globals.css:14` + Black cinematic vs Off-white catalog, per `AGENTS.md`.
4. **No binaries** – use `PlaceHolderImages` `src/lib/placeholder-images.ts:10`.

---

## 3. Roadmap

### Phase 0 — Hardening Sprint (Weeks 0–2) [P0 — Ship-blocker] ✅ COMPLETED 2026-08-23
*Goal: Safe to build on.* *Status: Done — `npm run typecheck` clean, `next build` 10/10 static pages, v0.2.0.*

- [x] **Toolchain:** Remove `ignoreBuildErrors`/`ignoreDuringBuilds` `next.config.ts:5-9`, fix `tsc --noEmit` (calendar `IconLeft` types `src/components/ui/calendar.tsx:57`), rename `package.json:2` `nextn` → `luxefinds` v0.2.0, pin `engines: node>=20`, add `test` script, `npm ci` ready. `npm run build` ✅ 0 errors.
- [x] **Cart fix:** `src/context/cart-context.tsx:26-38` add `isHydrated` guard + `safeParseCart` with `zod` `CartItemSchema`/`CartArraySchema`, `try/catch` + `console.warn` on corrupt data, deferred `localStorage.setItem` until hydrated, `storage` event sync across tabs, exported `isHydrated`.
- [x] **Effect leaks:** `src/app/page.tsx:30-61` fix `TypewriterEffect` interval cleanup (hoist `interval`, clear on unmount); `requestAnimationFrame` defer + `Number.isNaN` guards + `cancelAnimationFrame` cleanup for `IntersectionObserver` `src/app/page.tsx:88-134`; replace `any` with `Pick<Product,...>` `src/app/page.tsx:137`.
- [x] **Secrets:** Validate `GEMINI_API_KEY` at boot (`src/ai/genkit.ts:4` → `getGoogleAIKey()` + `assertGenkitConfigured()` used in `ai-stylist-chat-flow.ts:24`/`product-voice-inquiry-flow.ts:39`), restrict `images.remotePatterns` `next.config.ts:11` from `/**` to `photo-**`/`seed/**`.
- [x] **Bonus:** `src/ai/dev.ts:4` now registers all 3 flows, `src/context/voice-call-context.tsx:34` timeout stored in `useRef` + cleanup on unmount/endCall, `wav` `any[]` → `Buffer[]` `src/ai/flows/product-voice-inquiry-flow.ts:85`.

**Done when:** `npm run typecheck && build` green, no `any` — *achieved*.

### Phase 1 — Commerce Completion (Weeks 2–6) [P1]
*Goal: End-to-end purchase.*

- [ ] **Product system:** Expand `src/lib/products.ts:17` schema (`sku`, `stock`, `variants`), migrate to CMS/Firestore (currently static). Fix `CATEGORIES` `All` handling `src/app/page.tsx:75` – either implement filter or drop.
- [ ] **Product pages:** Keep `src/app/product/[id]/page.tsx:20` but add `generateMetadata`/`generateStaticParams`, fix `alt="alt"` `:81`, real thumbnails from `product.images`.
- [ ] **Cart & Checkout:** Rebuild `src/app/checkout/page.tsx:11` – replace `alert` with `react-hook-form`+`zod` form, shipping/tax, Stripe/PayPal integration, order confirmation page + email, empty-cart redirect handling. Remove redirect placeholders `src/app/cart/page.tsx:4`.
- [ ] **Secondary routes:** Implement `/shop` grid with filters (category, price `src/components/ui/slider.tsx:1`, sort) per `docs/blueprint.md`, not redirect. Add wishlist.

**KPI:** checkout conversion >2%, cart persistence 100% across reloads.

### Phase 2 — AI Stylist Maturity (Weeks 4–8) [P1, parallel]
*Goal: AI that sells.*

- [ ] **Register & trim flows:** `src/ai/dev.ts:4` import `ai-stylist-chat-flow` + `product-voice-inquiry-flow` or delete unused. Wire `generateAccessorySuggestions` `:46` to UI (upload `imageUri` vs `styleDescription` XOR `:28`).
- [ ] **Chat hardening:** `src/context/chat-context.tsx:39` – limit history to 10 turns, add rate-limit, streaming responses, user-visible error toast (replace `console.error:67`), persist last session, add `Product` tool for grounded suggestions (prevent hallucinating out-of-catalog items).
- [ ] **Voice:** Decision: either activate real TTS `productVoiceInquiry` `src/ai/flows/product-voice-inquiry-flow.ts:42` with `googleAI.model('gemini-2.5-flash-preview-tts')` + `wav` conversion `:72`, or mark as `Demo` and remove `genkit` TTS dep. Add `audioRef` cleanup, mute handling, duration cap.
- [ ] **Eval:** Add Genkit eval set for persona (sophisticated/elegant) + product accuracy.

**KPI:** AI attach rate, CSAT >4.5/5.

### Phase 3 — Performance, A11y, Luxury Polish (Weeks 6–10) [P2]
*Goal: 90+ Lighthouse, WCAG AA.*

- [ ] **Fonts/images:** Replace `<link>` `src/app/layout.tsx:25` with `next/font/google` `Alegreya`, add `next/image` `priority`/`placeholder="blur"`/ `sizes`, compress Unsplash `w=1080` → responsive `400/800`, preconnect only needed.
- [ ] **Motion:** Reduce `animate-subtle-zoom 20s` `src/app/page.tsx:188` on mobile, prefer `transform` only, debounce scroll snap, add `prefers-reduced-motion` support.
- [ ] **A11y:** Add `aria-label` to icon buttons (`src/app/page.tsx:214`, `src/components/voice-call-overlay.tsx:40,84`, `src/components/chat-overlay.tsx:114`), `<label>` for chat input `src/components/chat-overlay.tsx:106`, side-dot names `src/app/page.tsx:483`, color contrast fix `text-white/20` `:518`.
- [ ] **SEO/i18n:** Static metadata `src/app/layout.tsx:11`, structured data for products, clean Arabic/English comments `src/context/voice-call-context.tsx:34`.

**KPI:** LCP <2.5s, CLS <0.1.

### Phase 4 — Platform & Growth (Weeks 10–16+) [P3]
*Goal: Operate at scale.*

- [ ] **Data:** Auth (Firebase Auth already in deps `firebase:11.9.1`), orders Firestore, admin CRUD for `src/lib/products.ts`.
- [ ] **Observability:** Error boundaries, Sentry, Genkit tracing, analytics for `TypewriterEffect`/`Sparkles` engagement vs conversion.
- [ ] **Quality:** `vitest` + `playwright` for cart + chat, visual regression for cinematic layout.
- [ ] **Features per blueprint:** Filtering, sustainability story `src/app/product/[id]/page.tsx:135`, Style AI image flow in `/showcase` `src/app/showcase/page.tsx:4` (currently redirect).
- [ ] **Intl & compliance:** VAT, shipping rules, GDPR consent, `apphosting.yaml:6` `maxInstances` autoscaling review.

**KPI:** <0.5% checkout error, p95 chat latency <1.2s.

---

## 4. Dependencies & Risks

| Risk | Mitigation |
|---|---|
| Gemini quota/cost | Cap history, cache suggestions, fallback copy `src/ai/flows/ai-stylist-chat-flow.ts:39` |
| Cinematic UX hurts conversion | A/B snap vs grid; measure scroll depth vs `Add To Bag` `src/app/page.tsx:445` |
| Hydration overwrite loss | P0 fix first, before marketing launch |
| Mock voice misrepresentation | Label as demo until TTS cost approved |

## 5. Release Gates

- **0.2:** P0 green build + cart fix
- **0.5:** P1 checkout with test payment + `/shop` grid
- **0.9:** P2 AI streaming + voice decision + a11y audit
- **1.0:** P3 perf 90+ + E2E tests + prod secrets

## 6. Next 3 Actions

1. Patch `src/context/cart-context.tsx:29-37` + `next.config.ts:5` (1 day)
2. Spec checkout form + Stripe spike (3 days)
3. Decide voice TTS vs demo removal (stakeholder review)

---
*Single source of truth remains `src/lib/products.ts:4` until CMS migration Phase 4.*
