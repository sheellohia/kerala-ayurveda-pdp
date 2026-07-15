'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { duration, spring } from '@/lib/motion';
import { useBodyScrollLock } from '@/lib/hooks';
import { Icon } from '@/components/icons';

/**
 * Viewable heavy-metal Certificate of Analysis (illustrative content for the
 * prototype; production links the live batch PDF).
 */
export function CoaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reduced = !!useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    window.setTimeout(() => panelRef.current?.focus(), 30);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: duration.fast } }}
          transition={{ duration: duration.base }}
        >
          <button
            type="button"
            aria-label="Close certificate"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-clay-900/45 backdrop-blur-[2px]"
            tabIndex={-1}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Certificate of Analysis"
            tabIndex={-1}
            initial={reduced ? false : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98, transition: { duration: duration.base } }}
            transition={spring.soft}
            className="focus-ring relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-4 shadow-lift outline-none sm:p-5"
          >
            <div className="flex items-center justify-between gap-3 pb-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-clay-900">
                <Icon name="document" className="h-4 w-4 text-forest-700" />
                Certificate of Analysis — heavy metals
              </p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="focus-ring flex h-9 w-9 items-center justify-center rounded-full text-clay-500 transition-colors duration-150 hover:bg-clay-100 hover:text-clay-800"
              >
                <Icon name="close" className="h-[18px] w-[18px]" />
              </button>
            </div>
            <img
              src="/images/ashwagandha-coa.svg"
              alt="Third-party heavy-metal Certificate of Analysis summary showing passing results for lead, arsenic, mercury, and cadmium"
              width={1200}
              height={1200}
              className="block w-full rounded-2xl border border-clay-100"
            />
            <p className="mt-3 text-[11px] leading-relaxed text-clay-500">
              Illustrative COA summary for the prototype. In production this opens the
              live third-party lab PDF for the batch on your bottle.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
