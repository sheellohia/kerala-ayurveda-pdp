# DESIGN SPEC — Kerala Ayurveda Ashwagandha PDP (UI build brief)

You are building the **hyper-realistic, premium, UX-friendly front end** for a Shopify-style
Product Detail Page for **Kerala Ayurveda Ashwagandha**. The centerpiece is an
**"Is this right for me?" fit-check** that moves a shopper from confusion → confidence.

The **backend, domain model, and design tokens are already built and LOCKED** (see "Contract"
below). Your job is the entire visual layer: components, layout, the fit-check experience,
micro-interactions, client-side cart, and product artwork — all coherent and polished.

Reference bar for motion quality: **seed.com** (calm, deliberate, physics-based). Do **not**
copy its visual design. Match its *restraint and craft*.

---

## Contract — files that already exist. Import from them; do NOT modify them.

| File | What it gives you |
|---|---|
| `src/lib/types.ts` | All TypeScript types: `Product`, `ProductVariant`, `Recommendation`, `FitCheckAnswers`, `Goal`, etc. Import types from here. |
| `src/data/product.ts` | `product` fixture (Shopify-shaped), plus helpers `findVariant`, `variantByOptions`, `pricePerDay`. This is the single source of product content. |
| `src/lib/fit-check/questions.ts` | `questions` array + `totalSteps` — the fit-check flow copy/options. Render these; don't hardcode questions. |
| `src/lib/motion.ts` | The shared motion vocabulary: `ease`, `duration`, `spring`, `revealUp`, `staggerContainer`/`staggerItem`, `stepTransition`, `drawerPanel`, `press`, `lift`. Use these — do not invent new timings. |
| `tailwind.config.ts` | Tokens: `clay-*` (warm paper/neutrals), `forest-*` (botanical/trust), `saffron-*` (primary CTA + selected). Radii `xl/2xl/3xl`, shadows `soft/lift/ring`, `animate-shimmer`. |
| `src/app/globals.css` | Base styles + a strict `prefers-reduced-motion` reset. You may ADD utility layers here if needed. |
| `src/app/layout.tsx` | Loads Marcellus (serif display) + Figtree (sans body) as `font-serif` / `font-sans`. |
| `/api/recommend` (route) | The backend for the fit-check. Contract below. |

You OWN and create: everything under `src/components/`, `src/app/page.tsx`, `public/images/*.svg`,
and any client-only helpers/hooks (cart store, count-up hook, money formatter). You may add a
small `src/lib/format.ts` for money/number formatting.

**Do NOT edit** `types.ts`, `engine.ts`, `validation.ts`, `ai/copy.ts`, `route.ts`,
`questions.ts`, `motion.ts` (logic contract). Tailwind/globals/layout may take additive edits only.

---

## API contract — the fit-check backend

`POST /api/recommend` with a JSON body of shape `FitCheckAnswers`:
```ts
{ goals: Goal[], primaryGoal?: Goal, stressLevel, experience,
  safety: { pregnancyOrNursing, thyroidOrAutoimmune, sedativesOrLiver },
  formPreference, dosePreference }
```
Responses:
- **200** `{ recommendation: Recommendation }` — always a complete result.
- **400** `{ error: string, issues?: Record<string,string> }` — validation failed.
- **500** `{ error: string }` — unexpected.

`Recommendation` (see `types.ts`) has: `outcome` (`'match' | 'caution'`), `matchStrength`
(`'strong'|'good'|'moderate'|null`), `matchScore` (0–100, for the count-up meter), `copy`
(`{ verdictHeadline, verdictSubcopy, reasons[] }`), `copySource` (`'ai'|'deterministic'`),
`extract`, `protocol` (`null` on caution), `timeline[]`, `offer` (`null` on caution;
`{ recommendedVariantId, recommendedPackLabel, sellingMode, sellingPlanId?, reasonForPack,
pricePerDay, daysSupply }`), `disclaimer`, `safetyFlags[]`, `cautionNote?`.

**When `outcome === 'caution'`**: render the honest "may not be right for you right now" outcome —
NO add-to-cart, NO celebratory motion, calm color shift. Show `copy.reasons` + `cautionNote`.

---

## Design principles (from research)

1. **Confidence over persuasion.** Every element resolves a specific doubt. No countdown timers,
   fake stock, or fake purchase pop-ups.
2. **Guided, not overwhelming.** Pre-select the most popular variant (Capsules / 1 Bottle is fine
   as default; tag a "Best value" on 3 Bottles). ~3–4 visible choices. Fit-check routes the unsure.
3. **Radical transparency = premium.** Show extract, mg, withanolide %, root-only, third-party COA
   high on the page. Transparency reads as luxury here.
4. **Honesty as a feature.** Realistic 6–8 week onset; real review count (4.7 / 213); explicit
   subscription terms + one-click cancel.
5. **Calm, deliberate motion.** Springs for interactive feedback (<~200ms), eased tweens for
   reveals. Motion confirms and guides; it never shows off or delays purchase.
6. **Ayurvedic warmth, modern clarity.** clay + forest + saffron; Marcellus display over Figtree
   body; editorial whitespace; plain-language, benefit-first copy.
7. **Accessible & performant.** Strict reduced-motion, 44px+ targets, visible focus rings, reserved
   heights (no layout shift), self-contained SVG art (no external images).

---

## PDP structure (top → bottom) — `src/app/page.tsx`

1. **Slim sticky header** — brand wordmark, cart icon with an animated badge, a one-line trust
   micro-strip (Third-party tested • cGMP • Vegan).
2. **Hero** — two columns on desktop, stacked on mobile:
   - Left: image gallery (thumbnails + main image; use the fixture's `product.images`; swap main
     image to the selected variant's image). Include a "video" affordance visually if you like.
   - Right: buy panel — title (Marcellus), real star rating + review count, benefit subhead
     (`product.subtitle`), a condensed safety micro-line (`product.safetyShort`), price (with honest
     compare-at strike when present), **Form** + **Pack** selectors as tappable buttons (from
     `product.options`/`variants`), Subscribe vs One-time toggle (from `product.sellingPlans`),
     cost-per-day + days-supply that update on selection, and the primary **Add to cart**.
     Handle the **unavailable variant** (Powder / 3 Pouches is out of stock): disable it, show
     "Out of stock", and never let it be added.
3. **Fit-check launcher** — a calm, prominent "Is this right for me?" entry directly under the buy
   panel. Opens the fit-check (modal/overlay or an in-page expanding panel — your call, make it feel
   premium). Its result binds back to the buy panel (pre-selects the recommended variant + mode).
4. **Benefit strip** — always-visible scannable cards from `product.benefits` (Stress, Sleep,
   Energy, Focus). Each asterisk-links to the disclaimer.
5. **Dosed transparency / Supplement Facts** — from `product.supplementFacts` (extract, mg,
   withanolide %, root-only, serving, vegan, allergens). Framed as facts, not efficacy.
6. **"What to expect" timeline** — from `product.expectations` (Week 1–2 / 3–4 / 6–8). Honest,
   gradual onset. Animate a progress line / count-up where tasteful.
7. **Trust & authenticity band** — `product.certifications` badges + a viewable heavy-metal COA
   affordance (link/modal is fine; content is illustrative) + money-back guarantee line.
8. **Reviews** — `product.reviews`; real aggregate (4.7 / 213). Lead with verified/`hasMedia`;
   support a goal filter ("from people who chose Stress like you"). Never fabricate counts.
9. **FAQ accordion** — `product.faqs` (grid-rows expand animation).
10. **Brand story** — `product.brandStory` (Kerala gardens, 80+ years, root-only).
11. **Sticky mobile buy-bar** — appears when the hero Add-to-cart scrolls out of view (use
    IntersectionObserver on the native button, NOT pixel offsets). Reserve height, no CLS.
12. **Compliance footer** — the verbatim DSHEA disclaimer (`product.disclaimer`), bold, near claims.

---

## The fit-check ("Is this right for me?") — the centerpiece

Render the `questions` flow (6 steps): **goals** (multi-select 1–4 icon tiles, choose a primary if
>1), **stress** (single-select), **experience** (single-select), **safety** (3 yes/no toggles on one
screen), **form** (single-select), **dose** (single-select). One question per screen, a persistent
"Step X of 6" progress bar, an expandable "Why we ask" line per question, and a persistent
"Just show me the product" escape hatch.

On finish, POST the assembled `FitCheckAnswers` to `/api/recommend` and render the result:
- **Match**: verdict headline + subcopy, a soft **match-strength meter** that counts up to
  `matchScore`, a "Why this fits you" recap (`copy.reasons`, staggered reveal), dosed transparency,
  protocol, timeline, and the recommended pack/subscription with `reasonForPack`. A prominent
  **"Add recommended pack to cart"** that pre-fills the buy panel and adds it.
- **Caution** (safety flag): the honest no-sale outcome — calm color shift, `copy.reasons` +
  `cautionNote`, a "talk to your doctor" note. No add-to-cart.
- **Adjust / retake**: let the shopper edit any answer and watch the recommendation re-compose
  (cross-fade; changed values animate). Show a small "personalized" badge and whether copy came from
  AI vs the template (`copySource`) — subtle, e.g. a tooltip; optional.

**States you MUST handle:** entry/launch, in-progress with inline validation (missing answer
nudges the question label + helper), **computing** (layout-matching skeleton with shimmer ONLY if
the request takes > ~350ms; under reduced-motion show static "Finding your match…"), result-match,
result-caution, adjust/retake, add-to-cart-from-result, and **error** (if the fetch itself fails —
show an inline retry; note the API already falls back to deterministic copy internally, so a 200
always carries a result).

---

## Micro-interactions (implement these specifically)

- **Variant / pack / subscription select:** snappy `spring.select` fill — ring/border grows, bg
  fills, checkmark scales in, `press` (0.97) on tap. Price, days-supply, cost-per-serving update
  instantly.
- **Fit-check option select:** tile fills with `spring.select` + checkmark; single-select
  auto-advances after ~250ms; multi-select allows up to the max and prompts a primary.
- **Step transition:** use `stepTransition` variants with `AnimatePresence mode="wait"`.
- **Computing:** skeleton + `animate-shimmer`, then cross-fade to result over ~200ms.
- **Recommendation change:** result card cross-fades; the match meter counts to the new value;
  recap re-renders with `staggerItem`.
- **Add to cart:** clone the product image and fly it to the cart icon (~500ms, `ease.standard`,
  ending scale 0 + fade); cart badge does a `spring.pop`; quantity counts up. Keep under ~600ms.
- **Cart drawer:** slides in with `drawerPanel`; line items stagger in; exit reverses.
- **Sticky buy-bar:** IntersectionObserver on the hero Add-to-cart; slide up with
  `ease.emphasizedDecelerate`; hide when the native button is visible (never two CTAs at once).
- **Reveal / count-up:** sections use `revealUp` with `whileInView` + `viewport={{ once: true }}`
  (never above the fold). Numbers (review count, withanolide %) count up on first view.
- **Errors:** add-to-cart failure → subtle 2-cycle shake + inline "Something went wrong — try
  again"; under reduced-motion, static red helper text instead of shake.
- **Hover/press:** buttons/cards `lift` + shadow over ~120ms, `press` on tap; accordion chevrons
  rotate; every interactive element has a `:focus-visible` ring (`shadow-ring` token).

**Reduced motion is a hard contract.** Use framer-motion's `useReducedMotion()`; when true, jump to
end states, skip shimmer/fly, and render final count-up values immediately.

---

## Cart (prototype — clearly mocked)

There is no real Shopify cart in the prototype. Build a small client-side cart (React context +
`useReducer`, no new dependency) holding line items `{ variantId, quantity, sellingMode }`. Add-to-cart
updates it and triggers the fly-to-cart + drawer. In the Shopify build this maps to the AJAX Cart
API — leave a one-line comment noting that. No checkout needed; the drawer can show a disabled
"Checkout" with a "(demo)" note.

---

## Product artwork — `public/images/*.svg`

Create tasteful, on-brand **SVG** art (self-contained, no external images) for each file the fixture
references. Use the clay/forest/saffron palette, botanical motifs, and a warm amber "bottle". Make
them look like intentional art direction, not clip-art:
`ashwagandha-bottle.svg`, `ashwagandha-bottle-duo.svg`, `ashwagandha-bottle-trio.svg`,
`ashwagandha-powder.svg`, `ashwagandha-root.svg`, `ashwagandha-facts.svg`,
`ashwagandha-ritual.svg`, `ashwagandha-coa.svg`. Each ~1200×1200 (or 4:3 for lifestyle). Use
`next/image` OR plain `<img>` with width/height set (reserve space, no CLS). Icons referenced by the
fixture (`leaf`, `moon`, `sun`, `sparkle`, `dumbbell`, `heart`, `capsule`, `powder`, `shield`,
`seed`, `flask`) should be small inline SVG components (make a `src/components/icons.tsx` map).

---

## Compliance (must-haves)

- Render the verbatim DSHEA disclaimer (`product.disclaimer`) visibly near claims (footer + link
  claims with `*`). It must not be hidden only inside a collapsed accordion.
- Benefit copy is already structure/function-safe — don't add disease/treatment claims, guarantees,
  or fabricated stats.
- Safety: show `product.safetyShort` near the buy box and `product.safetyFull` in a dedicated block.
- Label the experience as wellness guidance, not medical advice (a short line is enough).

---

## Engineering quality

- Clear component boundaries, sensible names, one component per file under `src/components/`.
- TypeScript strict — import shared types from `@/lib/types`. No `any` in component props.
- Handle missing/edge data defensively (e.g., variant with no `compareAtPrice`, out-of-stock).
- Keep dependencies to what's installed (React 19, next 15, framer-motion, tailwind). No new deps.
- Mobile-first and fully responsive. Test the layout at 375px and 1280px widths mentally.
- `npm run typecheck`, `npm run test`, and `npm run build` must stay green.

Build the whole thing coherently. When done, ensure the page composes and typechecks.
