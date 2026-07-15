import { product, variantByOptions } from '@/data/product';
import type {
  FitCheckAnswers,
  Goal,
  MatchStrength,
  ProductVariant,
  Recommendation,
  RecommendationCopy,
  RecommendationOffer,
  RecommendedProtocol,
  SafetyFlag,
  StressLevel,
} from '@/lib/types';

/**
 * Pure, deterministic recommendation engine for the "Is this right for me?"
 * fit-check. Given validated answers it returns a full Recommendation with NO
 * side effects and NO network calls, so it is trivially unit-testable and is
 * the same logic the /api/recommend route and (conceptually) the Shopify block
 * run. The optional AI layer only rewrites the prose in `copy`; every number,
 * pack, and dose below is decided here.
 */

/* --- Tunable weights (evidence-informed, illustrative) --- */

/** How well ashwagandha fits each goal, 0–1. Stress is its most-studied use. */
const GOAL_FIT: Record<Goal, number> = {
  stress: 0.95,
  sleep: 0.85,
  mood: 0.8,
  energy: 0.75,
  recovery: 0.7,
  focus: 0.65,
};

const GOAL_LABEL: Record<Goal, string> = {
  stress: 'managing everyday stress',
  sleep: 'more restful sleep',
  energy: 'steadier daily energy',
  focus: 'focus and mental stamina',
  recovery: 'exercise recovery and strength',
  mood: 'mood balance',
};

/** Points contributed by current stress level (ashwagandha is more indicated when stress is higher). */
const STRESS_POINTS: Record<StressLevel, number> = {
  rare: 6,
  occasional: 12,
  frequent: 18,
  constant: 20,
};

/** How relevant stress level is, weighted by the primary goal. */
const STRESS_RELEVANCE: Record<Goal, number> = {
  stress: 1,
  sleep: 1,
  mood: 1,
  energy: 0.8,
  recovery: 0.5,
  focus: 0.6,
};

const EXPERIENCE_CONFIDENCE = { new: 6, some: 10, regular: 14 } as const;

const STRENGTH_THRESHOLDS: { min: number; strength: MatchStrength }[] = [
  { min: 80, strength: 'strong' },
  { min: 66, strength: 'good' },
  { min: 0, strength: 'moderate' },
];

const STRESS_RECAP: Record<StressLevel, string> = {
  rare: 'You feel balanced most days, so this is more of a preventative, steady-state routine.',
  occasional: 'You get occasional stress spikes — a good fit for gentle, everyday support.',
  frequent: 'You’re frequently wired or on-edge, which is exactly what ashwagandha is most studied for.',
  constant: 'You feel constantly overwhelmed, so a consistent daily routine is likely to help most.',
};

/* --- Small, individually testable helpers --- */

export function collectSafetyFlags(answers: FitCheckAnswers): SafetyFlag[] {
  const flags: SafetyFlag[] = [];
  if (answers.safety.pregnancyOrNursing) flags.push('pregnancyOrNursing');
  if (answers.safety.thyroidOrAutoimmune) flags.push('thyroidOrAutoimmune');
  if (answers.safety.sedativesOrLiver) flags.push('sedativesOrLiver');
  return flags;
}

/** Resolve the primary goal: explicit choice if valid, else the best-fitting selected goal. */
export function resolvePrimaryGoal(answers: FitCheckAnswers): Goal {
  const goals = answers.goals.length > 0 ? answers.goals : (['stress'] as Goal[]);
  if (answers.primaryGoal && goals.includes(answers.primaryGoal)) {
    return answers.primaryGoal;
  }
  return [...goals].sort((a, b) => GOAL_FIT[b] - GOAL_FIT[a])[0];
}

export function computeMatchScore(answers: FitCheckAnswers, primary: Goal): number {
  const base = GOAL_FIT[primary] * 70;
  const stressBonus = STRESS_POINTS[answers.stressLevel] * STRESS_RELEVANCE[primary];
  const experienceBonus = EXPERIENCE_CONFIDENCE[answers.experience];
  const score = base + stressBonus + experienceBonus;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function strengthFromScore(score: number): MatchStrength {
  return STRENGTH_THRESHOLDS.find((t) => score >= t.min)!.strength;
}

/** Decide the recommended daily dose from goal, stress, and any explicit preference. */
export function resolveProtocol(
  answers: FitCheckAnswers,
  primary: Goal,
): RecommendedProtocol {
  let dosePerDay: 1 | 2;
  if (answers.dosePreference === 'once') dosePerDay = 1;
  else if (answers.dosePreference === 'twice') dosePerDay = 2;
  else {
    // No preference: match the dose to the goal + stress.
    const higherDose =
      primary === 'stress' ||
      primary === 'sleep' ||
      primary === 'recovery' ||
      answers.stressLevel === 'frequent' ||
      answers.stressLevel === 'constant';
    dosePerDay = higherDose ? 2 : 1;
  }

  const mgPerDay = dosePerDay * 300;
  const timing =
    dosePerDay === 2
      ? 'with breakfast and again with dinner'
      : primary === 'sleep'
        ? 'with dinner'
        : 'with breakfast';

  const summary =
    dosePerDay === 2
      ? `Take 1 capsule with breakfast and a second with dinner (≈${mgPerDay} mg/day). Always take with food.`
      : `Take 1 capsule a day ${timing} (≈${mgPerDay} mg/day). Always take with food. At this dose your pack lasts about twice as long.`;

  return { dosePerDay, mgPerDay, timing, summary };
}

/**
 * Resolve the recommended variant, degrading gracefully if the ideal one is out
 * of stock: honor the shopper's form first, then step down the pack size, then
 * fall back to capsules of the same pack, then to any available variant.
 */
export function resolveVariant(answers: FitCheckAnswers): {
  variant: ProductVariant;
  substituted: boolean;
} {
  const form = answers.formPreference === 'powder' ? 'Powder' : 'Capsules';
  const bottles = recommendedPackBottles(answers);
  const packLabels = ['3 Bottles', '2 Bottles', '1 Bottle'] as const;
  const idealPack = bottleLabel(bottles);

  const ideal = variantByOptions(form, idealPack);
  if (ideal?.availableForSale) return { variant: ideal, substituted: false };

  // Same form, step down the pack size.
  for (const pack of packLabels.filter((p) => p <= idealPack)) {
    const v = variantByOptions(form, pack);
    if (v?.availableForSale) return { variant: v, substituted: true };
  }
  // Swap to capsules at the ideal pack.
  const capSwap = variantByOptions('Capsules', idealPack);
  if (capSwap?.availableForSale) return { variant: capSwap, substituted: true };

  // Anything in stock.
  const anyAvailable = product.variants.find((v) => v.availableForSale);
  return { variant: anyAvailable ?? product.variants[0], substituted: true };
}

export function recommendedPackBottles(answers: FitCheckAnswers): 1 | 2 | 3 {
  if (answers.experience === 'new') return 1;
  if (answers.experience === 'regular') return 3;
  // "some": upgrade to a full 3-pack when stress is high (aligns with the 6–8 week window).
  if (answers.stressLevel === 'frequent' || answers.stressLevel === 'constant') return 3;
  return 2;
}

function bottleLabel(n: 1 | 2 | 3): '1 Bottle' | '2 Bottles' | '3 Bottles' {
  return n === 1 ? '1 Bottle' : n === 2 ? '2 Bottles' : '3 Bottles';
}

function buildOffer(
  answers: FitCheckAnswers,
  variant: ProductVariant,
  substituted: boolean,
  dosePerDay: number,
): RecommendationOffer {
  const sellingMode: 'subscription' | 'one-time' =
    answers.experience === 'new' ? 'one-time' : 'subscription';
  const plan = product.sellingPlans[0];
  // variant.daysSupply and price are defined at the full 2-capsule serving.
  // Scale to the recommended dose so days-supply and cost-per-day agree with the
  // protocol (a once-daily dose makes the pack last ~twice as long at ~half the
  // daily cost) — otherwise the offer contradicts the protocol copy.
  const effectiveDays = Math.round((variant.daysSupply * 2) / dosePerDay);
  const base = Math.round((variant.price.amount / effectiveDays) * 100) / 100;
  const perDayAmount =
    sellingMode === 'subscription'
      ? Math.round(base * (1 - plan.discountPercentage / 100) * 100) / 100
      : base;

  const packBottles = variant.selectedOptions.find((o) => o.name === 'Pack')?.value ?? '';

  let reasonForPack: string;
  if (answers.experience === 'new') {
    reasonForPack =
      'You’re new to ashwagandha, so we suggest a single full cycle first — it needs about 6–8 weeks of daily use to judge fairly.';
  } else if (answers.experience === 'regular') {
    reasonForPack =
      'You already take it regularly, so the 3-pack on a subscription is the best value and keeps you from running out.';
  } else {
    reasonForPack =
      recommendedPackBottles(answers) === 3
        ? 'Your stress levels suggest a full daily routine — the 3-pack covers the whole 6–8 week window.'
        : 'A 2-pack gives you enough runway to get past the first few weeks, where benefits typically build.';
  }
  if (substituted) {
    reasonForPack +=
      ' (Your first choice was out of stock, so we picked the closest in-stock option.)';
  }

  return {
    recommendedVariantId: variant.id,
    recommendedPackLabel: `${variant.selectedOptions.find((o) => o.name === 'Form')?.value} · ${packBottles}`,
    sellingMode,
    sellingPlanId: sellingMode === 'subscription' ? plan.id : undefined,
    reasonForPack,
    pricePerDay: { amount: perDayAmount, currencyCode: variant.price.currencyCode },
    daysSupply: effectiveDays,
  };
}

function buildMatchCopy(
  answers: FitCheckAnswers,
  primary: Goal,
  strength: MatchStrength,
): RecommendationCopy {
  const strengthWord =
    strength === 'strong' ? 'strong' : strength === 'good' ? 'good' : 'reasonable';

  const reasons: string[] = [
    `You’re focused on ${GOAL_LABEL[primary]} — one of ashwagandha’s most traditional, well-studied uses.*`,
    STRESS_RECAP[answers.stressLevel],
  ];
  if (answers.experience === 'new') {
    reasons.push('Since it’s your first time, we’ll start you on a single full cycle to try.');
  } else if (answers.experience === 'regular') {
    reasons.push('You already take it regularly, so we’ve set you up with the best-value routine.');
  } else {
    reasons.push('You’ve used adaptogens before, so a slightly larger pack keeps momentum.');
  }
  reasons.push('None of the safety checks were flagged — but it’s always fine to run it by your doctor.');

  return {
    verdictHeadline: `Yes — ashwagandha is a ${strengthWord} match for ${GOAL_LABEL[primary]}.`,
    verdictSubcopy:
      'Here’s how we’d start you, what to expect, and the pack that fits — no pressure, and you can adjust any answer.',
    reasons,
  };
}

function buildCautionCopy(flags: SafetyFlag[]): {
  copy: RecommendationCopy;
  cautionNote: string;
} {
  const flagReason: Record<SafetyFlag, string> = {
    pregnancyOrNursing:
      'Ashwagandha isn’t recommended during pregnancy, breastfeeding, or while trying to conceive.',
    thyroidOrAutoimmune:
      'It may affect thyroid hormones and immune activity, so a thyroid or autoimmune condition needs a doctor’s input first.',
    sedativesOrLiver:
      'It can add to the effect of sedatives and sleep medication and may not suit a liver or GI condition.',
  };
  const reasons = flags.map((f) => flagReason[f]);
  return {
    copy: {
      verdictHeadline: 'Ashwagandha may not be right for you right now.',
      verdictSubcopy:
        'Based on your answers, we’d rather you check with your doctor first than make a sale. Here’s why:',
      reasons,
    },
    cautionNote:
      'This is general wellness information, not medical advice. Please talk to a qualified healthcare professional before starting any new supplement.',
  };
}

/** The single entry point: validated answers → full deterministic recommendation. */
export function buildRecommendation(answers: FitCheckAnswers): Recommendation {
  const flags = collectSafetyFlags(answers);
  const facts = product.supplementFacts;
  const extract = {
    name: facts.extractName,
    mgPerServing: facts.mgPerServing,
    withanolidePercent: facts.withanolidePercent,
    plantPart: facts.plantPart,
  };

  if (flags.length > 0) {
    const { copy, cautionNote } = buildCautionCopy(flags);
    return {
      outcome: 'caution',
      matchStrength: null,
      matchScore: 0,
      safetyFlags: flags,
      copy,
      copySource: 'deterministic',
      extract,
      protocol: null,
      timeline: product.expectations,
      offer: null,
      disclaimer: product.disclaimer,
      cautionNote,
    };
  }

  const primary = resolvePrimaryGoal(answers);
  const matchScore = computeMatchScore(answers, primary);
  const matchStrength = strengthFromScore(matchScore);
  const { variant, substituted } = resolveVariant(answers);
  const protocol = resolveProtocol(answers, primary);

  return {
    outcome: 'match',
    matchStrength,
    matchScore,
    safetyFlags: [],
    copy: buildMatchCopy(answers, primary, matchStrength),
    copySource: 'deterministic',
    extract,
    protocol,
    timeline: product.expectations,
    offer: buildOffer(answers, variant, substituted, protocol.dosePerDay),
    disclaimer: product.disclaimer,
  };
}
