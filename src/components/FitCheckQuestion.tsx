'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { ChoiceOption, Question, SafetyToggle } from '@/lib/fit-check/questions';
import type { Goal, SafetyFlag } from '@/lib/types';
import { press, spring, duration, ease } from '@/lib/motion';
import { Icon } from '@/components/icons';
import type { DraftAnswers } from '@/components/fit-check-shared';

/**
 * Renders a single fit-check question (all four shapes: goal multi-select,
 * single-selects, and the 3-toggle safety screen), with the expandable
 * "Why we ask" line and the inline validation nudge.
 */
export function FitCheckQuestion({
  question,
  draft,
  nudge,
  nudgeKey,
  onUpdate,
  onUpdateSafety,
  onSingleSelected,
}: {
  question: Question;
  draft: DraftAnswers;
  nudge: string | null;
  nudgeKey: number;
  onUpdate: (patch: Partial<DraftAnswers>) => void;
  onUpdateSafety: (flag: SafetyFlag, value: boolean) => void;
  onSingleSelected: () => void;
}) {
  const reduced = !!useReducedMotion();

  return (
    <div>
      <motion.div
        key={nudgeKey}
        animate={nudgeKey > 0 && !reduced ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
      >
        <h3 className="font-serif text-2xl leading-snug text-clay-900 sm:text-[28px]">
          {question.title}
        </h3>
        {nudge && (
          <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm font-medium text-saffron-700">
            <Icon name="alert" className="h-4 w-4 shrink-0" />
            {nudge}
          </p>
        )}
      </motion.div>

      <WhyWeAsk text={question.whyWeAsk} reduced={reduced} />

      <div className="mt-5">
        {question.type === 'multi-select' && question.id === 'goals' && (
          <GoalGrid
            options={question.options}
            max={question.maxSelections}
            draft={draft}
            onUpdate={onUpdate}
            reduced={reduced}
          />
        )}

        {/* Re-tapping the already-selected value never re-arms auto-advance. */}
        {question.id === 'stress' && (
          <SingleSelectList
            options={question.options}
            current={draft.stressLevel}
            reduced={reduced}
            onSelect={(v) => {
              if (draft.stressLevel === v) return;
              onUpdate({ stressLevel: v });
              onSingleSelected();
            }}
          />
        )}
        {question.id === 'experience' && (
          <SingleSelectList
            options={question.options}
            current={draft.experience}
            reduced={reduced}
            onSelect={(v) => {
              if (draft.experience === v) return;
              onUpdate({ experience: v });
              onSingleSelected();
            }}
          />
        )}
        {question.id === 'form' && (
          <SingleSelectList
            options={question.options}
            current={draft.formPreference}
            reduced={reduced}
            onSelect={(v) => {
              if (draft.formPreference === v) return;
              onUpdate({ formPreference: v });
              onSingleSelected();
            }}
          />
        )}
        {question.id === 'dose' && (
          <SingleSelectList
            options={question.options}
            current={draft.dosePreference}
            reduced={reduced}
            onSelect={(v) => {
              if (draft.dosePreference === v) return;
              onUpdate({ dosePreference: v });
              onSingleSelected();
            }}
          />
        )}

        {question.type === 'safety' && (
          <div className="flex flex-col gap-3">
            {question.toggles.map((toggle) => (
              <SafetyRow
                key={toggle.flag}
                toggle={toggle}
                value={draft.safety[toggle.flag]}
                reduced={reduced}
                onChange={(v) => onUpdateSafety(toggle.flag, v)}
              />
            ))}
            <p className="mt-1 text-xs leading-relaxed text-clay-500">
              This is wellness guidance, not medical advice — an honest “check with your
              doctor first” is a real outcome here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Why we ask --- */

function WhyWeAsk({ text, reduced }: { text: string; reduced: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="focus-ring inline-flex items-center gap-1 rounded-lg text-sm font-medium text-forest-700 hover:text-forest-800"
      >
        <Icon name="info" className="h-4 w-4" />
        Why we ask
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={reduced ? { duration: 0 } : { duration: duration.base, ease: ease.standard }}
          className="inline-flex"
        >
          <Icon name="chevron-down" className="h-3.5 w-3.5" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: duration.medium, ease: ease.emphasizedDecelerate }}
            className="overflow-hidden"
          >
            <p className="pt-2 text-sm leading-relaxed text-clay-600">{text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* --- Goals multi-select + primary picker --- */

function GoalGrid({
  options,
  max,
  draft,
  onUpdate,
  reduced,
}: {
  options: { value: Goal; label: string; icon?: string }[];
  max: number;
  draft: DraftAnswers;
  onUpdate: (patch: Partial<DraftAnswers>) => void;
  reduced: boolean;
}) {
  const toggle = (goal: Goal) => {
    const has = draft.goals.includes(goal);
    let goals: Goal[];
    if (has) {
      goals = draft.goals.filter((g) => g !== goal);
    } else {
      if (draft.goals.length >= max) return; // cap at maxSelections
      goals = [...draft.goals, goal];
    }
    const primaryGoal =
      draft.primaryGoal && goals.includes(draft.primaryGoal)
        ? draft.primaryGoal
        : goals.length === 1
          ? goals[0]
          : undefined;
    onUpdate({ goals, primaryGoal });
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {options.map((opt) => {
          const selected = draft.goals.includes(opt.value);
          const capped = !selected && draft.goals.length >= max;
          return (
            <motion.button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              aria-pressed={selected}
              whileTap={reduced ? undefined : press}
              className={`focus-ring relative flex min-h-[92px] flex-col items-start justify-between gap-2 rounded-xl border-2 p-3.5 text-left transition-colors duration-150 ${
                selected
                  ? 'border-saffron-500 bg-saffron-50'
                  : capped
                    ? 'border-clay-100 bg-clay-50 opacity-60'
                    : 'border-clay-200 bg-white hover:border-clay-300'
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  selected ? 'bg-saffron-100 text-saffron-700' : 'bg-forest-50 text-forest-700'
                }`}
              >
                <Icon name={opt.icon ?? 'leaf'} className="h-[18px] w-[18px]" />
              </span>
              <span className="text-[13px] font-semibold leading-snug text-clay-900">
                {opt.label}
              </span>
              <AnimatePresence>
                {selected && (
                  <motion.span
                    initial={reduced ? false : { scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={reduced ? undefined : { scale: 0, opacity: 0, transition: { duration: 0.1 } }}
                    transition={spring.select}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-saffron-500 text-white"
                  >
                    <Icon name="check" className="h-3 w-3" strokeWidth={2.6} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Primary-goal picker appears once more than one goal is chosen */}
      <AnimatePresence initial={false}>
        {draft.goals.length > 1 && (
          <motion.div
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: duration.medium, ease: ease.emphasizedDecelerate }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-xl bg-forest-50 p-3.5">
              <p className="text-sm font-semibold text-forest-800">
                Which matters most right now?
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {options
                  .filter((o) => draft.goals.includes(o.value))
                  .map((o) => {
                    const isPrimary = draft.primaryGoal === o.value;
                    return (
                      <motion.button
                        key={o.value}
                        type="button"
                        onClick={() => onUpdate({ primaryGoal: o.value })}
                        aria-pressed={isPrimary}
                        whileTap={reduced ? undefined : press}
                        className={`focus-ring rounded-full border-2 px-3.5 py-1.5 text-sm font-medium transition-colors duration-150 ${
                          isPrimary
                            ? 'border-forest-700 bg-forest-700 text-clay-50'
                            : 'border-forest-200 bg-white text-forest-800 hover:border-forest-300'
                        }`}
                      >
                        {o.label.split(' & ')[0]}
                      </motion.button>
                    );
                  })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* --- Generic single-select list (keeps each question's value type narrow) --- */

function SingleSelectList<T extends string>({
  options,
  current,
  onSelect,
  reduced,
}: {
  options: ChoiceOption<T>[];
  current: T | undefined;
  onSelect: (value: T) => void;
  reduced: boolean;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((opt) => (
        <OptionRow
          key={opt.value}
          selected={current === opt.value}
          label={opt.label}
          description={opt.description}
          icon={opt.icon}
          reduced={reduced}
          onSelect={() => onSelect(opt.value)}
        />
      ))}
    </div>
  );
}

/* --- Single-select row --- */

function OptionRow({
  selected,
  label,
  description,
  icon,
  onSelect,
  reduced,
}: {
  selected: boolean;
  label: string;
  description?: string;
  icon?: string;
  onSelect: () => void;
  reduced: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      whileTap={reduced ? undefined : press}
      className={`focus-ring flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-colors duration-150 ${
        selected
          ? 'border-saffron-500 bg-saffron-50'
          : 'border-clay-200 bg-white hover:border-clay-300'
      }`}
    >
      {icon && (
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            selected ? 'bg-saffron-100 text-saffron-700' : 'bg-forest-50 text-forest-700'
          }`}
        >
          <Icon name={icon} className="h-[18px] w-[18px]" />
        </span>
      )}
      <span className="flex-1">
        <span className="block text-[15px] font-semibold text-clay-900">{label}</span>
        {description && (
          <span className="mt-0.5 block text-[13px] text-clay-500">{description}</span>
        )}
      </span>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150 ${
          selected ? 'border-saffron-500 bg-saffron-500 text-white' : 'border-clay-300'
        }`}
        aria-hidden="true"
      >
        {selected && (
          <motion.span
            initial={reduced ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={spring.select}
            className="inline-flex"
          >
            <Icon name="check" className="h-3 w-3" strokeWidth={3} />
          </motion.span>
        )}
      </span>
    </motion.button>
  );
}

/* --- Safety yes/no row --- */

function SafetyRow({
  toggle,
  value,
  onChange,
  reduced,
}: {
  toggle: SafetyToggle;
  value: boolean | undefined;
  onChange: (v: boolean) => void;
  reduced: boolean;
}) {
  return (
    <div className="rounded-xl border-2 border-clay-200 bg-white px-4 py-3.5">
      <p className="text-[15px] font-semibold leading-snug text-clay-900">{toggle.label}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-clay-500">{toggle.helper}</p>
      <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label={toggle.label}>
        {([true, false] as const).map((v) => {
          const selected = value === v;
          return (
            <motion.button
              key={String(v)}
              type="button"
              onClick={() => onChange(v)}
              aria-pressed={selected}
              whileTap={reduced ? undefined : press}
              className={`focus-ring flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border-2 text-sm font-semibold transition-colors duration-150 ${
                selected
                  ? 'border-forest-700 bg-forest-700 text-clay-50'
                  : 'border-clay-200 bg-white text-clay-700 hover:border-clay-300'
              }`}
            >
              {selected && (
                <motion.span
                  initial={reduced ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={spring.select}
                  className="inline-flex"
                >
                  <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.6} />
                </motion.span>
              )}
              {v ? 'Yes' : 'No'}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
