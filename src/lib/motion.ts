import type { Transition, Variants } from 'framer-motion';

/**
 * ONE shared motion vocabulary for the whole PDP — the "calm, deliberate,
 * physics-inspired" bar from the research (Seed's Grow / Shift / Transform).
 * Every component imports from here so timings and easings never drift.
 *
 * Rules of thumb, encoded below:
 *   - Interactive feedback (selection, press): springs, < ~200ms perceived.
 *   - Decorative reveals: eased tweens, ~300–500ms.
 *   - Nothing that delays the purchase. Respect prefers-reduced-motion.
 */

/* --- Easing curves (Material-style emphasized set + a soft ease-out) --- */
export const ease = {
  standard: [0.2, 0, 0, 1] as const,
  emphasizedDecelerate: [0.05, 0.7, 0.1, 1] as const,
  emphasizedAccelerate: [0.3, 0, 0.8, 0.15] as const,
  outExpo: [0.16, 1, 0.3, 1] as const,
};

/* --- Durations (seconds) --- */
export const duration = {
  fast: 0.12,
  base: 0.2,
  medium: 0.28,
  reveal: 0.5,
  drawer: 0.34,
  fly: 0.5,
};

/* --- Springs --- */
export const spring = {
  /** Snappy selection fill / checkmark. */
  select: { type: 'spring', stiffness: 400, damping: 30, mass: 1 } as Transition,
  /** Playful cart-badge pop. */
  pop: { type: 'spring', stiffness: 500, damping: 18, mass: 0.8 } as Transition,
  /** Gentle card/panel settle. */
  soft: { type: 'spring', stiffness: 260, damping: 26 } as Transition,
};

/* --- Reusable variants --- */

/** Section scroll-reveal: opacity + 12px rise. Use `whileInView` + `viewport once`. */
export const revealUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.reveal, ease: ease.outExpo },
  },
};

/** Staggered list container (reviews, recap lines, cart items). */
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.medium, ease: ease.emphasizedDecelerate },
  },
};

/** Fit-check step transitions (paired with AnimatePresence, mode="wait"). */
export const stepTransition: Variants = {
  enter: { opacity: 0, x: 24 },
  center: {
    opacity: 1,
    x: 0,
    transition: { duration: duration.medium, ease: ease.emphasizedDecelerate },
  },
  exit: {
    opacity: 0,
    x: -24,
    transition: { duration: duration.base, ease: ease.emphasizedAccelerate },
  },
};

/** Cart drawer slide-in from the right edge. */
export const drawerPanel: Variants = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { duration: duration.drawer, ease: ease.emphasizedDecelerate } },
  exit: { x: '100%', transition: { duration: duration.base, ease: ease.emphasizedAccelerate } },
};

/** Standard tactile press for buttons/cards (use as whileTap). */
export const press = { scale: 0.97 };
export const lift = { y: -2 };

/**
 * Reduced-motion contract: when true, components should jump to end states,
 * skip shimmers, and render final count-up values immediately. Framer Motion's
 * `useReducedMotion()` hook is the source of truth in components; this constant
 * documents the intent and is used by non-hook code paths.
 */
export const REDUCED_MOTION_INSTANT: Transition = { duration: 0 };
