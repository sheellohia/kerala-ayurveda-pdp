# Kerala Ayurveda — Ashwagandha PDP

A premium, Shopify-native product detail page enhancement for **Kerala Ayurveda Ashwagandha**,
built to move a shopper from **confusion → confidence**. The centerpiece is an
**"Is this right for me?" fit-check** backed by a real recommendation engine.

Two surfaces, one shared contract:

- **Next.js prototype** — the polished, deployable demo (all micro-interactions live here).
- **Shopify theme app extension** — the genuine delivery vehicle: Liquid app blocks + schema
  settings + product metafields that layer onto the store's existing Impact theme. It calls the
  **same** recommendation API and uses the real AJAX Cart API. See [`shopify/README.md`](shopify/README.md).

> Grounded in research of the *live* store (`keralaayurveda.store`): its Ashwagandha PDP is
> currently **sold out with add-to-cart disabled**, hides benefits/dosage in accordions, has no
> supplement facts, weak trust, and **no decision support** (`quiz_config: is_active:false`). This
> build fixes each of those gaps. Full brief context in the git history / `DESIGN_SPEC.md`.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

That's it — the prototype runs fully **without any API key** (the recommendation engine is
deterministic). To enable the optional AI-refined copy layer:

```bash
cp .env.example .env
# set ANTHROPIC_API_KEY=...   (stays server-side; never shipped to the client)
```

Other scripts: `npm run build`, `npm run start`, `npm run typecheck`, `npm run test`.

---

## Architecture

**One shared domain model + a pure recommendation engine, rendered through two surfaces.** The
engine is deterministic and unit-tested; AI only *rephrases* copy on top of it, so the logic stays
reliable, testable, and compliant.

```
src/
├── lib/
│   ├── types.ts                 # domain model (Shopify-shaped Product + fit-check + Recommendation)
│   ├── validation.ts            # zod schema for the API request
│   ├── motion.ts                # ONE shared motion vocabulary (springs/easings/variants)
│   ├── format.ts, hooks.ts, cart.tsx   # client helpers (money, count-up, cart context)
│   ├── fit-check/
│   │   ├── questions.ts         # the 6-step flow (single source of truth; portable to Liquid)
│   │   ├── engine.ts            # PURE recommendation logic — no I/O, fully testable
│   │   └── engine.test.ts       # 22 unit tests
│   └── ai/copy.ts               # optional Claude copy layer (server-only key, deterministic fallback)
├── app/
│   ├── api/recommend/route.ts   # thin orchestrator: validate → engine → (AI copy) → JSON
│   ├── api/recommend/route.test.ts  # 6 API contract tests
│   └── page.tsx                 # thin server component → <PdpExperience/>
├── components/                  # 25 UI components (hero, buy panel, fit-check, cart, …)
└── data/product.ts              # MOCKED Ashwagandha fixture (Storefront-API shaped)

shopify/                         # Shopify theme app extension (see shopify/README.md)
```

**Boundaries that matter:**
- Business logic (`engine.ts`) is separate from the route and has zero dependencies on Next/HTTP.
- The AI layer is isolated and *fails safe* — any error/timeout/refusal returns deterministic copy.
- The Liquid app block reuses the exact same request/response contract as the React prototype.

---

## The backend feature

**`POST /api/recommend`** — takes the shopper's fit-check answers and returns a personalized,
confidence-scored recommendation.

**Request** (`FitCheckAnswers`):
```json
{
  "goals": ["stress", "sleep"], "primaryGoal": "stress",
  "stressLevel": "frequent", "experience": "some",
  "safety": { "pregnancyOrNursing": false, "thyroidOrAutoimmune": false, "sedativesOrLiver": false },
  "formPreference": "no-preference", "dosePreference": "no-preference"
}
```

**Responses:**
- `200 { recommendation }` — a `match` (verdict, `matchScore` 0–100, dose/extract, protocol,
  timeline, recommended pack + offer) or a `caution` (safety branch — no offer, no add-to-cart).
- `400 { error, issues }` — zod validation failed (empty goals, bad enum, `primaryGoal` not in
  `goals`, malformed JSON).
- `500 { error }` — unexpected.

**Why it's meaningful, not a static response:** the engine computes a real `matchScore` from
evidence-informed goal-fit weights + stress level + experience, maps experience/stress to a pack
size, chooses a dose from goal + preference, and **degrades gracefully when the ideal variant is out
of stock** (honors form, steps the pack down, falls back to capsules). Any triggered safety flag
short-circuits to an honest no-sale outcome *before* any product push. AI copy (when a key is set)
only rewrites the prose within a structure/function-only system prompt, validated with zod.

---

## Shopify implementation & merchant configurability

Delivered as a **theme app extension** with two app blocks a merchant drops onto the product
template — no theme code edits. Full install + config guide: **[`shopify/README.md`](shopify/README.md)**.

**Merchant-editable without code (≥3 required; many provided, ≥1 product-specific):**

| Where | Examples | Scope |
|---|---|---|
| Fit-Check block settings | heading, subheading, button label, accent color, API endpoint, subscribe-default, match-meter toggle, disclaimer | Global |
| Product metafields (`custom.*`) | `fit_check_goals`, `safety_note`, `extract_name`, `mg_per_serving`, `withanolide_percent`, `plant_part`, `vegan`, `coa_url` | **Product-specific** |

So a content manager re-words/recolors the launcher, edits the compliance disclaimer, and — per
product — changes the goal options, safety note, and the entire Supplement Facts panel, all from
Shopify Admin + the Theme Editor. Metafield definitions: `shopify/metafields/definitions.json`.

---

## Frontend craft & micro-interactions

One shared motion system (`src/lib/motion.ts`) — physics springs for interactive feedback, eased
tweens for reveals, nothing that delays purchase. Implemented: spring selection fills + checkmarks,
one-question-per-screen step transitions, a computing skeleton (only past ~350ms), a match-strength
**count-up meter**, recommendation re-compose on answer edits, **fly-to-cart + badge pop**, cart
drawer, an IntersectionObserver **sticky buy-bar**, scroll reveals, error shake, and hover/press
lifts with visible focus rings. **Strict `prefers-reduced-motion` contract** throughout (jumps to
end states, no shimmer/fly, instant count-ups).

---

## Performance & reliability decisions

- **Self-contained SVG artwork** (no external images) → instant load, no CLS, no broken-image risk.
  Fonts load via `<link>` with `preconnect` + CSS-var fallbacks (no build-time font fetch).
- Static-prerendered PDP; `/` first-load JS ~166 kB. `outputFileTracingRoot` pinned for
  deterministic builds.
- **Failure handling**: AI copy falls back to deterministic; out-of-stock variants are disabled and
  the engine substitutes; the fit-check handles loading/empty/error/validation states; missing
  `compareAtPrice`/optional data is handled defensively.
- API key stays server-side; request sends no model-specific params so it works on any Claude model.

---

## Testing

```bash
npm run test        # 28 tests: 22 engine unit + 6 API contract
npm run typecheck   # strict TS, 0 errors
npm run build       # production build
```

The engine tests cover goal mapping, score bands, the safety branch, pack logic, and OOS
substitution. The API tests cover 200-match, 200-caution, and 400-validation paths (AI key stubbed
empty, so they never hit the network). Beyond automated tests, the full flow was driven in a real
headless browser — match and caution paths, add-to-cart with correct discounted pricing, and the
sticky buy-bar — with screenshots reviewed (see the walkthrough).

---

## Time spent

~1 focused, AI-parallelized working session. Rough split: research + brief (parallel workflow) ·
backend engine + API + tests · design-system foundation · UI build (Fable 5, in parallel with) the
Shopify extension · integration, live browser verification, and docs. The multi-agent research and
the parallel UI/Liquid builds compressed what would be ~2–3 engineer-days of manual work.

---

## What's real vs mocked

| Real | Mocked / illustrative |
|---|---|
| Recommendation engine logic + scoring + safety branch | Product data (SKU count, $ prices, review counts) in `src/data/product.ts` |
| API contract, zod validation, all states | Extract specifics (KSM-66, 600 mg, 5% withanolides) — assumed, pending substantiation |
| AI copy layer (real Anthropic call when key set; deterministic otherwise) | The product is modeled **in stock** (the live store's sold-out state is treated as a bug to fix) |
| Shopify theme app extension: app blocks, `{% schema %}`, metafields, `/cart/add.js` | Not deployed to a live store (no store credentials) — install steps provided |
| Micro-interactions, reduced-motion, responsiveness | Prototype cart (client-side; maps to the AJAX Cart API in the Liquid path) |

All benefit/dose/percentage figures and safety wording are **illustrative** and must be confirmed
with regulatory/legal counsel and backed by on-file evidence before publishing. See
[`AI_USAGE.md`](AI_USAGE.md) for the AI-first workflow note.

---

## Limitations & next steps

- SVG placeholder artwork stands in for real product photography.
- Subscription add-to-cart in the Liquid path adds the variant; wiring the actual Appstle
  `selling_plan` id is a documented follow-up.
- No persistence — a saved fit-check could live on a customer metafield.
- India (FSSAI) compliance guidance is included but the India storefront needs its own per-market
  template.

## Deliverables

- **Live demo**: **https://kerala-ayurveda-pdp.onrender.com** (Render free tier — the first load after idle cold-starts for ~30–60s, then it's fast).
- **Run locally**: `npm run dev` → http://localhost:3000. Hosted via the included `render.yaml` blueprint (Render → New → Blueprint → connect this repo/branch).
- **Repository**: this repo (committed to the `demo/kerala-ashwagandha-pdp` branch).
- **README**: this file. **AI usage note**: [`AI_USAGE.md`](AI_USAGE.md).
- **Shopify guide**: [`shopify/README.md`](shopify/README.md). **Build brief**: `DESIGN_SPEC.md`.
- **Production readiness & scalability**: [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md).
- **Demo script (local-only)**: [`LOOM_SCRIPT.md`](LOOM_SCRIPT.md). **Submission checklist**: [`SUBMISSION_CHECKLIST.md`](SUBMISSION_CHECKLIST.md).
