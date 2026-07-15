'use client';

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Client-side hooks shared by the PDP components.
 */

/** easeOutExpo — matches ease.outExpo in src/lib/motion.ts. */
function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Animate a number from its previous value to `target`.
 * - `active: false` holds at 0 (used with `useInView` so counts start on first view).
 * - Under prefers-reduced-motion the final value renders immediately (hard contract).
 */
export function useCountUp(
  target: number,
  active = true,
  durationMs = 900,
): number {
  const reduced = !!useReducedMotion();
  // Seed to 0 when we intend to animate so the first frame doesn't flash the
  // final value; only the reduced-motion instant path seeds at the target.
  const [value, setValue] = useState(() => (active && reduced ? target : 0));
  const fromRef = useRef(active && reduced ? target : 0);
  const frameRef = useRef<number | null>(null);
  const firstRunRef = useRef(true);

  useEffect(() => {
    if (!active) return;
    if (reduced) {
      fromRef.current = target;
      setValue(target);
      return;
    }
    // Animate from 0 on the very first activation, else from the last value.
    const from = firstRunRef.current ? 0 : fromRef.current;
    firstRunRef.current = false;
    if (from === target) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = easeOutExpo(t);
      const next = from + (target - from) * eased;
      setValue(next);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      fromRef.current = target;
    };
  }, [target, active, reduced, durationMs]);

  return value;
}

/** Lock body scroll while a modal/drawer is open. */
export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [locked]);
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Modal focus management: while `open`, Tab/Shift+Tab are trapped inside the
 * panel; on close, focus returns to the element that triggered the dialog.
 * The trigger is snapshotted during the closed→open RENDER (not in the
 * effect): child effects run before parent effects, so dialog content that
 * autofocuses itself on mount (e.g. the result heading) would otherwise be
 * captured as the "trigger". Initial focus stays the caller's responsibility
 * (both dialogs focus their panel on open).
 */
export function useDialogFocus(
  open: boolean,
  panelRef: RefObject<HTMLElement | null>,
): void {
  const wasOpenRef = useRef(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  if (open && !wasOpenRef.current && typeof document !== 'undefined') {
    triggerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }
  wasOpenRef.current = open;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.getClientRects().length > 0);
      if (focusables.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !panel.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      const trigger = triggerRef.current;
      // Never "restore" into the dialog itself (it may still be exiting).
      if (
        trigger &&
        document.contains(trigger) &&
        !(panelRef.current && panelRef.current.contains(trigger))
      ) {
        trigger.focus();
      }
    };
  }, [open, panelRef]);
}
