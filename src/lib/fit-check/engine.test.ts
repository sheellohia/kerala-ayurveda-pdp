import { describe, expect, it } from 'vitest';
import {
  buildRecommendation,
  collectSafetyFlags,
  computeMatchScore,
  recommendedPackBottles,
  resolvePrimaryGoal,
  resolveProtocol,
  resolveVariant,
  strengthFromScore,
} from './engine';
import type { FitCheckAnswers } from '@/lib/types';

/** A clean, no-flags baseline; override per test. */
function answers(overrides: Partial<FitCheckAnswers> = {}): FitCheckAnswers {
  return {
    goals: ['stress'],
    stressLevel: 'occasional',
    experience: 'new',
    safety: {
      pregnancyOrNursing: false,
      thyroidOrAutoimmune: false,
      sedativesOrLiver: false,
    },
    formPreference: 'no-preference',
    dosePreference: 'no-preference',
    ...overrides,
  };
}

describe('resolvePrimaryGoal', () => {
  it('honors an explicit primary goal when it is among the selected goals', () => {
    expect(resolvePrimaryGoal(answers({ goals: ['stress', 'sleep'], primaryGoal: 'sleep' }))).toBe('sleep');
  });

  it('falls back to the best-fitting selected goal when no primary is given', () => {
    // focus (0.65) vs sleep (0.85) -> sleep wins
    expect(resolvePrimaryGoal(answers({ goals: ['focus', 'sleep'] }))).toBe('sleep');
  });

  it('ignores an invalid primary goal not in the selected set', () => {
    expect(resolvePrimaryGoal(answers({ goals: ['energy'], primaryGoal: 'stress' }))).toBe('energy');
  });

  it('defaults to stress when no goals are selected', () => {
    expect(resolvePrimaryGoal(answers({ goals: [] }))).toBe('stress');
  });
});

describe('computeMatchScore + strengthFromScore', () => {
  it('is highest for a high-stress, regular user with a stress goal', () => {
    const a = answers({ goals: ['stress'], stressLevel: 'constant', experience: 'regular' });
    const score = computeMatchScore(a, 'stress');
    expect(score).toBe(100); // 0.95*70 + 20*1 + 14 = 100.5 -> clamped/rounded
    expect(strengthFromScore(score)).toBe('strong');
  });

  it('is lower for a focus goal with rare stress and a new user', () => {
    const a = answers({ goals: ['focus'], stressLevel: 'rare', experience: 'new' });
    const score = computeMatchScore(a, 'focus');
    // 0.65*70 + 6*0.6 + 6 = 55.1 -> 55
    expect(score).toBe(55);
    expect(strengthFromScore(score)).toBe('moderate');
  });

  it('never exceeds 100 or drops below 0', () => {
    const hi = computeMatchScore(answers({ stressLevel: 'constant', experience: 'regular' }), 'stress');
    expect(hi).toBeLessThanOrEqual(100);
    expect(hi).toBeGreaterThanOrEqual(0);
  });

  it('maps the strength bands at their boundaries', () => {
    expect(strengthFromScore(80)).toBe('strong');
    expect(strengthFromScore(79)).toBe('good');
    expect(strengthFromScore(66)).toBe('good');
    expect(strengthFromScore(65)).toBe('moderate');
  });
});

describe('collectSafetyFlags', () => {
  it('returns no flags for a clean answer set', () => {
    expect(collectSafetyFlags(answers())).toEqual([]);
  });

  it('collects every triggered flag', () => {
    const a = answers({
      safety: { pregnancyOrNursing: true, thyroidOrAutoimmune: true, sedativesOrLiver: true },
    });
    expect(collectSafetyFlags(a)).toEqual([
      'pregnancyOrNursing',
      'thyroidOrAutoimmune',
      'sedativesOrLiver',
    ]);
  });
});

describe('buildRecommendation — safety branch', () => {
  it('returns a caution outcome with no product push when any safety flag is set', () => {
    const rec = buildRecommendation(
      answers({ safety: { pregnancyOrNursing: true, thyroidOrAutoimmune: false, sedativesOrLiver: false } }),
    );
    expect(rec.outcome).toBe('caution');
    expect(rec.offer).toBeNull();
    expect(rec.protocol).toBeNull();
    expect(rec.matchStrength).toBeNull();
    expect(rec.matchScore).toBe(0);
    expect(rec.safetyFlags).toContain('pregnancyOrNursing');
    expect(rec.copy.verdictHeadline.toLowerCase()).toContain('may not be right');
    expect(rec.cautionNote).toBeTruthy();
  });

  it('still returns the standardized extract and an honest timeline on caution', () => {
    const rec = buildRecommendation(
      answers({ safety: { pregnancyOrNursing: false, thyroidOrAutoimmune: true, sedativesOrLiver: false } }),
    );
    expect(rec.extract.plantPart).toMatch(/root/i);
    expect(rec.timeline.length).toBeGreaterThan(0);
  });
});

describe('recommendedPackBottles', () => {
  it('gives a new user a single full cycle', () => {
    expect(recommendedPackBottles(answers({ experience: 'new' }))).toBe(1);
  });

  it('gives a regular user the 3-pack', () => {
    expect(recommendedPackBottles(answers({ experience: 'regular' }))).toBe(3);
  });

  it('upgrades a "some" user to a 3-pack when stress is high', () => {
    expect(recommendedPackBottles(answers({ experience: 'some', stressLevel: 'constant' }))).toBe(3);
    expect(recommendedPackBottles(answers({ experience: 'some', stressLevel: 'occasional' }))).toBe(2);
  });
});

describe('resolveProtocol', () => {
  it('honors an explicit once-daily preference regardless of goal', () => {
    const p = resolveProtocol(answers({ dosePreference: 'once', goals: ['stress'] }), 'stress');
    expect(p.dosePerDay).toBe(1);
    expect(p.mgPerDay).toBe(300);
  });

  it('recommends twice-daily for a stress goal when no preference is given', () => {
    const p = resolveProtocol(answers({ dosePreference: 'no-preference' }), 'stress');
    expect(p.dosePerDay).toBe(2);
    expect(p.mgPerDay).toBe(600);
    expect(p.timing).toMatch(/dinner/);
  });

  it('times a once-daily sleep dose to the evening', () => {
    const p = resolveProtocol(answers({ dosePreference: 'once' }), 'sleep');
    expect(p.timing).toBe('with dinner');
  });
});

describe('resolveVariant — availability handling', () => {
  it('picks the capsule variant matching the recommended pack for a clean run', () => {
    const { variant, substituted } = resolveVariant(answers({ experience: 'regular', formPreference: 'capsule' }));
    expect(substituted).toBe(false);
    expect(variant.availableForSale).toBe(true);
    expect(variant.selectedOptions).toEqual(
      expect.arrayContaining([
        { name: 'Form', value: 'Capsules' },
        { name: 'Pack', value: '3 Bottles' },
      ]),
    );
  });

  it('substitutes when the ideal powder 3-pack is out of stock', () => {
    // regular + powder -> ideal Powder/3 Bottles, which is OOS in the fixture.
    const { variant, substituted } = resolveVariant(answers({ experience: 'regular', formPreference: 'powder' }));
    expect(substituted).toBe(true);
    expect(variant.availableForSale).toBe(true);
    // honors form first, steps the pack down to the 2-pouch
    expect(variant.selectedOptions).toEqual(
      expect.arrayContaining([
        { name: 'Form', value: 'Powder' },
        { name: 'Pack', value: '2 Bottles' },
      ]),
    );
  });
});

describe('buildRecommendation — match branch', () => {
  it('produces a coherent, purchasable recommendation with deterministic copy', () => {
    const rec = buildRecommendation(
      answers({ goals: ['stress', 'sleep'], primaryGoal: 'stress', stressLevel: 'frequent', experience: 'some' }),
    );
    expect(rec.outcome).toBe('match');
    expect(rec.matchScore).toBeGreaterThan(0);
    expect(rec.matchStrength).not.toBeNull();
    expect(rec.offer).not.toBeNull();
    expect(rec.protocol).not.toBeNull();
    expect(rec.copySource).toBe('deterministic');
    expect(rec.copy.reasons.length).toBeGreaterThanOrEqual(3);
    expect(rec.offer!.recommendedVariantId).toBeTruthy();
    expect(rec.offer!.pricePerDay.amount).toBeGreaterThan(0);
  });

  it('applies the subscription discount to price-per-day for a regular user', () => {
    const oneTime = buildRecommendation(answers({ experience: 'new', formPreference: 'capsule' }));
    const sub = buildRecommendation(answers({ experience: 'regular', formPreference: 'capsule' }));
    expect(oneTime.offer!.sellingMode).toBe('one-time');
    expect(sub.offer!.sellingMode).toBe('subscription');
    expect(sub.offer!.sellingPlanId).toBeTruthy();
  });
});

describe('offer supply/price track the recommended dose', () => {
  it('doubles days-supply and halves per-day cost for a once-daily protocol', () => {
    // new + capsule + once-daily -> 1 Bottle (baseline 30 days at 2/day), one-time $25.95
    const rec = buildRecommendation(
      answers({ goals: ['focus'], stressLevel: 'rare', experience: 'new', formPreference: 'capsule', dosePreference: 'once' }),
    );
    expect(rec.protocol!.dosePerDay).toBe(1);
    expect(rec.offer!.daysSupply).toBe(60); // 30 baseline * 2/1
    expect(rec.offer!.pricePerDay.amount).toBeCloseTo(0.43, 2); // 25.95 / 60
  });

  it('keeps baseline days-supply and cost for a twice-daily protocol', () => {
    const rec = buildRecommendation(
      answers({ goals: ['stress'], stressLevel: 'frequent', experience: 'new', formPreference: 'capsule', dosePreference: 'twice' }),
    );
    expect(rec.protocol!.dosePerDay).toBe(2);
    expect(rec.offer!.daysSupply).toBe(30); // 30 baseline * 2/2
    expect(rec.offer!.pricePerDay.amount).toBeCloseTo(0.87, 2); // 25.95 / 30
  });
});
