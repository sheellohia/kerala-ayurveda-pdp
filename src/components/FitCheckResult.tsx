'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { FitCheckAnswers, Recommendation } from '@/lib/types';
import { questions } from '@/lib/fit-check/questions';
import { lift, press, spring, staggerContainer, staggerItem } from '@/lib/motion';
import { formatMoney, offerPackDisplayLabel } from '@/lib/format';
import { Icon } from '@/components/icons';
import { MatchMeter } from '@/components/MatchMeter';
import { TechInspector } from '@/components/TechInspector';
import { answerSummary, STEP_LABEL } from '@/components/fit-check-shared';

/**
 * The fit-check result: a match (meter, "why this fits you" recap, dosed
 * transparency, protocol, timeline, recommended pack + CTA) or the honest
 * caution outcome (calm, no add-to-cart). Every answer stays editable.
 */
export function FitCheckResult({
  recommendation,
  answers,
  latencyMs,
  inspectorOpen,
  onToggleInspector,
  onEditStep,
  onRetake,
  onAddRecommended,
  onShowProduct,
}: {
  recommendation: Recommendation;
  answers: FitCheckAnswers;
  /** Client-measured /api/recommend round-trip; null for restored sessions. */
  latencyMs: number | null;
  /** Owned by FitCheck so the inspector survives result re-composition. */
  inspectorOpen: boolean;
  onToggleInspector: () => void;
  onEditStep: (index: number) => void;
  onRetake: () => void;
  onAddRecommended: () => boolean;
  onShowProduct: () => void;
}) {
  const reduced = !!useReducedMotion();
  const [addError, setAddError] = useState(false);
  const rec = recommendation;
  const isMatch = rec.outcome === 'match';

  // Entering the result moves focus to the verdict heading so screen readers
  // announce the outcome; aria-live mirrors the computing state's role=status.
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <>
    <div aria-live="polite">
      {/* Personalized badge + copy provenance (subtle) */}
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
            isMatch ? 'bg-forest-100 text-forest-800' : 'bg-clay-100 text-clay-700'
          }`}
          title={
            rec.copySource === 'ai'
              ? 'Copy refined by AI from your answers; every number is engine-computed.'
              : 'Copy from our reviewed template; every number is engine-computed.'
          }
        >
          <Icon name="sparkle" className="h-3 w-3" />
          Personalized
          <span className="sr-only">
            {rec.copySource === 'ai' ? '(AI-refined copy)' : '(template copy)'}
          </span>
        </span>
      </div>

      {isMatch && rec.matchStrength && (
        <div className="mt-4">
          <MatchMeter score={rec.matchScore} strength={rec.matchStrength} />
        </div>
      )}

      <h3
        ref={headingRef}
        tabIndex={-1}
        className={`mt-5 font-serif text-2xl leading-snug outline-none sm:text-[28px] ${
          isMatch ? 'text-clay-900' : 'text-forest-900'
        }`}
      >
        {rec.copy.verdictHeadline}
      </h3>
      <p className="mt-2 text-[15px] leading-relaxed text-clay-600">
        {rec.copy.verdictSubcopy}
      </p>

      {/* Why this fits you / why we're cautious — staggered recap */}
      <motion.ul
        variants={reduced ? undefined : staggerContainer}
        initial={reduced ? false : 'hidden'}
        animate="visible"
        className={`mt-5 flex flex-col gap-2.5 rounded-2xl p-4 ${
          isMatch ? 'bg-forest-50' : 'bg-clay-100/70'
        }`}
        aria-label={isMatch ? 'Why this fits you' : 'Why we suggest caution'}
      >
        {rec.copy.reasons.map((reason, i) => (
          <motion.li
            key={i}
            variants={reduced ? undefined : staggerItem}
            className="flex items-start gap-2.5 text-sm leading-relaxed text-clay-800"
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                isMatch ? 'bg-forest-600 text-clay-50' : 'bg-clay-400 text-white'
              }`}
            >
              <Icon name={isMatch ? 'check' : 'info'} className="h-3 w-3" strokeWidth={2.4} />
            </span>
            {reason}
          </motion.li>
        ))}
      </motion.ul>

      {isMatch ? (
        <MatchBody
          rec={rec}
          reduced={reduced}
          addError={addError}
          onAdd={() => {
            const ok = onAddRecommended();
            setAddError(!ok);
          }}
        />
      ) : (
        <CautionBody rec={rec} />
      )}

      {/* Adjust any answer — recommendation re-composes on change */}
      <div className="mt-6 border-t border-clay-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay-500">
          Your answers — tap to adjust
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {questions.map((q, i) => (
            <motion.button
              key={q.id}
              type="button"
              onClick={() => onEditStep(i)}
              whileTap={reduced ? undefined : press}
              className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-clay-200 bg-white px-3 py-1.5 text-xs text-clay-700 transition-colors duration-150 hover:border-clay-300 hover:text-clay-900"
            >
              <span className="font-semibold">{STEP_LABEL[q.id]}:</span>
              <span className="max-w-[160px] truncate">{answerSummary(q, answers)}</span>
              <Icon name="edit" className="h-3 w-3 text-clay-400" />
            </motion.button>
          ))}
          <motion.button
            type="button"
            onClick={onRetake}
            whileTap={reduced ? undefined : press}
            className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-clay-200 bg-white px-3 py-1.5 text-xs font-semibold text-forest-700 transition-colors duration-150 hover:border-forest-300"
          >
            <Icon name="refresh" className="h-3 w-3" />
            Retake
          </motion.button>
        </div>
      </div>

      {!isMatch && (
        <div className="mt-5">
          <button
            type="button"
            onClick={onShowProduct}
            className="focus-ring w-full rounded-2xl border-2 border-clay-200 bg-white px-4 py-3 text-sm font-semibold text-clay-800 transition-colors duration-150 hover:border-clay-300"
          >
            Back to the product page
          </button>
        </div>
      )}

      <p className="mt-5 text-[11px] leading-relaxed text-clay-500">
        {rec.disclaimer} Wellness guidance only — not medical advice.
      </p>
    </div>

    {/* Demo aid, deliberately last and OUTSIDE the aria-live region so
        expanding it never re-announces the result or the JSON blob. */}
    <TechInspector
      requestAnswers={answers}
      recommendation={rec}
      latencyMs={latencyMs}
      open={inspectorOpen}
      onToggle={onToggleInspector}
    />
    </>
  );
}

/* --- Match-only body: transparency, protocol, timeline, offer --- */

function MatchBody({
  rec,
  reduced,
  addError,
  onAdd,
}: {
  rec: Recommendation;
  reduced: boolean;
  addError: boolean;
  onAdd: () => void;
}) {
  return (
    <>
      {/* Dosed transparency */}
      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { label: 'Extract', value: rec.extract.name },
          { label: 'Per serving', value: `${rec.extract.mgPerServing} mg` },
          { label: 'Withanolides', value: `${rec.extract.withanolidePercent}%` },
          { label: 'Plant part', value: rec.extract.plantPart.split(' (')[0] },
        ].map((chip) => (
          <div
            key={chip.label}
            className="rounded-xl border border-clay-100 bg-white px-3 py-2.5"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-clay-500">
              {chip.label}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-clay-900">{chip.value}</p>
          </div>
        ))}
      </div>

      {/* Protocol */}
      {rec.protocol && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-clay-100 bg-white p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-saffron-100 text-saffron-700">
            <Icon name="capsule" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-clay-900">
              Your protocol — {rec.protocol.mgPerDay} mg/day, {rec.protocol.timing}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-clay-600">
              {rec.protocol.summary}
            </p>
          </div>
        </div>
      )}

      {/* Timeline (compact) */}
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {rec.timeline.map((m) => (
          <div key={m.window} className="rounded-xl bg-clay-100/60 px-3 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-forest-700">
              {m.window}
            </p>
            <p className="text-[13px] font-semibold text-clay-900">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Recommended offer */}
      {rec.offer && (
        <div className="mt-5 rounded-2xl border-2 border-saffron-200 bg-saffron-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-base font-semibold text-clay-900">
              {offerPackDisplayLabel(rec.offer.recommendedPackLabel)}
            </p>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-forest-700">
              {rec.offer.sellingMode === 'subscription'
                ? 'Subscribe & save'
                : 'One-time'}
            </span>
          </div>
          <p className="mt-1 text-sm text-clay-700">
            <span className="font-semibold text-clay-900">
              {formatMoney(rec.offer.pricePerDay)}/day
            </span>
            {' · '}about {rec.offer.daysSupply} days of supply
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-clay-600">
            {rec.offer.reasonForPack}
          </p>
          <motion.button
            type="button"
            onClick={onAdd}
            whileHover={reduced ? undefined : lift}
            whileTap={reduced ? undefined : press}
            transition={spring.select}
            className="focus-ring mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-saffron-500 text-[15px] font-semibold text-white shadow-soft transition-colors duration-150 hover:bg-saffron-600"
          >
            <Icon name="cart" className="h-5 w-5" />
            Add recommended pack to cart
          </motion.button>
          {addError && (
            <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-saffron-700">
              <Icon name="alert" className="h-4 w-4" />
              Something went wrong — try again
            </p>
          )}
        </div>
      )}
    </>
  );
}

/* --- Caution-only body: calm, honest, no sale --- */

function CautionBody({ rec }: { rec: Recommendation }) {
  return (
    <div className="mt-5 rounded-2xl border border-forest-200 bg-forest-50 p-4">
      <p className="flex items-start gap-2.5 text-sm leading-relaxed text-forest-900">
        <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0 text-forest-700" />
        {rec.cautionNote ??
          'Please talk to a qualified healthcare professional before starting any new supplement.'}
      </p>
      <p className="mt-3 text-[13px] leading-relaxed text-forest-800">
        Bring the label with you: {rec.extract.name}, {rec.extract.mgPerServing} mg per
        serving, {rec.extract.withanolidePercent}% withanolides, {rec.extract.plantPart.toLowerCase()}.
      </p>
    </div>
  );
}
