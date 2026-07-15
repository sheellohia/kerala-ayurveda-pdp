# AI usage note

This build used AI heavily and deliberately. The goal was to direct the tools, verify their output,
and keep ownership of the result — not to hand over judgment.

## Tools used and where they saved meaningful time

- **Claude Code (Opus 4.8)** as the driver: orchestration, backend engineering, the Shopify theme
  app extension, tests, and this documentation.
- **A multi-agent research workflow** (5 parallel researchers + a synthesis pass) to ground the
  design in reality instead of taste. It audited Kerala Ayurveda's *live* store, catalogued the
  decision-confidence gaps on supplement PDPs, studied the premium-motion bar (seed.com et al.),
  surveyed best-in-class "fit-check"/quiz patterns, and pinned down Ashwagandha claims-compliance.
  This is where AI saved the most time — it turned a day of manual competitive research into a
  grounded, cited brief in minutes, and it surfaced facts I'd have missed (their PDP is currently
  **sold out with add-to-cart disabled**; the store is Impact 6.3.0 with Appstle/Ryviu/Peppy
  installed; `quiz_config` is `is_active:false`).
- **Claude Fable 5** for the front-end craft: components, micro-interactions, the fit-check UI, and
  the SVG product artwork — built against a locked contract (types, API, design tokens) and a
  detailed `DESIGN_SPEC.md` I authored.
- **The `claude-api` skill** to get the Anthropic Messages API details exactly right (model IDs,
  headers, model-agnostic request shape) for the optional AI-copy layer.

## One AI-generated suggestion I rejected, and why

The research brief recommended **defaulting every shopper — including first-timers — into a
Subscribe & Save plan** ("default a clearly-labeled subscription... the smallest one-off is always
framed as 'needs a full cycle'"). I rejected the first-timer part. Ashwagandha is explicitly framed
as taking 6–8 weeks to judge; auto-defaulting a brand-new buyer into a recurring charge before
they know it works reads as a dark pattern and invites refunds and chargebacks. The engine instead
recommends a **one-time full-cycle trial for new users** and only recommends a subscription for
shoppers who say they've used it before (`experience !== 'new'`). Subscription is always *offered*,
never *defaulted* onto a first purchase. (See `recommendedPackBottles`/`buildOffer` in
`src/lib/fit-check/engine.ts`.)

## One implementation/content I corrected materially

**Claims compliance.** The live store's trust line says "FDA Compliant," which directly contradicts
the mandatory DSHEA disclaimer ("not evaluated by the FDA"). Early drafted marketing copy drifted
toward benefit language that implied treatment. I rewrote all product copy to **structure/function
framing only** ("helps your body handle everyday stress"), added the **verbatim DSHEA disclaimer**
near every claim, standardized the SKU on **KSM-66 root-only** extract (which also satisfies India's
April-2026 root-only rule), and built a mandatory **safety branch** into the recommendation engine
so anyone who flags pregnancy/thyroid/sedative use gets an honest "this may not be right for you
right now — talk to your doctor" outcome with **no add-to-cart**. All benefit/dose/percentage
figures are labeled illustrative pending on-file substantiation.

## One example prompt / workflow

The market-research workflow fanned out five researchers, each returning a validated JSON schema,
then a synthesis agent merged them into a single design brief:

```
phase('Research')
const results = await parallel(DIMENSIONS.map((d) => () =>
  agent(d.prompt, { schema: RESEARCH_SCHEMA, agentType: 'general-purpose' })))

phase('Synthesize')
const brief = await agent(`Synthesize the raw research into a grounded DESIGN BRIEF ...`,
  { schema: BRIEF_SCHEMA })
```

Each researcher prompt began: *"First call ToolSearch to load the web tools, then use WebSearch +
WebFetch to gather REAL, current information. Cite URLs. If a page can't be fetched, say so and fall
back to search snippets — never fabricate specifics."* — an explicit anti-hallucination instruction
because the whole point was grounding.

## How I verified generated code and product content

- **Automated tests**: 22 unit tests on the pure recommendation engine (goal mapping, score bands,
  the safety branch, pack logic, and the out-of-stock variant substitution) + 6 API contract tests
  (200 match, 200 caution, 400 validation, malformed JSON). `npm run test` is green.
- **Types + build**: `npm run typecheck` and `npm run build` must pass; the Fable UI agent was told
  to run these itself and iterate until green.
- **Running the app**: I drove the real flow end-to-end (variant/pack selection, the full fit-check
  including the safety branch, add-to-cart, cart drawer, and error/loading states) rather than
  trusting tests alone.
- **Content**: cross-checked benefit/safety/dose claims against the compliance guardrails; every
  research finding carried a source URL; illustrative figures are labeled as such.
- **AI-copy safety**: the AI layer only *rephrases* facts the deterministic engine already decided,
  is constrained by a structure/function-only system prompt, is validated with zod, and falls back
  to deterministic copy on any error — so the API can never surface an unvalidated health claim.

## Where AI helped with React/Next.js → Liquid conversion

The React prototype and the Shopify theme app extension **share one contract**: the same
`FitCheckAnswers` → `/api/recommend` → `Recommendation` shape and the same question set. I directed
Fable 5 to build the React experience, then authored the Liquid app block + `fit-check.js` myself as
a hand-verified port of that flow — same steps, same states, same API call — swapping React state
for vanilla DOM and the prototype's mock cart for Shopify's real `/cart/add.js`. Keeping the
contract identical is what made the "prototype in React, deliver in Liquid" path honest rather than
two diverging implementations.

## What I'd improve or build next

- Replace the SVG placeholder artwork with real product photography from the Shopify CDN.
- Persist saved fit-check answers to a customer metafield so the recommendation follows the shopper.
- Wire the recommended subscription to Appstle's real `selling_plan` id in the Liquid add-to-cart.
- Add analytics on fit-check completion/drop-off per step, and A/B the one-time-vs-subscription
  default.
- Feed real, substantiated clinical figures (with citations) into the "what to expect" module once
  legal sign-off exists.
