'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { questions, totalSteps } from '@/lib/fit-check/questions';
import type {
  FitCheckAnswers,
  Recommendation,
  RecommendationOffer,
  SafetyFlag,
} from '@/lib/types';
import { duration, ease, spring, stepTransition } from '@/lib/motion';
import { useBodyScrollLock, useDialogFocus } from '@/lib/hooks';
import { Icon } from '@/components/icons';
import { FitCheckQuestion } from '@/components/FitCheckQuestion';
import { FitCheckResult } from '@/components/FitCheckResult';
import {
  draftToAnswers,
  emptyDraft,
  validateStep,
  type DraftAnswers,
} from '@/components/fit-check-shared';

type Phase = 'question' | 'computing' | 'result' | 'error';

export interface FitCheckSession {
  recommendation: Recommendation;
  answers: FitCheckAnswers;
}

/**
 * The "Is this right for me?" fit-check overlay — the PDP centerpiece.
 * A 6-step guided flow (one question per screen) that POSTs FitCheckAnswers to
 * /api/recommend and renders the match/caution result. Handles: entry, inline
 * validation nudges, computing (skeleton only past ~350ms), result cross-fade,
 * per-answer adjust with re-compose, fetch errors with retry, and a persistent
 * escape hatch. Reduced motion jumps to end states throughout.
 */
export function FitCheck({
  open,
  onClose,
  onResult,
  onAddRecommended,
  onApplyOffer,
  stored,
}: {
  open: boolean;
  onClose: () => void;
  onResult: (session: FitCheckSession) => void;
  onAddRecommended: (offer: RecommendationOffer) => boolean;
  onApplyOffer: (offer: RecommendationOffer) => void;
  stored: FitCheckSession | null;
}) {
  const reduced = !!useReducedMotion();
  const [phase, setPhase] = useState<Phase>('question');
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<DraftAnswers>(emptyDraft);
  const [editing, setEditing] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [lastAnswers, setLastAnswers] = useState<FitCheckAnswers | null>(null);
  // Demo aid ("Under the hood"): /api/recommend round-trip in ms (null until a
  // live request completes — restored sessions have no measurement), and the
  // inspector's open state, lifted here so it survives result re-composition.
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [resultVersion, setResultVersion] = useState(0);
  const [nudge, setNudge] = useState<{ message: string; key: number } | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const panelRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);
  const advanceTimerRef = useRef<number | null>(null);
  const wasOpenRef = useRef(false);

  useBodyScrollLock(open);
  // Trap Tab inside the dialog while open; restore focus to the trigger on close.
  useDialogFocus(open, panelRef);

  // Re-entering with a stored session resumes at the result.
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      if (stored && !recommendation) {
        setRecommendation(stored.recommendation);
        setLastAnswers(stored.answers);
        setDraft(answersToDraft(stored.answers));
        setResultVersion((v) => v + 1);
        setPhase('result');
      }
      window.setTimeout(() => panelRef.current?.focus(), 30);
    }
    wasOpenRef.current = open;
  }, [open, stored, recommendation]);

  // Escape closes; clear pending auto-advance on unmount.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
    };
  }, [open, onClose]);

  const question = questions[step];

  const updateDraft = useCallback((patch: Partial<DraftAnswers>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setNudge(null);
  }, []);

  // Functional per-flag update so rapid toggling never clobbers sibling answers.
  const updateSafety = useCallback((flag: SafetyFlag, value: boolean) => {
    setDraft((d) => ({ ...d, safety: { ...d.safety, [flag]: value } }));
    setNudge(null);
  }, []);

  const submit = useCallback(
    async (answers: FitCheckAnswers) => {
      const requestId = ++requestIdRef.current;
      setPhase('computing');
      setShowSkeleton(false);
      setLastAnswers(answers);
      // Skeleton/shimmer only if the request takes longer than ~350ms.
      const skeletonTimer = window.setTimeout(() => {
        if (requestIdRef.current === requestId) setShowSkeleton(true);
      }, 350);
      try {
        const startedAt = performance.now();
        const res = await fetch('/api/recommend', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(answers),
        });
        if (!res.ok) {
          const data: { error?: string } | null = await res.json().catch(() => null);
          throw new Error(data?.error ?? `Request failed (${res.status})`);
        }
        const data = (await res.json()) as { recommendation: Recommendation };
        const elapsedMs = Math.round(performance.now() - startedAt);
        if (requestIdRef.current !== requestId) return;
        setLatencyMs(elapsedMs);
        setRecommendation(data.recommendation);
        setResultVersion((v) => v + 1);
        setEditing(false);
        setPhase('result');
        onResult({ recommendation: data.recommendation, answers });
      } catch (err) {
        if (requestIdRef.current !== requestId) return;
        setErrorMsg(
          err instanceof Error && err.message
            ? err.message
            : 'We couldn’t reach the recommendation service.',
        );
        setPhase('error');
      } finally {
        window.clearTimeout(skeletonTimer);
        if (requestIdRef.current === requestId) setShowSkeleton(false);
      }
    },
    [onResult],
  );

  const trySubmit = useCallback(() => {
    const answers = draftToAnswers(draft);
    if (!answers) {
      // Jump to the first incomplete step and nudge it.
      const firstInvalid = questions.findIndex((q) => validateStep(q, draft) !== null);
      const target = firstInvalid === -1 ? 0 : firstInvalid;
      setStep(target);
      setPhase('question');
      const message = validateStep(questions[target], draft);
      if (message) setNudge({ message, key: Date.now() });
      return;
    }
    void submit(answers);
  }, [draft, submit]);

  const goNext = useCallback(() => {
    const message = validateStep(question, draft);
    if (message) {
      setNudge({ message, key: Date.now() });
      return;
    }
    setNudge(null);
    if (editing || step === totalSteps - 1) {
      trySubmit();
    } else {
      setStep((s) => s + 1);
    }
  }, [question, draft, editing, step, trySubmit]);

  const goNextRef = useRef(goNext);
  goNextRef.current = goNext;

  /**
   * Single-selects auto-advance ~250ms after a NEW choice. Under reduced
   * motion there is no auto-advance — the explicit Continue button is the path.
   */
  const handleSingleSelected = useCallback(() => {
    if (reduced) return;
    if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = window.setTimeout(() => {
      goNextRef.current();
    }, 250);
  }, [reduced]);

  const goBack = useCallback(() => {
    if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
    setNudge(null);
    if (editing) {
      // Cancel the edit: restore the answered draft and return to the result.
      if (lastAnswers) setDraft(answersToDraft(lastAnswers));
      setEditing(false);
      setPhase('result');
      return;
    }
    setStep((s) => Math.max(0, s - 1));
  }, [editing, lastAnswers]);

  const handleEditStep = useCallback((index: number) => {
    setStep(index);
    setEditing(true);
    setNudge(null);
    setPhase('question');
  }, []);

  const handleRetake = useCallback(() => {
    setDraft(emptyDraft());
    setStep(0);
    setEditing(false);
    setNudge(null);
    setPhase('question');
  }, []);

  const handleAdd = useCallback((): boolean => {
    const offer = recommendation?.offer;
    if (!offer) return false;
    const ok = onAddRecommended(offer);
    if (ok) onClose();
    return ok;
  }, [recommendation, onAddRecommended, onClose]);

  const handleShowProduct = useCallback(() => {
    const offer = recommendation?.offer;
    if (offer) onApplyOffer(offer);
    onClose();
  }, [recommendation, onApplyOffer, onClose]);

  // During questions the fill is capped at step/totalSteps — the final
  // increment is reserved for the result, so the bar never reads 100% while a
  // question is still on screen.
  const progress = phase === 'question' ? step / totalSteps : 1;

  const bodyKey =
    phase === 'question'
      ? `q-${step}`
      : phase === 'computing'
        ? 'computing'
        : phase === 'error'
          ? 'error'
          : `result-${resultVersion}`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: duration.fast } }}
          transition={{ duration: duration.base }}
        >
          <button
            type="button"
            aria-label="Close fit check"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-clay-900/45 backdrop-blur-[2px]"
            tabIndex={-1}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Is this right for me? — fit check"
            tabIndex={-1}
            initial={reduced ? false : { opacity: 0, y: 40, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduced
                ? { opacity: 0 }
                : { opacity: 0, y: 24, scale: 0.985, transition: { duration: duration.base, ease: ease.emphasizedAccelerate } }
            }
            transition={spring.soft}
            className="focus-ring relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-clay-50 shadow-lift outline-none sm:max-w-xl sm:rounded-3xl"
          >
            {/* Header: progress + close */}
            <div className="border-b border-clay-100 bg-white/70 px-5 pb-3.5 pt-4 sm:px-7">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700">
                  {phase === 'result'
                    ? 'Your fit check'
                    : phase === 'computing'
                      ? 'Checking your fit'
                      : `Step ${step + 1} of ${totalSteps}`}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="focus-ring -mr-1.5 flex h-9 w-9 items-center justify-center rounded-full text-clay-500 transition-colors duration-150 hover:bg-clay-100 hover:text-clay-800"
                >
                  <Icon name="close" className="h-[18px] w-[18px]" />
                </button>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-clay-100">
                <motion.div
                  className="h-full rounded-full bg-forest-500"
                  initial={false}
                  animate={{ width: `${progress * 100}%` }}
                  transition={reduced ? { duration: 0 } : spring.soft}
                />
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={bodyKey}
                  variants={reduced ? undefined : phase === 'question' ? stepTransition : undefined}
                  initial={
                    reduced ? false : phase === 'question' ? 'enter' : { opacity: 0 }
                  }
                  animate={phase === 'question' ? 'center' : { opacity: 1 }}
                  exit={
                    reduced
                      ? { opacity: 0, transition: { duration: 0 } }
                      : phase === 'question'
                        ? 'exit'
                        : { opacity: 0, transition: { duration: duration.base } }
                  }
                  transition={
                    phase !== 'question'
                      ? { duration: duration.base, ease: ease.standard }
                      : undefined
                  }
                >
                  {phase === 'question' && (
                    <FitCheckQuestion
                      question={question}
                      draft={draft}
                      nudge={nudge?.message ?? null}
                      nudgeKey={nudge?.key ?? 0}
                      onUpdate={updateDraft}
                      onUpdateSafety={updateSafety}
                      onSingleSelected={handleSingleSelected}
                    />
                  )}

                  {phase === 'computing' && (
                    <ComputingState showSkeleton={showSkeleton} reduced={reduced} />
                  )}

                  {phase === 'error' && (
                    <ErrorState
                      message={errorMsg}
                      onRetry={() => lastAnswers && void submit(lastAnswers)}
                    />
                  )}

                  {phase === 'result' && recommendation && lastAnswers && (
                    <FitCheckResult
                      recommendation={recommendation}
                      answers={lastAnswers}
                      latencyMs={latencyMs}
                      inspectorOpen={inspectorOpen}
                      onToggleInspector={() => setInspectorOpen((v) => !v)}
                      onEditStep={handleEditStep}
                      onRetake={handleRetake}
                      onAddRecommended={handleAdd}
                      onShowProduct={handleShowProduct}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer: nav + persistent escape hatch */}
            <div className="border-t border-clay-100 bg-white/70 px-5 py-3.5 sm:px-7">
              {phase === 'question' && (
                <div className="flex items-center gap-3">
                  {(step > 0 || editing) && (
                    <button
                      type="button"
                      onClick={goBack}
                      className="focus-ring h-12 rounded-2xl border-2 border-clay-200 bg-white px-5 text-sm font-semibold text-clay-700 transition-colors duration-150 hover:border-clay-300"
                    >
                      {editing ? 'Cancel' : 'Back'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={goNext}
                    className="focus-ring h-12 flex-1 rounded-2xl bg-forest-700 text-sm font-semibold text-clay-50 transition-colors duration-150 hover:bg-forest-800"
                  >
                    {editing
                      ? 'Update my result'
                      : step === totalSteps - 1
                        ? 'See my result'
                        : 'Continue'}
                  </button>
                </div>
              )}
              {/* Escape hatch, contextualized: skip during questions; "done"
                  on a match result; hidden on caution (its body already has a
                  single, calm exit — no two near-identical leave actions). */}
              {!(phase === 'result' && recommendation?.outcome === 'caution') && (
                <button
                  type="button"
                  onClick={phase === 'result' ? handleShowProduct : onClose}
                  className="focus-ring mx-auto mt-2 block rounded-lg px-2 py-1 text-xs font-medium text-clay-500 underline decoration-clay-300 underline-offset-2 transition-colors duration-150 hover:text-clay-700"
                >
                  {phase === 'result'
                    ? 'Done — back to the product'
                    : 'Skip — just show me the product'}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* --- Error: verdict heading takes focus on entry; announced as an alert --- */

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);
  return (
    <div className="py-8 text-center" role="alert">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-clay-100 text-clay-600">
        <Icon name="alert" className="h-6 w-6" />
      </span>
      <h3
        ref={headingRef}
        tabIndex={-1}
        className="mt-4 font-serif text-2xl text-clay-900 outline-none"
      >
        We couldn’t check your fit
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-clay-600">
        {message} Your answers are saved — nothing to redo.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="focus-ring mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-forest-700 px-6 text-sm font-semibold text-clay-50 transition-colors duration-150 hover:bg-forest-800"
      >
        <Icon name="refresh" className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}

/* --- Computing: blank under 350ms, then a layout-matching shimmer skeleton --- */

function ComputingState({
  showSkeleton,
  reduced,
}: {
  showSkeleton: boolean;
  reduced: boolean;
}) {
  if (!showSkeleton) {
    // Under ~350ms nothing flashes; height is reserved to avoid a jump.
    return <div className="min-h-[320px]" aria-hidden="true" />;
  }
  if (reduced) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <p className="text-sm font-medium text-clay-600" role="status">
          Finding your match…
        </p>
      </div>
    );
  }
  return (
    <div className="min-h-[320px]" role="status" aria-label="Finding your match">
      <p className="sr-only">Finding your match…</p>
      <SkeletonBlock className="h-5 w-28 rounded-full" />
      <SkeletonBlock className="mt-4 h-9 w-40" />
      <SkeletonBlock className="mt-3 h-2.5 w-full rounded-full" />
      <SkeletonBlock className="mt-6 h-8 w-4/5" />
      <SkeletonBlock className="mt-3 h-4 w-3/5" />
      <div className="mt-5 space-y-2.5 rounded-2xl bg-white p-4">
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-11/12" />
        <SkeletonBlock className="h-4 w-4/5" />
      </div>
      <SkeletonBlock className="mt-5 h-24 w-full rounded-2xl" />
    </div>
  );
}

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-clay-100 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  );
}

/** Rebuild an editable draft from previously submitted answers. */
function answersToDraft(answers: FitCheckAnswers): DraftAnswers {
  return {
    goals: [...answers.goals],
    primaryGoal: answers.primaryGoal ?? answers.goals[0],
    stressLevel: answers.stressLevel,
    experience: answers.experience,
    safety: { ...answers.safety },
    formPreference: answers.formPreference,
    dosePreference: answers.dosePreference,
  };
}
