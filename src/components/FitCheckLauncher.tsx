'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { FitCheckSession } from '@/components/FitCheck';
import { lift, press, spring } from '@/lib/motion';
import { Icon } from '@/components/icons';

/**
 * Calm, prominent entry to the fit-check, directly under the buy panel.
 * Once a session exists it becomes a compact summary with a "view / adjust"
 * re-entry point.
 */
export function FitCheckLauncher({
  session,
  onOpen,
}: {
  session: FitCheckSession | null;
  onOpen: () => void;
}) {
  const reduced = !!useReducedMotion();
  const rec = session?.recommendation;

  return (
    <div className="rounded-2xl border border-forest-100 bg-gradient-to-br from-forest-50 to-clay-50 p-5">
      <div className="flex items-start gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-700 text-clay-50">
          <Icon name="sparkle" className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <h2 className="font-serif text-xl text-clay-900">Is this right for me?</h2>
          {rec ? (
            <p className="mt-1 text-sm leading-relaxed text-clay-600">
              {rec.outcome === 'match' ? (
                <>
                  Your result:{' '}
                  <span className="font-semibold text-forest-800">
                    {rec.matchScore}/100 —{' '}
                    {rec.matchStrength === 'strong'
                      ? 'strong'
                      : rec.matchStrength === 'good'
                        ? 'good'
                        : 'moderate'}{' '}
                    match
                  </span>
                  . Open it to review or adjust any answer.
                </>
              ) : (
                <>
                  Your result suggested{' '}
                  <span className="font-semibold text-forest-800">
                    checking with your doctor first
                  </span>
                  . You can review or adjust your answers anytime.
                </>
              )}
            </p>
          ) : (
            <p className="mt-1 text-sm leading-relaxed text-clay-600">
              Six quick questions — get an honest fit check, your dose and timing, and
              the right pack. About a minute.
            </p>
          )}
          <motion.button
            type="button"
            onClick={onOpen}
            whileHover={reduced ? undefined : lift}
            whileTap={reduced ? undefined : press}
            transition={spring.select}
            className="focus-ring mt-3.5 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-forest-700 px-6 text-sm font-semibold text-clay-50 shadow-soft transition-colors duration-150 hover:bg-forest-800"
          >
            {rec ? 'View my result' : 'Check my fit'}
            <Icon name="arrow-right" className="h-4 w-4" />
          </motion.button>
          <p className="mt-2.5 text-[11px] leading-relaxed text-clay-500">
            Includes honest “not for you” outcomes. Wellness guidance, not medical
            advice.
          </p>
        </div>
      </div>
    </div>
  );
}
