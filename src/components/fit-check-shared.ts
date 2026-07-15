import type { Question } from '@/lib/fit-check/questions';
import type {
  DosePreference,
  Experience,
  FitCheckAnswers,
  FormPreference,
  Goal,
  StressLevel,
} from '@/lib/types';

/**
 * Shared draft-answer model for the fit-check UI: a partially-answered
 * FitCheckAnswers plus per-step validation and the final assembly step.
 * (Server-side validation is zod in src/lib/validation.ts; this mirrors it for
 * inline, per-step nudges.)
 */

export interface DraftSafety {
  pregnancyOrNursing?: boolean;
  thyroidOrAutoimmune?: boolean;
  sedativesOrLiver?: boolean;
}

export interface DraftAnswers {
  goals: Goal[];
  primaryGoal?: Goal;
  stressLevel?: StressLevel;
  experience?: Experience;
  safety: DraftSafety;
  formPreference?: FormPreference;
  dosePreference?: DosePreference;
}

export function emptyDraft(): DraftAnswers {
  return { goals: [], safety: {} };
}

/** Returns a human nudge when the step can't be left yet, else null. */
export function validateStep(question: Question, draft: DraftAnswers): string | null {
  switch (question.id) {
    case 'goals':
      if (draft.goals.length < question.minSelections) {
        return 'Pick at least one goal to continue.';
      }
      if (draft.goals.length > 1 && !draft.primaryGoal) {
        return 'You picked a few — tap the one that matters most.';
      }
      return null;
    case 'stress':
      return draft.stressLevel ? null : 'Choose the option that fits best.';
    case 'experience':
      return draft.experience ? null : 'Choose the option that fits best.';
    case 'safety': {
      const s = draft.safety;
      const missing =
        s.pregnancyOrNursing === undefined ||
        s.thyroidOrAutoimmune === undefined ||
        s.sedativesOrLiver === undefined;
      return missing ? 'Please answer all three safety checks — they matter.' : null;
    }
    case 'form':
      return draft.formPreference ? null : 'Choose a form — “Not sure” is fine too.';
    case 'dose':
      return draft.dosePreference ? null : 'Choose how often you’d like to take it.';
    default:
      return null;
  }
}

/** Assemble the API payload once every step validates. */
export function draftToAnswers(draft: DraftAnswers): FitCheckAnswers | null {
  const s = draft.safety;
  if (
    draft.goals.length === 0 ||
    !draft.stressLevel ||
    !draft.experience ||
    !draft.formPreference ||
    !draft.dosePreference ||
    s.pregnancyOrNursing === undefined ||
    s.thyroidOrAutoimmune === undefined ||
    s.sedativesOrLiver === undefined
  ) {
    return null;
  }
  return {
    goals: draft.goals,
    primaryGoal:
      draft.goals.length > 1 ? (draft.primaryGoal ?? draft.goals[0]) : draft.goals[0],
    stressLevel: draft.stressLevel,
    experience: draft.experience,
    safety: {
      pregnancyOrNursing: s.pregnancyOrNursing,
      thyroidOrAutoimmune: s.thyroidOrAutoimmune,
      sedativesOrLiver: s.sedativesOrLiver,
    },
    formPreference: draft.formPreference,
    dosePreference: draft.dosePreference,
  };
}

/** Compact per-question answer summary for the result's "your answers" chips. */
export function answerSummary(question: Question, answers: FitCheckAnswers): string {
  switch (question.id) {
    case 'goals': {
      const labels = question.options
        .filter((o) => answers.goals.includes(o.value))
        .map((o) => o.label.split(' & ')[0]);
      return labels.join(', ');
    }
    case 'stress':
      return question.options.find((o) => o.value === answers.stressLevel)?.label ?? '';
    case 'experience':
      return question.options.find((o) => o.value === answers.experience)?.label ?? '';
    case 'safety': {
      const flagged =
        answers.safety.pregnancyOrNursing ||
        answers.safety.thyroidOrAutoimmune ||
        answers.safety.sedativesOrLiver;
      return flagged ? 'Flagged for review' : 'No flags';
    }
    case 'form':
      return question.options.find((o) => o.value === answers.formPreference)?.label ?? '';
    case 'dose':
      return question.options.find((o) => o.value === answers.dosePreference)?.label ?? '';
    default:
      return '';
  }
}

/** Short chip label for each step. */
export const STEP_LABEL: Record<string, string> = {
  goals: 'Goals',
  stress: 'Stress',
  experience: 'Experience',
  safety: 'Safety',
  form: 'Form',
  dose: 'Dose',
};
