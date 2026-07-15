'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { FitCheckAnswers, Recommendation } from '@/lib/types';
import { duration, ease } from '@/lib/motion';
import { Icon } from '@/components/icons';

/**
 * "Under the hood" — a demo-only technical inspector rendered at the very
 * bottom of the fit-check result. Collapsed by default behind an understated
 * monospace chip; expands to show the exact request POSTed to /api/recommend,
 * the key response fields (plus client-measured latency), and a three-line
 * explanation of the architecture. Deliberately secondary to the shopper
 * experience: muted clay tones, small type, below the disclaimer.
 *
 * The open state is owned by FitCheck so the panel survives the result
 * remounting when an answer is edited — the reviewer watches the request,
 * response, and latency update live. Purely presentational: reads the same
 * request/response the shopper flow already produced, never recomputes.
 */
export function TechInspector({
  requestAnswers,
  recommendation,
  latencyMs,
  open,
  onToggle,
}: {
  requestAnswers: FitCheckAnswers;
  recommendation: Recommendation;
  latencyMs: number | null;
  open: boolean;
  onToggle: () => void;
}) {
  const reduced = !!useReducedMotion();
  const requestJson = JSON.stringify(requestAnswers, null, 2);

  return (
    <div className="mt-4 border-t border-dashed border-clay-200 pt-3">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="tech-inspector-panel"
        className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-clay-200 bg-white/60 px-2.5 py-1.5 font-mono text-[11px] text-clay-500 transition-colors duration-150 hover:border-clay-300 hover:text-clay-700"
      >
        <span aria-hidden="true">⌘</span>
        Under the hood — how this was computed
        <Icon
          name="chevron-down"
          className={`h-3 w-3 ${reduced ? '' : 'transition-transform duration-200'} ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="tech-inspector-panel"
            role="region"
            aria-label="Technical details — how this recommendation was computed"
            className="overflow-hidden"
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={
              reduced
                ? { opacity: 0, transition: { duration: 0 } }
                : { height: 0, opacity: 0, transition: { duration: duration.base, ease: ease.emphasizedAccelerate } }
            }
            transition={
              reduced
                ? { duration: 0 }
                : { duration: duration.medium, ease: ease.standard }
            }
          >
            <div className="mt-3 space-y-4 rounded-2xl border border-clay-200 bg-white/70 p-3.5">
              <RequestSection json={requestJson} />
              <ResponseSection rec={recommendation} latencyMs={latencyMs} />
              <HowItWorksSection />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* --- Section 1: the exact JSON body POSTed to /api/recommend --- */

function RequestSection({ json }: { json: string }) {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    },
    [],
  );

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable (permissions/insecure context) — fail silently.
    }
  }, [json]);

  return (
    <section aria-label="Request">
      <div className="flex items-center justify-between gap-2">
        <SectionLabel>
          Request — <span className="normal-case">POST /api/recommend</span>
        </SectionLabel>
        <button
          type="button"
          onClick={copy}
          className="focus-ring rounded-md border border-clay-200 bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-clay-600 transition-colors duration-150 hover:border-clay-300 hover:text-clay-800"
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      {/* tabIndex makes the scrollable code block keyboard-reachable. */}
      <pre
        tabIndex={0}
        aria-label="Request JSON body"
        className="focus-ring mt-1.5 max-h-44 overflow-auto rounded-xl bg-clay-900 p-3 font-mono text-[11px] leading-relaxed text-clay-100"
      >
        {json}
      </pre>
    </section>
  );
}

/* --- Section 2: key response fields + client-measured latency --- */

function ResponseSection({
  rec,
  latencyMs,
}: {
  rec: Recommendation;
  latencyMs: number | null;
}) {
  const isMatch = rec.outcome === 'match';
  return (
    <section aria-label="Response">
      <SectionLabel>Response — key fields</SectionLabel>
      <dl className="mt-1.5 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
        <Field label="outcome">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${
              isMatch ? 'bg-forest-100 text-forest-800' : 'bg-saffron-100 text-saffron-800'
            }`}
          >
            {rec.outcome}
          </span>
        </Field>
        <Field label="matchScore">{rec.matchScore} / 100</Field>
        <Field label="matchStrength">{rec.matchStrength ?? '—'}</Field>
        <Field label="copySource">
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${
                rec.copySource === 'ai' ? 'bg-saffron-500' : 'bg-forest-500'
              }`}
            />
            {rec.copySource === 'ai' ? 'AI-refined' : 'deterministic template'}
          </span>
        </Field>
        <Field label="recommendedVariantId">
          {rec.offer ? (
            <span className="block max-w-full truncate" title={rec.offer.recommendedVariantId}>
              {rec.offer.recommendedVariantId}
            </span>
          ) : (
            '— (safety no-sale branch)'
          )}
        </Field>
        <Field label="offer.sellingMode">{rec.offer?.sellingMode ?? '—'}</Field>
        <Field label="latency">
          {latencyMs != null ? `${latencyMs} ms` : '— (restored session)'}
        </Field>
      </dl>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-3 border-b border-dotted border-clay-100 pb-1">
      <dt className="shrink-0 font-mono text-[11px] text-clay-500">{label}</dt>
      <dd className="min-w-0 text-right font-mono text-[11px] font-semibold text-clay-800">
        {children}
      </dd>
    </div>
  );
}

/* --- Section 3: three factual lines on the architecture --- */

function HowItWorksSection() {
  return (
    <section aria-label="How it works">
      <SectionLabel>How it works</SectionLabel>
      <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-[11px] leading-relaxed text-clay-600 marker:font-mono marker:text-clay-400">
        <li>
          A pure, deterministic engine computes the score, pack, and dose from
          your answers — covered by 24 unit tests.
        </li>
        <li>
          An optional Claude copy layer only rephrases the prose (never the
          numbers) and falls back to a deterministic template —{' '}
          <code className="font-mono text-clay-700">copySource</code> shows which ran.
        </li>
        <li>
          Any safety flag forces the no-sale caution branch — no score or offer
          can override it.
        </li>
      </ol>
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-clay-500">
      {children}
    </p>
  );
}
