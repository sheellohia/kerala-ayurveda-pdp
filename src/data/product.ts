import type { Product, ProductVariant, SellingPlan } from '@/lib/types';

/**
 * MOCKED product fixture for the prototype, shaped like the Shopify Storefront
 * API `Product`. Modeled on Kerala Ayurveda's real US SKU
 * (keralaayurveda.store/products/ashwagandha-60-capsules) but with the gaps the
 * research surfaced filled in and standardized on a KSM-66 root-only extract.
 *
 * EVERYTHING here is ILLUSTRATIVE and must be replaced with the real SKU's data
 * and on-file substantiation before publishing: extract type, mg, withanolide %,
 * pack sizes, prices, review counts, and all benefit copy. See README "Real vs
 * mocked". Copy is written structure/function-only (no disease claims).
 *
 * Images are self-contained local SVG art (see /public/images) so the demo has
 * zero external-image dependency, no CLS, and instant load; production would use
 * real photography from Shopify's CDN.
 */

const USD = 'USD' as const;

function money(amount: number) {
  return { amount, currencyCode: USD };
}

/* --- Variants: Form (Capsules | Powder) × Pack (1 | 2 | 3) --- */

const variants: ProductVariant[] = [
  {
    id: 'gid://shopify/ProductVariant/1001',
    title: 'Capsules / 1 Bottle',
    sku: 'KA-ASH-CAP-01',
    selectedOptions: [
      { name: 'Form', value: 'Capsules' },
      { name: 'Pack', value: '1 Bottle' },
    ],
    price: money(25.95),
    availableForSale: true,
    quantityAvailable: 48,
    daysSupply: 30,
    servings: 30,
    image: {
      id: 'v-cap-1',
      url: '/images/ashwagandha-bottle.svg',
      altText: 'Kerala Ayurveda Ashwagandha, 60 vegetarian capsules, one bottle',
      width: 1200,
      height: 1200,
    },
  },
  {
    id: 'gid://shopify/ProductVariant/1002',
    title: 'Capsules / 2 Bottles',
    sku: 'KA-ASH-CAP-02',
    selectedOptions: [
      { name: 'Form', value: 'Capsules' },
      { name: 'Pack', value: '2 Bottles' },
    ],
    price: money(47.95),
    compareAtPrice: money(51.9),
    availableForSale: true,
    quantityAvailable: 32,
    daysSupply: 60,
    servings: 60,
    image: {
      id: 'v-cap-2',
      url: '/images/ashwagandha-bottle-duo.svg',
      altText: 'Kerala Ayurveda Ashwagandha capsules, two-bottle pack',
      width: 1200,
      height: 1200,
    },
  },
  {
    id: 'gid://shopify/ProductVariant/1003',
    title: 'Capsules / 3 Bottles',
    sku: 'KA-ASH-CAP-03',
    selectedOptions: [
      { name: 'Form', value: 'Capsules' },
      { name: 'Pack', value: '3 Bottles' },
    ],
    price: money(65.95),
    compareAtPrice: money(77.85),
    availableForSale: true,
    quantityAvailable: 21,
    daysSupply: 90,
    servings: 90,
    image: {
      id: 'v-cap-3',
      url: '/images/ashwagandha-bottle-trio.svg',
      altText: 'Kerala Ayurveda Ashwagandha capsules, three-bottle full-cycle pack',
      width: 1200,
      height: 1200,
    },
  },
  {
    id: 'gid://shopify/ProductVariant/1004',
    title: 'Powder / 1 Pouch',
    sku: 'KA-ASH-PWD-01',
    selectedOptions: [
      { name: 'Form', value: 'Powder' },
      { name: 'Pack', value: '1 Bottle' },
    ],
    price: money(22.95),
    availableForSale: true,
    quantityAvailable: 27,
    daysSupply: 30,
    servings: 30,
    image: {
      id: 'v-pwd-1',
      url: '/images/ashwagandha-powder.svg',
      altText: 'Kerala Ayurveda Ashwagandha root powder pouch',
      width: 1200,
      height: 1200,
    },
  },
  {
    id: 'gid://shopify/ProductVariant/1005',
    title: 'Powder / 2 Pouches',
    sku: 'KA-ASH-PWD-02',
    selectedOptions: [
      { name: 'Form', value: 'Powder' },
      { name: 'Pack', value: '2 Bottles' },
    ],
    price: money(42.95),
    compareAtPrice: money(45.9),
    availableForSale: true,
    quantityAvailable: 14,
    daysSupply: 60,
    servings: 60,
    image: {
      id: 'v-pwd-2',
      url: '/images/ashwagandha-powder.svg',
      altText: 'Kerala Ayurveda Ashwagandha root powder, two-pouch pack',
      width: 1200,
      height: 1200,
    },
  },
  {
    // Intentionally out of stock to exercise the unavailable-variant state.
    id: 'gid://shopify/ProductVariant/1006',
    title: 'Powder / 3 Pouches',
    sku: 'KA-ASH-PWD-03',
    selectedOptions: [
      { name: 'Form', value: 'Powder' },
      { name: 'Pack', value: '3 Bottles' },
    ],
    price: money(59.95),
    compareAtPrice: money(68.85),
    availableForSale: false,
    quantityAvailable: 0,
    daysSupply: 90,
    servings: 90,
    image: {
      id: 'v-pwd-3',
      url: '/images/ashwagandha-powder.svg',
      altText: 'Kerala Ayurveda Ashwagandha root powder, three-pouch pack',
      width: 1200,
      height: 1200,
    },
  },
];

const sellingPlans: SellingPlan[] = [
  {
    id: 'gid://shopify/SellingPlan/9001',
    name: 'Deliver every 30 days',
    discountPercentage: 15,
    intervalDays: 30,
  },
];

const gallery = [
  {
    id: 'g1',
    url: '/images/ashwagandha-bottle.svg',
    altText: 'Kerala Ayurveda Ashwagandha capsule bottle, front label',
    width: 1200,
    height: 1200,
    caption: 'KSM-66® root-only extract',
  },
  {
    id: 'g2',
    url: '/images/ashwagandha-root.svg',
    altText: 'Whole ashwagandha (Withania somnifera) roots',
    width: 1200,
    height: 1200,
    caption: 'Root only — contains no leaf',
  },
  {
    id: 'g3',
    url: '/images/ashwagandha-facts.svg',
    altText: 'Supplement facts panel with standardized withanolide content',
    width: 1200,
    height: 1200,
    caption: 'Standardized to 5% withanolides',
  },
  {
    id: 'g4',
    url: '/images/ashwagandha-ritual.svg',
    altText: 'A calm morning routine with warm milk and capsules',
    width: 1200,
    height: 1200,
    caption: 'Take with food, morning and evening',
  },
  {
    id: 'g5',
    url: '/images/ashwagandha-coa.svg',
    altText: 'Third-party heavy-metal Certificate of Analysis summary',
    width: 1200,
    height: 1200,
    caption: 'Third-party tested for heavy metals',
  },
];

export const product: Product = {
  id: 'gid://shopify/Product/8001',
  handle: 'ashwagandha-60-capsules',
  title: 'Ashwagandha',
  vendor: 'Kerala Ayurveda',
  subtitle:
    'KSM-66® root extract, standardized to 5% withanolides — to help your body handle everyday stress.*',
  descriptionHtml:
    '<p>A full-spectrum <strong>KSM-66® Ashwagandha</strong> made from the <strong>root only</strong> of ' +
    'Withania somnifera, traditionally used in Ayurveda as an adaptogen to support the body’s ' +
    'resilience to everyday stress.* Standardized to 5% withanolides so every capsule is a known dose ' +
    '— not a vague “proprietary blend”.</p>',
  featuredImage: gallery[0],
  images: gallery,
  options: [
    { name: 'Form', values: ['Capsules', 'Powder'] },
    { name: 'Pack', values: ['1 Bottle', '2 Bottles', '3 Bottles'] },
  ],
  variants,
  sellingPlans,
  rating: { value: 4.7, count: 213 },
  benefits: [
    {
      id: 'b-stress',
      goal: 'stress',
      title: 'Helps you stay calm under pressure',
      body: 'Traditionally used as an adaptogen to help your body handle everyday stress and stay balanced.*',
      icon: 'leaf',
    },
    {
      id: 'b-sleep',
      goal: 'sleep',
      title: 'Supports more restful sleep',
      body: 'May help support the wind-down your body needs for restful, everyday sleep.*',
      icon: 'moon',
    },
    {
      id: 'b-energy',
      goal: 'energy',
      title: 'Supports steady daily energy',
      body: 'Helps support everyday energy and vitality without the spike-and-crash of stimulants.*',
      icon: 'sun',
    },
    {
      id: 'b-focus',
      goal: 'focus',
      title: 'Supports focus & mental stamina',
      body: 'Helps support mental stamina and a steady, focused state through a demanding day.*',
      icon: 'sparkle',
    },
  ],
  supplementFacts: {
    extractName: 'KSM-66® Ashwagandha',
    botanicalName: 'Withania somnifera',
    plantPart: 'Root only (contains no leaf)',
    mgPerServing: 600,
    withanolidePercent: 5,
    servingSize: '1–2 capsules daily',
    capsuleType: 'Vegetarian (HPMC)',
    vegan: true,
    otherIngredients: ['Organic rice flour', 'Vegetarian capsule (HPMC)'],
    allergens: 'Contains no gluten, dairy, soy, or nuts.',
  },
  certifications: [
    { id: 'c-gmp', label: 'cGMP facility', icon: 'shield' },
    { id: 'c-nongmo', label: 'Non-GMO', icon: 'seed' },
    { id: 'c-vegan', label: 'Vegan', icon: 'leaf' },
    { id: 'c-tested', label: 'Third-party tested', icon: 'flask' },
  ],
  expectations: [
    {
      window: 'Week 1–2',
      label: 'Settling in',
      detail:
        'Ashwagandha works gradually. Take it consistently, with food — most people feel little at first.',
    },
    {
      window: 'Week 3–4',
      label: 'First signs',
      detail:
        'Many people begin to notice a calmer response to everyday stress around this point.*',
    },
    {
      window: 'Week 6–8',
      label: 'Full routine',
      detail:
        'The window most studies run to. Benefits for stress and sleep are typically clearest with daily use.*',
    },
  ],
  faqs: [
    {
      question: 'When will I notice a difference?',
      answer:
        'Ashwagandha works gradually, not instantly. Most people take it daily for several weeks; studies commonly run 6–8 weeks. If you feel nothing on day 5, that’s normal — consistency matters more than any single dose.',
    },
    {
      question: 'When should I take it — morning or night?',
      answer:
        'Take it with food. For everyday stress and energy, many people take it with breakfast; if your main goal is evening wind-down, a second serving with dinner can help. Follow the protocol your fit-check suggests.',
    },
    {
      question: 'Can I take it with coffee or other supplements?',
      answer:
        'Ashwagandha is generally taken alongside coffee. If you take any medication — especially thyroid, sedative, blood-pressure, or diabetes medicine — talk to your doctor first (see safety below).',
    },
    {
      question: 'Is this the root or the leaf?',
      answer:
        'Root only. We use a KSM-66® full-spectrum extract made exclusively from the root of Withania somnifera, standardized to 5% withanolides. It contains no ashwagandha leaf.',
    },
    {
      question: 'Is it third-party tested?',
      answer:
        'Yes. Each batch is tested by a third-party lab, including for heavy metals (lead, arsenic, mercury, cadmium). A Certificate of Analysis summary is shown on this page.',
    },
  ],
  reviews: [
    {
      id: 'r1',
      author: 'Priya M.',
      rating: 5,
      title: 'Calmer through a stressful quarter',
      body: 'Took it every morning for about six weeks. I feel less on-edge in back-to-back meetings. Slow build, but real.',
      verified: true,
      goalTag: 'stress',
      hasMedia: true,
    },
    {
      id: 'r2',
      author: 'David R.',
      rating: 5,
      title: 'Better wind-down at night',
      body: 'Second capsule with dinner helped me stop doom-scrolling and actually settle. Took a month to really notice.',
      verified: true,
      goalTag: 'sleep',
    },
    {
      id: 'r3',
      author: 'Anita S.',
      rating: 4,
      title: 'Steady energy, no jitters',
      body: 'I wanted something that wasn’t caffeine. Energy feels more even across the day. Docking a star only because the capsules are large.',
      verified: true,
      goalTag: 'energy',
    },
    {
      id: 'r4',
      author: 'Marcus T.',
      rating: 5,
      title: 'Transparent labeling won me over',
      body: 'The withanolide % and the COA are why I bought this over cheaper options. Root-only matters to me.',
      verified: true,
    },
    {
      id: 'r5',
      author: 'Lena K.',
      rating: 3,
      title: 'Fine, but patience required',
      body: 'Honestly did not feel much in the first two weeks and almost stopped. Glad I kept going — week 5 onward was better.',
      verified: true,
      goalTag: 'stress',
    },
    {
      id: 'r6',
      author: 'Sam P.',
      rating: 5,
      title: 'Recovery after training',
      body: 'Part of my post-workout routine now. Feels like I bounce back a bit quicker between sessions.',
      verified: true,
      goalTag: 'recovery',
    },
  ],
  disclaimer:
    'These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.',
  safetyShort:
    'Not for use during pregnancy or breastfeeding. Talk to your doctor first if you have a thyroid, autoimmune, or liver condition, or take any medication.',
  safetyFull:
    'Consult your physician before use if you are pregnant, breastfeeding, or trying to conceive; have a thyroid, autoimmune, liver, or hormone-sensitive condition; are scheduled for surgery; or take any medication (including thyroid, diabetes, blood-pressure, sedative, anticonvulsant, or immunosuppressant medicines). Not for children. Keep out of reach of children. Discontinue and consult a doctor if any adverse effect occurs.',
  brandStory:
    'Kerala Ayurveda has practiced Ayurveda for over 80 years. Our ashwagandha is grown and sourced with a root-only standard, then standardized and third-party tested so what’s on the label is what’s in the capsule.',
  tags: ['adaptogen', 'stress', 'sleep', 'energy', 'ksm-66', 'root-only', 'vegan'],
};

/* --- Small pure helpers shared by the engine and UI --- */

export function findVariant(id: string): ProductVariant | undefined {
  return product.variants.find((v) => v.id === id);
}

export function variantByOptions(
  form: string,
  pack: string,
): ProductVariant | undefined {
  return product.variants.find(
    (v) =>
      v.selectedOptions.find((o) => o.name === 'Form')?.value === form &&
      v.selectedOptions.find((o) => o.name === 'Pack')?.value === pack,
  );
}

/** Cost per day at the variant's effective dose, rounded to cents. */
export function pricePerDay(variant: ProductVariant): number {
  return Math.round((variant.price.amount / variant.daysSupply) * 100) / 100;
}
