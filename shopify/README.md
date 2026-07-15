# Shopify Theme App Extension — install & merchant guide

This is the genuine Shopify delivery vehicle for the Ashwagandha PDP enhancement. It layers two
**app blocks** onto the store's existing product template (Kerala Ayurveda runs the Maestrooo
**Impact** theme) via the Theme Editor — no theme code is edited, and the existing apps (Appstle for
subscriptions, Ryviu for reviews, Peppy for back-in-stock) keep working alongside it.

```
shopify/
├── extensions/kerala-fit-check/
│   ├── shopify.extension.toml          # theme app extension config
│   ├── blocks/
│   │   ├── fit-check.liquid            # "Is this right for me?" app block (+ {% schema %})
│   │   └── supplement-facts.liquid     # metafield-driven facts app block
│   ├── assets/
│   │   ├── fit-check.js                # flow runtime; POSTs to the recommend API; /cart/add.js
│   │   └── fit-check.css               # self-contained, accent-driven styles
│   └── locales/en.default.json
└── metafields/definitions.json         # product metafields the blocks read
```

## What's real vs mocked

- **Real Shopify concepts:** theme app extension layout, app blocks with `{% schema %}` settings,
  `{% schema %} target: section`, product metafields via `product.metafields.custom.*`, the AJAX
  **Cart API** (`/cart/add.js`), App-Proxy-based API calls, `shopify:section:load` re-init, and
  reuse of the installed Appstle/Ryviu/Peppy apps.
- **Mocked / requires your store:** the extension isn't deployed to a live store here (no store
  credentials). To see it live you install it on a Partner dev store (steps below). The recommend
  API is the Next.js `/api/recommend` route — point the block at it via an App Proxy.

## Prerequisites

- A [Shopify Partner](https://partners.shopify.com) account and a development store (ideally a copy
  of the Impact theme).
- [Shopify CLI](https://shopify.dev/docs/api/shopify-cli) (`npm i -g @shopify/cli @shopify/theme`).
- The recommend API deployed somewhere reachable (e.g. the Next.js prototype on Vercel), or run
  locally and tunnelled.

## Install

1. **Create/link an app** that will host the extension:
   ```bash
   shopify app init          # or: shopify app dev  (in an existing app)
   ```
   Copy `shopify/extensions/kerala-fit-check/` into your app's `extensions/` directory.

2. **Push & deploy the extension:**
   ```bash
   shopify app dev           # live-preview on your dev store while developing
   shopify app deploy        # publish a version
   ```

3. **Configure an App Proxy** (App setup → App proxy) so the storefront can call your API
   same-origin without CORS:
   - Subpath prefix: `apps`, Subpath: `kerala`
   - Proxy URL: `https://<your-deployed-app>/api/recommend`
   - The block then POSTs to `/apps/kerala/recommend`, which Shopify forwards to your API.
   - Alternatively, set the block's **Recommendation API endpoint** setting to the full HTTPS URL of
     your deployed `/api/recommend` (add CORS headers on the route in that case).

4. **Create the product metafields** from `shopify/metafields/definitions.json`
   (Admin → Settings → Custom data → Products), then fill them on the Ashwagandha product.

5. **Add the blocks to the product template** (Theme Editor → Product page → *Add block* → *Apps*):
   add **Fit-Check** near the buy button, and **Supplement Facts** in the details area.

## Merchant configuration (no code)

**At least three editable properties, at least one product-specific — all met:**

| Where | Property | Type | Scope |
|---|---|---|---|
| Fit-Check block settings | Heading, Subheading, Button label | text | Global (per block) |
| Fit-Check block settings | Accent color | color | Global |
| Fit-Check block settings | Recommendation API endpoint | url | Global |
| Fit-Check block settings | Default to Subscribe & Save | checkbox | Global |
| Fit-Check block settings | Show match-strength meter | checkbox | Global |
| Fit-Check block settings | Compliance disclaimer | richtext | Global |
| Product metafield | `custom.fit_check_goals` | json | **Product-specific** |
| Product metafield | `custom.safety_note` | text | **Product-specific** |
| Product metafield | `custom.extract_name`, `mg_per_serving`, `withanolide_percent`, `plant_part`, `vegan`, `coa_url` | mixed | **Product-specific** |

So a content manager can re-word the launcher, recolor it, toggle the meter, edit the disclaimer,
and — per product — change the goal options, safety note, and the entire Supplement Facts panel,
entirely from Admin and the Theme Editor.

## How the fit-check works on the storefront

1. The block renders a launcher and a JSON island with the product's variants + settings.
2. `fit-check.js` runs the 6-step flow, assembles a `FitCheckAnswers` object, and POSTs it to the
   configured endpoint (same contract as the prototype).
3. The API returns a `recommendation`. On a **match** it renders the verdict, match meter, "why this
   fits you" recap, protocol, and the recommended pack with an **Add to cart** that maps the
   recommendation's Form × Pack to the store's real variant and calls `/cart/add.js`. On a
   **safety-caution** it shows the honest no-sale outcome with no add-to-cart.
4. It dispatches `cart:refresh` so the theme's cart drawer updates.
