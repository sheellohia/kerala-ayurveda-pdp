'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { product } from '@/data/product';
import { press, staggerContainer, staggerItem } from '@/lib/motion';
import { Icon } from '@/components/icons';
import { CoaModal } from '@/components/CoaModal';

/**
 * Trust & authenticity band: certification badges, a viewable heavy-metal COA,
 * and the money-back line. Dark botanical treatment for contrast.
 */
export function TrustBand() {
  const reduced = !!useReducedMotion();
  const [coaOpen, setCoaOpen] = useState(false);

  return (
    <section
      aria-labelledby="trust-heading"
      className="overflow-hidden rounded-3xl bg-forest-900 px-6 py-10 text-clay-50 sm:px-10"
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-md">
          <h2 id="trust-heading" className="font-serif text-3xl sm:text-4xl">
            Tested, certified, on the record
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-forest-100">
            Every batch is third-party tested — including for lead, arsenic, mercury,
            and cadmium — and made in a cGMP facility. The paperwork is right here, not
            on request.
          </p>
          <motion.button
            type="button"
            onClick={() => setCoaOpen(true)}
            whileTap={reduced ? undefined : press}
            className="focus-ring mt-5 inline-flex h-12 items-center gap-2 rounded-2xl bg-clay-50 px-5 text-sm font-semibold text-forest-900 transition-colors duration-150 hover:bg-white"
          >
            <Icon name="document" className="h-4 w-4" />
            View the Certificate of Analysis
          </motion.button>
          <p className="mt-4 flex items-start gap-2 text-sm text-forest-100">
            <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-saffron-300" />
            Not feeling it after a full 60-day routine? Write to us — we’ll make it
            right or refund it.
          </p>
        </div>

        <motion.ul
          variants={reduced ? undefined : staggerContainer}
          initial={reduced ? false : 'hidden'}
          whileInView={reduced ? undefined : 'visible'}
          viewport={{ once: true, margin: '-60px 0px' }}
          className="grid shrink-0 grid-cols-2 gap-3.5"
        >
          {product.certifications.map((cert) => (
            <motion.li
              key={cert.id}
              variants={reduced ? undefined : staggerItem}
              className="flex min-w-[150px] items-center gap-3 rounded-2xl border border-forest-700 bg-forest-800/60 px-4 py-3.5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-700 text-saffron-300">
                <Icon name={cert.icon} className="h-[18px] w-[18px]" />
              </span>
              <span className="text-sm font-semibold">{cert.label}</span>
            </motion.li>
          ))}
        </motion.ul>
      </div>

      <CoaModal open={coaOpen} onClose={() => setCoaOpen(false)} />
    </section>
  );
}
