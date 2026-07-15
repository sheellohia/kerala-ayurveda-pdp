'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { product } from '@/data/product';
import { staggerContainer, staggerItem, lift } from '@/lib/motion';
import { Icon } from '@/components/icons';
import { StarredCopy } from '@/components/StarredCopy';

/**
 * Always-visible benefit cards (Stress / Sleep / Energy / Focus) from
 * product.benefits. Each trailing asterisk links to the DSHEA disclaimer.
 */
export function BenefitStrip() {
  const reduced = !!useReducedMotion();

  return (
    <section aria-labelledby="benefits-heading">
      <h2
        id="benefits-heading"
        className="font-serif text-3xl text-clay-900 sm:text-4xl"
      >
        Why people take it
      </h2>
      <p className="mt-2 max-w-xl text-[15px] text-clay-600">
        Structure-and-function support only — the honest version of what an adaptogen
        does day to day.
        <a
          href="#disclaimer"
          className="focus-ring rounded text-saffron-600 hover:text-saffron-700"
          aria-label="See FDA disclaimer"
        >
          *
        </a>
      </p>
      <motion.ul
        variants={reduced ? undefined : staggerContainer}
        initial={reduced ? false : 'hidden'}
        whileInView={reduced ? undefined : 'visible'}
        viewport={{ once: true, margin: '-60px 0px' }}
        className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {product.benefits.map((benefit) => (
          <motion.li
            key={benefit.id}
            variants={reduced ? undefined : staggerItem}
            whileHover={reduced ? undefined : lift}
            className="rounded-2xl border border-clay-100 bg-white p-5 shadow-soft transition-shadow duration-150 hover:shadow-lift"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-50 text-forest-700">
              <Icon name={benefit.icon} className="h-5 w-5" />
            </span>
            <h3 className="mt-3.5 text-base font-semibold leading-snug text-clay-900">
              {benefit.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-clay-600">
              <StarredCopy text={benefit.body} />
            </p>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
