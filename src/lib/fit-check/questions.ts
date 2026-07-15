import type {
  DosePreference,
  Experience,
  FormPreference,
  Goal,
  SafetyFlag,
  StressLevel,
} from '@/lib/types';

/**
 * The "Is this right for me?" fit-check: 6 questions, one per screen, ~2–3 min.
 * This module is the single source of truth for the flow's copy and options —
 * the UI renders it and the engine consumes the resulting answers. Kept as data
 * (not JSX) so it is also portable to the Shopify Liquid app block.
 */

export type QuestionType = 'multi-select' | 'single-select' | 'safety';

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  icon?: string;
}

export interface SafetyToggle {
  flag: SafetyFlag;
  label: string;
  helper: string;
}

interface BaseQuestion {
  id: string;
  type: QuestionType;
  title: string;
  /** Expandable "why we ask" microcopy that builds trust. */
  whyWeAsk: string;
}

export interface GoalQuestion extends BaseQuestion {
  id: 'goals';
  type: 'multi-select';
  options: ChoiceOption<Goal>[];
  minSelections: number;
  maxSelections: number;
}

export interface StressQuestion extends BaseQuestion {
  id: 'stress';
  type: 'single-select';
  options: ChoiceOption<StressLevel>[];
}

export interface ExperienceQuestion extends BaseQuestion {
  id: 'experience';
  type: 'single-select';
  options: ChoiceOption<Experience>[];
}

export interface SafetyQuestion extends BaseQuestion {
  id: 'safety';
  type: 'safety';
  toggles: SafetyToggle[];
}

export interface FormQuestion extends BaseQuestion {
  id: 'form';
  type: 'single-select';
  options: ChoiceOption<FormPreference>[];
}

export interface DoseQuestion extends BaseQuestion {
  id: 'dose';
  type: 'single-select';
  options: ChoiceOption<DosePreference>[];
}

export type Question =
  | GoalQuestion
  | StressQuestion
  | ExperienceQuestion
  | SafetyQuestion
  | FormQuestion
  | DoseQuestion;

export const questions: Question[] = [
  {
    id: 'goals',
    type: 'multi-select',
    title: 'What are you hoping ashwagandha helps with?',
    whyWeAsk:
      'Ashwagandha is an adaptogen with a few different everyday uses. Telling us your goal lets us tailor the dose, timing, and what to realistically expect.',
    minSelections: 1,
    maxSelections: 4,
    options: [
      { value: 'stress', label: 'Stress & feeling calmer', icon: 'leaf' },
      { value: 'sleep', label: 'Better sleep', icon: 'moon' },
      { value: 'energy', label: 'Steady energy & less fatigue', icon: 'sun' },
      { value: 'focus', label: 'Focus & mental stamina', icon: 'sparkle' },
      { value: 'recovery', label: 'Exercise recovery & strength', icon: 'dumbbell' },
      { value: 'mood', label: 'Mood balance', icon: 'heart' },
    ],
  },
  {
    id: 'stress',
    type: 'single-select',
    title: 'How would you describe your stress right now?',
    whyWeAsk:
      'Ashwagandha’s most-studied benefit is for everyday stress. Your answer helps us gauge fit and suggest whether a once- or twice-daily routine makes sense.',
    options: [
      { value: 'rare', label: 'Rarely stressed', description: 'I feel pretty balanced most days.' },
      { value: 'occasional', label: 'Occasional spikes', description: 'Certain days or deadlines get to me.' },
      { value: 'frequent', label: 'Frequently wired or on-edge', description: 'Most weeks feel demanding.' },
      { value: 'constant', label: 'Constantly overwhelmed', description: 'I rarely get to switch off.' },
    ],
  },
  {
    id: 'experience',
    type: 'single-select',
    title: 'Have you taken adaptogens or ashwagandha before?',
    whyWeAsk:
      'This tells us whether to recommend a first full cycle to try, or a larger pack / subscription if you already know it works for you.',
    options: [
      { value: 'new', label: 'New to it', description: 'This would be my first time.' },
      { value: 'some', label: 'Tried some', description: 'I’ve used adaptogens on and off.' },
      { value: 'regular', label: 'Take it regularly', description: 'It’s part of my routine.' },
    ],
  },
  {
    id: 'safety',
    type: 'safety',
    title: 'A few quick safety checks',
    whyWeAsk:
      'Ashwagandha isn’t right for everyone. These questions let us flag if you should talk to your doctor first — we’d rather be honest than make a sale.',
    toggles: [
      {
        flag: 'pregnancyOrNursing',
        label: 'Are you pregnant, breastfeeding, or trying to conceive?',
        helper: 'Ashwagandha is not recommended during pregnancy or breastfeeding.',
      },
      {
        flag: 'thyroidOrAutoimmune',
        label: 'Do you have a thyroid or autoimmune condition, or take thyroid medication?',
        helper: 'Ashwagandha may affect thyroid hormones and immune activity.',
      },
      {
        flag: 'sedativesOrLiver',
        label: 'Do you take sedatives, sleep meds, or benzodiazepines, or have a liver or GI condition?',
        helper: 'There can be additive sedation and other interactions to review with a doctor.',
      },
    ],
  },
  {
    id: 'form',
    type: 'single-select',
    title: 'Capsules or powder?',
    whyWeAsk:
      'Capsules are tasteless and pre-measured; powder lets you adjust the dose and mix it into warm milk or a smoothie, but has a strong, earthy taste.',
    options: [
      { value: 'capsule', label: 'Capsules', description: 'Tasteless, pre-measured, easy on the go.', icon: 'capsule' },
      { value: 'powder', label: 'Powder', description: 'Traditional, flexible dose, earthy taste.', icon: 'powder' },
      { value: 'no-preference', label: 'Not sure — recommend one', description: 'Pick whatever fits my goal best.', icon: 'sparkle' },
    ],
  },
  {
    id: 'dose',
    type: 'single-select',
    title: 'How often would you like to take it?',
    whyWeAsk:
      'A single morning dose is simplest; a second dose with dinner adds evening wind-down. We’ll suggest the dose that matches your goal, but your preference wins.',
    options: [
      { value: 'once', label: 'Once a day', description: 'Simplest — one serving with breakfast.' },
      { value: 'twice', label: 'Twice a day', description: 'Morning and evening for stronger support.' },
      { value: 'no-preference', label: 'Whatever works best', description: 'Recommend the dose for my goal.' },
    ],
  },
];

export const totalSteps = questions.length;
