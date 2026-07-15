'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { MatchStrength } from '@/lib/types';
import { ease } from '@/lib/motion';
import { useCountUp } from '@/lib/hooks';

const STRENGTH_LABEL: Record<MatchStrength, string> = {
  strong: 'Strong match',
  good: 'Good match',
  moderate: 'Moderate match',
};

/**
 * Soft match-strength meter: the number counts up to `score` and the bar fills
 * to match. When the recommendation changes, both animate to the new value.
 * Under reduced motion the final state renders immediately.
 */
export function MatchMeter({
  score,
  strength,
}: {
  score: number;
  strength: MatchStrength | null;
}) {
  const reduced = !!useReducedMotion();
  const display = useCountUp(score, true, 900);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold uppercase tracking-[0.14em] text-forest-700">
          {strength ? STRENGTH_LABEL[strength] : 'Match'}
        </span>
        <span className="font-serif text-3xl text-clay-900" aria-hidden="true">
          {Math.round(display)}
          <span className="text-base text-clay-500">/100</span>
        </span>
      </div>
      <div
        className="mt-2 h-2.5 overflow-hidden rounded-full bg-clay-100"
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Match score ${score} out of 100`}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-forest-400 via-forest-500 to-saffron-400"
          initial={false}
          animate={{ width: `${score}%` }}
          transition={
            reduced ? { duration: 0 } : { duration: 0.9, ease: ease.outExpo }
          }
        />
      </div>
    </div>
  );
}
