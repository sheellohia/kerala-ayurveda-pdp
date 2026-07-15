# Demo walkthrough script (~3 min) — LOCAL ONLY

Record the walkthrough running **entirely on your machine** — no deployment needed.

**Setup before recording:**
```bash
npm install      # first time only
npm run dev      # serves http://localhost:3000
```
Open **http://localhost:3000** in the browser, empty the cart, and record that tab. Everything below
happens locally. (Optional: set `ANTHROPIC_API_KEY` in `.env` first if you want to show the AI-refined
copy path — the "Under the hood" panel will read `copySource: AI-refined`; otherwise it shows
`deterministic template`, which is the honest default.)

---

**[0:00–0:20] The problem**

> "I audited Kerala Ayurveda's real store first: their Ashwagandha page is sold out with add-to-cart
> disabled, benefits and dosage are buried in accordions, there are no supplement facts, and there's
> zero decision support. So I rebuilt the PDP around the one question a shopper actually has —
> *is this right for me?* This is all running locally on localhost:3000."

**[0:20–0:50] Hero + buy panel**

> "Everything's above the fold: real rating, a plain-language benefit line, the safety note up front,
> and the transparency that reads as premium — KSM-66, root-only, standardized. Form and pack are
> tappable buttons with cost-per-day and days-supply, and an honest subscribe toggle — 15% off,
> cancel anytime."
>
> *(Click Powder, click 3 Bottles, toggle Subscribe — point out the spring fills and the live price.)*

**[0:50–2:05] The fit-check — the centerpiece**

> "Here's the decision support. Six questions, one per screen, with a progress bar, a 'why we ask'
> line, and a persistent escape hatch."
>
> *(Answer: Stress → Frequently wired → Tried some → all No on safety → Not sure → Whatever works.)*
>
> *(On the result:)* "This is a real, confidence-scored recommendation — a strong match that counts
> up, a 'why this fits you' recap in the shopper's own words, the exact dose and protocol, an honest
> 6–8 week timeline, and the pack that fits: the 3-bottle subscription. Every answer is editable —"
>
> *(Edit an answer; show the result re-compose + meter re-count.)*
>
> **NEW — show the technical panel for the reviewer:** *(scroll to the bottom of the result, expand
> "Under the hood — how this was computed")* "For the technical side: this is the exact JSON I POST to
> `/api/recommend`, the response — matchScore, matchStrength, whether the copy came from the
> deterministic template or the AI layer — and the real latency. A pure engine decides every number;
> the AI only rephrases and falls back. Watch it update live as I edit an answer."
>
> *(Close the fit-check via "Done — back to the product"; note the buy panel is now pre-filled to the
> recommended 3-bottle subscription with a highlight.)* "Notice it bound my recommendation straight
> to the buy panel." *(Then Add to cart → fly-to-cart → cart drawer at the discounted total.)*

**[2:05–2:30] The safety branch**

> "The honest part. If someone flags pregnancy, a thyroid condition, or sedatives, we stop — a calm
> 'this may not be right for you right now, talk to your doctor first' outcome, with no add-to-cart.
> Trustworthy over the sale. Structure/function language only, FDA disclaimer right there."

**[2:30–2:55] Backend + Shopify (show the editor / terminal)**

> "The recommendation logic is a pure, deterministic engine — 30 tests, typecheck and build clean.
> The API validates with zod and layers optional Claude copy on top, key server-side, with a full
> deterministic fallback so it can never surface an unverified claim. And it genuinely ships to
> Shopify: a theme app extension with app blocks the merchant drops on the product page, schema
> settings and product metafields they edit with no code, calling the same API and the real cart."
>
> *(Optionally show `npm run test` printing 30 passed, and the `shopify/` folder.)*

**[2:55–3:10] AI workflow + close**

> "AI-first throughout: a multi-agent research workflow grounded the design in the real store; I used
> Fable 5 for the UI craft against a locked contract; and I ran an adversarial multi-agent audit, then
> fixed every confirmed finding and re-verified in a real browser. One suggestion I rejected: defaulting
> first-timers into a subscription — I made new users get a one-time trial instead, because it's honest.
> That's the whole ethos: confidence over persuasion. Thanks for watching."
