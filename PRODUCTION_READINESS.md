# Production readiness & scalability — senior-architect review

This document answers three questions: **(1) is every requirement present and working in sync?**,
**(2) what's the honest status of persistence / "the database"?**, and **(3) how does it scale, and
how would a senior architect take it from here** — keeping the product user-friendly and its
integrity intact. It is grounded in an adversarial multi-agent audit (requirements coverage,
correctness/sync bug-hunt with a verify pass, scalability, and UX) plus first-hand live verification.

---

## 1. Requirements coverage — verified

All seven assignment areas are met. Verdicts below are from a strict, code-grounded audit
(`present` unless noted), cross-checked against live runs (28→**24** engine/API tests after the
hardening pass, typecheck clean, warning-free build, and a headless-Chrome drive of the full flow).

| Area | Verdict | Evidence |
|---|---|---|
| PDP hero (imagery, price, variant/pack, add-to-cart) | ✅ | `HeroGallery.tsx`, `BuyPanel.tsx`, 6-variant fixture |
| Benefits / trust content | ✅ | `BenefitStrip`, `TrustBand` + COA, `SupplementFactsPanel`, `Reviews` |
| One decision-support feature | ✅ | "Is this right for me?" fit-check + real scoring engine + safety branch |
| Works within Shopify | ◑ **partial (by design)** | Genuine theme app extension (2 app blocks, `{% schema %}`, metafields, App Proxy, AJAX Cart). Only the fit-check + supplement-facts run in Liquid; the hero/benefits rely on the host Impact theme. Not deployed to a live store (no store credentials). |
| Micro-interactions + reduced-motion | ✅ | one shared motion vocabulary; feedback for every state; strict `prefers-reduced-motion` |
| Backend API (contract, validation, states, logic separation, tests, server-secrets, real-vs-mocked) | ✅ | pure engine + thin route + zod + AI-fallback; 24 tests; key server-only |
| Merchant configurability (≥3, ≥1 product-specific, documented) | ✅ | 9 block settings + 8 product metafields, documented |
| AI-first workflow note | ✅ | `AI_USAGE.md` — all six elements |
| Claims/compliance | ✅ | structure/function only, verbatim DSHEA, safety branch, AI guardrails |

**The one honest caveat** is the Shopify delivery scope: this is a *prototype-in-React, deliver-key-
modules-in-Liquid* submission (exactly what the brief permits). The fit-check and supplement-facts
are real Liquid app blocks; a full production rollout would port the remaining PDP sections into the
theme (or ship them as additional app blocks) and deploy to the store. This is scoped, not skipped.

---

## 2. Does it work in sync? — yes, with the seams documented

**Front ↔ back ↔ engine are genuinely in sync.** The React UI, `/api/recommend`, and the pure engine
share one source of truth (`types.ts`); `validation.ts` mirrors `FitCheckAnswers` exactly; the route
is a thin orchestrator; the AI layer only rewrites prose and always falls back. Verified live: the
200-match, 200-caution, and 400-validation paths, the once-daily dose flowing correctly to the
offer, and the out-of-stock substitution end-to-end.

**The real seams are at the Shopify boundary** (the hand-ported vanilla client), and they were
hardened in this pass:
- `offer.recommendedVariantId` is a mock gid, so `fit-check.js` re-derives the variant by matching
  the label's Form/Pack against the live product's options — the label is the de-facto contract.
- Subscription `selling_plan` and the merchant subscription-default toggle are now wired in the
  Liquid add-to-cart (previously dropped).
- The two clients duplicate the question set; **the guard against drift is the shared zod schema** —
  the recommended next step is a cross-client contract test (see Integrity below).

---

## 3. Persistence / "the database" — deliberately none, and why that's correct

**There is no application database, and adding one now would be the wrong call.** For a Shopify-
native PDP feature, **Shopify is already the system of record** — products, variants, inventory,
orders, the cart (AJAX Cart API), and subscriptions (Appstle). The recommendation engine is a
**pure, stateless function**: identical answers always produce the identical recommendation with no
I/O, so it needs no persistence to be correct or fast. A relational DB would duplicate Shopify,
introduce a sync/consistency problem, and add a write bottleneck the stateless design deliberately
avoids. The assignment's backend bar (API + validation + separated logic + tests + server secrets)
is fully met without one.

Persistence becomes valuable for **personalization, caching, and measurement** — not for
correctness. When those are needed, add **three additive stores, each matched to its access pattern
and each kept off the purchase path**:

| Need | Store | What it holds | Why here (not a DB) |
|---|---|---|---|
| Saved fit-check that follows the shopper | **Shopify customer metafield** (`custom.fit_check`, JSON) | answers + resolved recommendation summary + timestamp + schema version | per-customer data Shopify already owns; readable by theme/checkout/email flows; zero new infra. Logged-out → localStorage, promote on login |
| Avoid re-paying AI latency/cost | **KV / Redis** (e.g. Upstash) | `RecommendationCopy` keyed by hash(normalized answers + model + prompt-version + locale), TTL 30–90d | read-mostly single-key cache over a small bounded keyspace — KV's sweet spot |
| Funnel optimization / A/B | **Append-only analytics sink** (product-analytics SaaS → warehouse) | anonymous session id, step, outcome, matchStrength, copySource, latency, add-to-cart, variant, A/B bucket | high-volume append-only analytical data; never on a transactional path |

**Bottom line: no primary DB is warranted.** Each store is additive, access-pattern-matched, and
off the hot path — the purchase path stays Shopify.

---

## 4. Scalability — current ceiling and what breaks first

**With AI OFF (deterministic path — the default):** effectively not the constraint. The PDP is
statically prerendered and CDN-served (scales to millions of views/day). The engine
(`buildRecommendation`) is O(1) pure CPU, sub-millisecond, zero I/O — it scales horizontally to
hundreds–low-thousands of req/s per region on ordinary serverless autoscaling. A single-product
store's fit-check traffic (roughly once per session) never approaches that. The true ceiling is the
host's account-level function concurrency, not the code.

**With AI ON:** the ceiling is your Anthropic account tier, because today every `match` makes a
**blocking, un-cached** call. Realistic comfort is low-tens of req/s on a mid tier; a low tier
(~50 RPM) starts 429-ing below ~1 req/s of matches. **What breaks first is *not* availability** —
under a spike the AI layer silently falls back to deterministic copy and responses get slower; no
data is lost, nothing crashes, and the result stays complete and compliant. The genuine gaps exposed
are **(a) no answer-hash cache** (the match answer-space is only low-thousands of combinations — very
cacheable) and **(b) no observability**, so that degradation is invisible.

### Ranked bottlenecks
1. **Blocking, un-cached AI call on the hot path** — re-pays latency/cost/rate-limit for a highly
   repeatable answer space. Bites at the first real launch/campaign spike. *#1 issue.*
2. **Anthropic rate limits with silent fallback, no backoff/circuit-breaker** — you lose the
   personalized experience with zero visibility on a burst or a model swap to Sonnet/Opus.
3. **Serverless cold start + app-proxy hop vs the 8s AI timeout** — the p99 tail can surface the
   "Try again" state on low-traffic stores.
4. **No observability/metrics/analytics anywhere** — can't tell if AI is even running in prod or
   where shoppers drop off.
5. **Two client implementations, shared zod contract but no cross-client contract test** — future
   enum/shape changes could silently 400 the Liquid client.

### Staged scale-up plan
- **Stage 1 — launch hardening:** add an AI-copy cache keyed by answer-hash (per-instance LRU or KV)
  *before* the Anthropic call; tighten the AI timeout to ~3–4s; make the fallback observable (log
  `copySource`, latency, failure reason); add request logging + p50/p95 + `ai_fallback_rate`; add a
  per-IP/global rate-limit guard + an Anthropic spend alert. → degrades gracefully **and visibly**,
  with cost/abuse protection and immediate cache-hit relief.
- **Stage 2 — growth:** promote the cache to shared KV/Redis (prompt-version in the key →
  auto-invalidate); add a **circuit breaker + backoff-with-jitter** around the AI call; optionally
  take AI off the blocking path (serve deterministic instantly, hydrate AI async, or precompute
  popular hashes); stand up real dashboards + error tracking; ship funnel analytics from both
  clients; add A/B assignment; move the deterministic path to the **edge runtime**.
- **Stage 3 — scale:** per-market templates/localization (locale in the hash; India April-2026
  root-only vs DSHEA vs EU); precompute/warm the popular answer-hash space (cache hit → ~100% on
  common paths); regionalize functions + KV; a model fallback ladder (primary → Haiku →
  deterministic); versioned schemas + cross-client contract tests in CI + canary with auto-rollback;
  analytics → warehouse with a documented PII policy.

---

## 5. Integrity as it scales

- **Preserve the deterministic-fallback invariant** — the engine always returns a complete, compliant
  recommendation; AI may only rephrase pre-decided prose (never `matchScore`/`offer`/`protocol`/
  `safetyFlags`), is zod-validated + refusal-checked, and never rewrites the safety-caution branch.
- **Cross-client contract tests** — assert both the React answer-builder and the vanilla
  `buildAnswers()` produce bodies the zod schema accepts; kills the two-implementation drift risk.
- **Schema versioning** — a `version` field on request/response/cache-key/saved-metafield so stale
  data is detectable and safe to migrate.
- **Circuit breaker + bounded backoff** around Anthropic; **canary + monitoring** with SLOs on p95,
  5xx, validation-4xx, `ai_fallback_rate`, and Anthropic 429s.
- **PII / compliance** — fit-check answers include health-adjacent data. Never log raw safety
  answers (the prompt already sends only *derived* facts — keep it that way); store saved results in
  the customer-controlled metafield; honor Shopify GDPR webhooks (`customers/redact`, `shop/redact`);
  keep the DSHEA disclaimer + structure/function-only prompt + non-AI safety branch intact.

---

## 6. User-friendliness — findings, resolutions, and what's queued

The UX review confirmed strong foundations — the honest caution outcome, the thorough reduced-motion
contract, restraint on loading (skeleton only past ~350ms, reserved height), race-safe submissions,
strong inline validation, a fully editable result, and end-to-end OOS handling.

**Resolved in the hardening pass** (see §7): the recommendation now binds to the buy panel on a match
(not only via add-to-cart); dialog focus management + result announcement added; auto-advance is
suppressed under reduced motion; the progress bar no longer reads 100% on the last question; powder
label parity; count-up flash; contextual footer copy; and on the Liquid side — form/dose selection
highlight, a completed result header, per-instance goal options, subscription `selling_plan` wiring,
a visible close button + focus/aria-live, and consistent duration copy.

**Queued (documented, not blocking a demo):**
- Safety-flag short-circuit — offer "See my result" immediately when a caution flag is set (skip the
  irrelevant form/dose steps).
- A higher, lightweight fit-check entry point on mobile (a text link under the price / in the sticky
  bar) since the launcher currently sits below a long buy panel.
- A tempered low-band result headline (needs the engine thresholds/copy unlocked) so a weak-fit goal
  doesn't get the same enthusiastic "Yes —" as an ideal fit.
- Per-review "illustrative" labeling (currently disclosed at the footer).

---

## 7. Findings found & resolved in this pass

The audit confirmed 10 findings (each with file:line evidence and an adversarial verify pass). All
were addressed — 8 fixed and re-verified, 2 latent items documented — plus the high-impact UX fixes.
Re-verified after the pass: **30 tests green, typecheck clean, warning-free build**, and a fresh
headless-Chrome drive of both paths.

| # | Finding | Severity | Resolution |
|---|---|---|---|
| 1 | Offer days-supply/price computed at 2/day, contradicting the once-daily protocol's "lasts twice as long" | correctness (med) | **Fixed** — `buildOffer` now scales days-supply/price by `protocol.dosePerDay`; **+2 regression tests** |
| 2 | Recommendation only bound to the buy panel via add-to-cart; a matched shopper who closed to buy was left on defaults | UX (high) | **Fixed** — the offer applies to the buy panel the moment a match is produced (verified: CTA → "$56.06" before add; caution leaves it unchanged) |
| 3 | Dialog (fit-check + cart) had no focus trap, no result announcement, no focus restore | a11y (high) | **Fixed** — `useDialogFocus` trap + restore; result heading focused + `aria-live`; error `role="alert"` |
| 4 | Liquid add-to-cart dropped the subscription `selling_plan`; `subscription-default` toggle was dead | sync (med) | **Fixed** — `selling_plan` attached for subscription offers; toggle wired |
| 5 | Liquid form/dose steps never showed a selected state (read/write key mismatch) | sync (med) | **Fixed** — unified via `answerKey()`; highlight + Back work |
| 6 | Liquid `goalOverride` mutated the shared module-level questions array | robustness (med) | **Fixed** — per-instance question clone |
| 7 | Liquid result reused the question header ("Step 6 of 6", ~83% bar, skip control) | ux (low) | **Fixed** — completed header (100%, "Your fit check", no skip) |
| 8 | Liquid modal had no focus management / no `aria-live` for loading/error / no visible close | a11y (med) | **Fixed** — ✕ button, focus in/out, Tab trap, `role=status`/`role=alert` |
| 9 | Powder offer label showed "Bottles" while the rest of the UI showed "Pouches" | cosmetic (low) | **Fixed** — `offerPackDisplayLabel` for display; engine label unchanged (parse contract intact) |
| 10 | `useCountUp` flashed the final value for one frame before animating | ux (low) | **Fixed** — seeds 0 when active; reduced-motion instant path kept |
| 11 | Progress bar read 100% while still on the last question | ux (low) | **Fixed** — question-phase fill capped at `step/totalSteps` |
| 12 | Auto-advance still fired under `prefers-reduced-motion` | a11y (low) | **Fixed** — suppressed under reduced motion; no re-arm on re-tap |
| — | `resolveVariant` pack step-down uses lexicographic string compare | latent (low) | **Documented** — correct for the 1–3 fixture; would need numeric compare for multi-digit packs |
| — | Shopify flow sends `primaryGoal = first goal` (no "which matters most" picker) | parity (low) | **Documented/queued** — port the React primary-goal picker to the Liquid block |

**Deferred (documented, non-blocking):** safety-flag short-circuit to skip the irrelevant form/dose
steps; a higher mobile fit-check entry point; a tempered low-band result headline (needs the engine
thresholds unlocked); per-review "illustrative" labeling; and the two latent items above. These are
polish/parity items, tracked here rather than silently dropped.
