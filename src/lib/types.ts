/**
 * Domain model for the Kerala Ayurveda Ashwagandha PDP.
 *
 * The product shape mirrors the Shopify Storefront API closely (Product /
 * ProductVariant / SellingPlan / Money / Image) so the Next.js prototype and
 * the Shopify theme app extension share one mental model. Where we deviate for
 * ergonomics it is called out:
 *   - Money.amount is a `number` here; the Storefront API returns a decimal
 *     string. We'd parse at the adapter boundary in production.
 */

export type CurrencyCode = 'USD' | 'INR';

export interface Money {
  /** Shopify returns this as a decimal string; we use a number in the prototype. */
  amount: number;
  currencyCode: CurrencyCode;
}

export interface Image {
  id: string;
  url: string;
  altText: string;
  width: number;
  height: number;
  /** Optional short caption used by the gallery UI. */
  caption?: string;
}

export interface SelectedOption {
  name: string; // e.g. "Form", "Pack"
  value: string; // e.g. "Capsules", "3 Bottles"
}

export interface ProductVariant {
  id: string;
  title: string;
  sku: string;
  selectedOptions: SelectedOption[];
  price: Money;
  /** compareAtPrice > price signals an honest discount; equal/undefined = no discount. */
  compareAtPrice?: Money;
  availableForSale: boolean;
  quantityAvailable: number;
  image?: Image;
  /** How many days this variant lasts at the effective dose — powers "days supply". */
  daysSupply: number;
  /** Total servings in the pack (a serving may be 1–2 capsules). */
  servings: number;
}

export interface SellingPlan {
  id: string;
  name: string; // e.g. "Deliver every 30 days"
  /** Percentage off the one-time price, e.g. 15 = 15%. */
  discountPercentage: number;
  intervalDays: number;
}

export interface ProductOption {
  name: string;
  values: string[];
}

/** Structure/function-safe benefit card (never a disease claim). */
export interface Benefit {
  id: string;
  goal: Goal;
  title: string;
  body: string;
  icon: string; // icon key resolved by the UI
}

export interface SupplementFacts {
  extractName: string; // e.g. "KSM-66® Ashwagandha"
  botanicalName: string; // "Withania somnifera"
  plantPart: string; // "Root only (contains no leaf)"
  mgPerServing: number;
  withanolidePercent: number;
  servingSize: string; // "1–2 capsules"
  capsuleType: string; // "Vegetarian (HPMC)"
  vegan: boolean;
  otherIngredients: string[];
  allergens: string; // "Contains no ..."
}

export interface Certification {
  id: string;
  label: string; // "cGMP", "Non-GMO", "Vegan", "Third-party tested"
  icon: string;
}

export interface ExpectationMilestone {
  window: string; // "Week 1–2"
  label: string;
  detail: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number; // 1–5
  title: string;
  body: string;
  verified: boolean;
  goalTag?: Goal; // "reviews from people who chose Stress like you"
  hasMedia?: boolean;
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  subtitle: string; // quantified, structure/function-safe subhead
  descriptionHtml: string;
  featuredImage: Image;
  images: Image[];
  options: ProductOption[];
  variants: ProductVariant[];
  sellingPlans: SellingPlan[];
  rating: { value: number; count: number };
  benefits: Benefit[];
  supplementFacts: SupplementFacts;
  certifications: Certification[];
  expectations: ExpectationMilestone[];
  faqs: FaqItem[];
  reviews: Review[];
  /** Verbatim regulatory disclaimer, rendered near every claim. */
  disclaimer: string;
  /** Short safety line shown near the buy box; full block lives lower on the page. */
  safetyShort: string;
  safetyFull: string;
  brandStory: string;
  tags: string[];
}

/* ------------------------------------------------------------------ */
/* Fit-check ("Is this right for me?") domain                          */
/* ------------------------------------------------------------------ */

export type Goal =
  | 'stress'
  | 'sleep'
  | 'energy'
  | 'focus'
  | 'recovery'
  | 'mood';

export type StressLevel = 'rare' | 'occasional' | 'frequent' | 'constant';

export type Experience = 'new' | 'some' | 'regular';

export type FormPreference = 'capsule' | 'powder' | 'no-preference';

export type DosePreference = 'once' | 'twice' | 'no-preference';

export interface SafetyAnswers {
  /** Pregnant, breastfeeding, or trying to conceive. */
  pregnancyOrNursing: boolean;
  /** Thyroid or autoimmune condition, or takes thyroid medication. */
  thyroidOrAutoimmune: boolean;
  /** Takes sedatives/sleep meds/benzodiazepines, or has a liver/GI condition. */
  sedativesOrLiver: boolean;
}

export interface FitCheckAnswers {
  goals: Goal[]; // 1–4 selected
  primaryGoal?: Goal; // required by the engine when >1 goal chosen
  stressLevel: StressLevel;
  experience: Experience;
  safety: SafetyAnswers;
  formPreference: FormPreference;
  dosePreference: DosePreference;
}

export type SafetyFlag =
  | 'pregnancyOrNursing'
  | 'thyroidOrAutoimmune'
  | 'sedativesOrLiver';

export type MatchStrength = 'strong' | 'good' | 'moderate';

export type RecommendationOutcome = 'match' | 'caution';

export type CopySource = 'ai' | 'deterministic';

/** The prose fields that MAY be replaced by AI-generated copy. */
export interface RecommendationCopy {
  verdictHeadline: string;
  verdictSubcopy: string;
  /** "Why this fits you" recap lines that restate the shopper's own answers. */
  reasons: string[];
}

export interface RecommendedProtocol {
  dosePerDay: number; // capsules/servings per day
  mgPerDay: number;
  timing: string; // "with breakfast", "with breakfast and dinner"
  summary: string;
}

export interface RecommendationOffer {
  recommendedVariantId: string;
  recommendedPackLabel: string;
  sellingMode: 'subscription' | 'one-time';
  sellingPlanId?: string;
  reasonForPack: string;
  pricePerDay: Money;
  daysSupply: number;
}

/**
 * The full recommendation. `matchScore`, `extract`, `protocol`, `timeline`,
 * and `offer` are ALWAYS deterministic (engine-computed). Only the fields in
 * `copy` may be swapped for AI-generated text; `copySource` records which.
 */
export interface Recommendation {
  outcome: RecommendationOutcome;
  matchStrength: MatchStrength | null; // null on caution
  matchScore: number; // 0–100, deterministic; drives the count-up meter
  safetyFlags: SafetyFlag[];
  copy: RecommendationCopy;
  copySource: CopySource;
  extract: {
    name: string;
    mgPerServing: number;
    withanolidePercent: number;
    plantPart: string;
  };
  protocol: RecommendedProtocol | null; // null on caution
  timeline: ExpectationMilestone[];
  offer: RecommendationOffer | null; // null on caution
  disclaimer: string;
  /** Short note explaining the safety branch, when outcome === 'caution'. */
  cautionNote?: string;
}
