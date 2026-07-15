'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { product } from '@/data/product';
import { duration, ease } from '@/lib/motion';
import { Icon } from '@/components/icons';

/**
 * FAQ accordion using the grid-rows (0fr → 1fr) expand technique, with rotating
 * chevrons. One item open at a time keeps the rhythm calm.
 */
export function FaqAccordion() {
  const reduced = !!useReducedMotion();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section aria-labelledby="faq-heading" id="faq">
      <h2 id="faq-heading" className="font-serif text-3xl text-clay-900 sm:text-4xl">
        Good questions
      </h2>
      <div className="mt-6 overflow-hidden rounded-2xl border border-clay-100 bg-white shadow-soft">
        {product.faqs.map((faq, i) => {
          const open = openIndex === i;
          return (
            <div key={faq.question} className={i > 0 ? 'border-t border-clay-100' : ''}>
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : i)}
                aria-expanded={open}
                className="focus-ring flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors duration-150 hover:bg-clay-50 sm:px-6"
              >
                <span className="text-[15px] font-semibold text-clay-900">
                  {faq.question}
                </span>
                <motion.span
                  animate={{ rotate: open ? 180 : 0 }}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { duration: duration.base, ease: ease.standard }
                  }
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-clay-100 text-clay-600"
                >
                  <Icon name="chevron-down" className="h-4 w-4" />
                </motion.span>
              </button>
              <div
                className="grid transition-[grid-template-rows] duration-300 ease-emphasized"
                style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm leading-relaxed text-clay-600 sm:px-6">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
