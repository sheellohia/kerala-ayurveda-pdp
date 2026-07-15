'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { product } from '@/data/product';
import { ease, staggerContainer, staggerItem } from '@/lib/motion';
import { Icon } from '@/components/icons';

/**
 * "What to expect" — the honest, gradual 6–8 week onset from
 * product.expectations, with a progress line that draws in on first view.
 */
export function ExpectationsTimeline() {
  const reduced = !!useReducedMotion();

  return (
    <section aria-labelledby="expectations-heading">
      <h2
        id="expectations-heading"
        className="font-serif text-3xl text-clay-900 sm:text-4xl"
      >
        What to expect — honestly
      </h2>
      <p className="mt-2 max-w-xl text-[15px] text-clay-600">
        Adaptogens build gradually. Most studies run 6–8 weeks; if you feel nothing in
        week one, you’re on schedule.
      </p>

      <div className="relative mt-8">
        {/* Progress line: horizontal on desktop, vertical on mobile */}
        <div
          className="absolute left-5 top-3 hidden h-1 w-[calc(100%-2.5rem)] rounded-full bg-clay-200 sm:block"
          aria-hidden="true"
        >
          <motion.div
            className="h-full origin-left rounded-full bg-gradient-to-r from-forest-400 to-saffron-400"
            initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '-80px 0px' }}
            transition={reduced ? { duration: 0 } : { duration: 1.1, ease: ease.outExpo }}
          />
        </div>
        <div
          className="absolute bottom-4 left-[15px] top-3 w-1 rounded-full bg-clay-200 sm:hidden"
          aria-hidden="true"
        >
          <motion.div
            className="h-full w-full origin-top rounded-full bg-gradient-to-b from-forest-400 to-saffron-400"
            initial={reduced ? { scaleY: 1 } : { scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, margin: '-80px 0px' }}
            transition={reduced ? { duration: 0 } : { duration: 1.1, ease: ease.outExpo }}
          />
        </div>

        <motion.ol
          variants={reduced ? undefined : staggerContainer}
          initial={reduced ? false : 'hidden'}
          whileInView={reduced ? undefined : 'visible'}
          viewport={{ once: true, margin: '-80px 0px' }}
          className="grid gap-8 sm:grid-cols-3 sm:gap-6"
        >
          {product.expectations.map((milestone, i) => (
            <motion.li
              key={milestone.window}
              variants={reduced ? undefined : staggerItem}
              className="relative pl-11 sm:pl-0"
            >
              <span
                className={`absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border-4 border-clay-50 text-[11px] font-bold sm:relative sm:mb-3 ${
                  i === product.expectations.length - 1
                    ? 'bg-saffron-400 text-white'
                    : 'bg-forest-500 text-clay-50'
                }`}
              >
                {i + 1}
              </span>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-forest-700">
                {milestone.window}
              </p>
              <h3 className="mt-1 font-serif text-xl text-clay-900">{milestone.label}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-clay-600">
                {milestone.detail.endsWith('*') ? (
                  <>
                    {milestone.detail.slice(0, -1)}
                    <a
                      href="#disclaimer"
                      className="focus-ring rounded text-saffron-600 hover:text-saffron-700"
                      aria-label="See FDA disclaimer"
                    >
                      *
                    </a>
                  </>
                ) : (
                  milestone.detail
                )}
              </p>
            </motion.li>
          ))}
        </motion.ol>
      </div>

      <p className="mt-6 flex items-center gap-2 text-sm text-clay-600">
        <Icon name="info" className="h-4 w-4 shrink-0 text-forest-600" />
        Consistency beats intensity — take it daily, with food.
      </p>
    </section>
  );
}
