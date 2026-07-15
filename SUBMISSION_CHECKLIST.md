# Submission checklist — what's done and what's pending

A round-of-check against the assignment deliverables, so nothing is missed before sending.

## Required deliverables

| Deliverable | Status | Notes |
|---|---|---|
| **Working demo / preview** | ✅ Live + local | **Live:** https://kerala-ayurveda-pdp.onrender.com (Render; first load after idle cold-starts ~30–60s). Local: `npm run dev` → `http://localhost:3000`. |
| **GitHub repository** | ◑ Ready to push | Committed locally to the **`demo/kerala-ashwagandha-pdp`** branch. Pushing to GitHub needs your account/remote — see "Pending (you)" below. |
| **README** | ✅ | `README.md` covers setup, Shopify install, merchant config, architecture, API, time spent, tradeoffs, testing, performance, limitations, real-vs-mocked. Plus `shopify/README.md`, `DESIGN_SPEC.md`, `PRODUCTION_READINESS.md`. |
| **2–4 min Loom walkthrough** | ⏳ Pending (you) | Script ready in `LOOM_SCRIPT.md` — local-only, ~3 min. **I can't record video; you record it from the running local app.** |
| **AI usage note** | ✅ | `AI_USAGE.md` — tools, a rejected suggestion, a corrected item, example prompt, verification, React→Liquid. |

## Requirement areas — all met (verified)

- ✅ Shopify PDP hero (imagery, price, variant/pack, add-to-cart), benefits/trust, one decision-support feature.
- ✅ Frontend craft + micro-interactions + strict reduced-motion.
- ✅ Backend API (contract, zod validation, all states, logic separated from route, **30 automated tests**, server-only secret, real-vs-mocked stated).
- ✅ Shopify theme app extension (2 app blocks, schema settings, product metafields — merchant-configurable, ≥1 product-specific, documented).
- ✅ Engineering quality, performance & reliability (OOS substitution, AI fallback, no CLS).
- ✅ Compliance (structure/function only, verbatim DSHEA, safety no-sale branch).
- ✅ NEW: interactive "Under the hood" technical panel in the fit-check result (live request/response + latency + how-it-works) for the technical reviewer.
- ✅ Adversarial audit run; all confirmed findings fixed + re-verified (see `PRODUCTION_READINESS.md` §7).

## Verified green
`npm run typecheck` (0 errors) · `npm run test` (30 passed) · `npm run build` (warning-free) · full flow driven in headless Chrome (match + caution + add-to-cart + the technical panel).

## Pending — human steps only (I can't do these for you)
1. **Record the Loom video** (~3 min) from the local app using `LOOM_SCRIPT.md`.
2. **Push the branch to GitHub** — create a repo, then:
   ```bash
   git remote add origin <your-repo-url>
   git push -u origin demo/kerala-ashwagandha-pdp
   ```
3. *(Optional)* Set `ANTHROPIC_API_KEY` in `.env` to demo the AI-refined copy path (panel shows `copySource: AI-refined`).
4. *(Optional)* Deploy the prototype (Vercel) for a hosted link, and install the Shopify extension on a Partner dev store per `shopify/README.md`.

## To view the app right now
- **Live:** https://kerala-ayurveda-pdp.onrender.com (allow ~30–60s if it's cold).
- **Local:** `npm run dev` → **http://localhost:3000**.
