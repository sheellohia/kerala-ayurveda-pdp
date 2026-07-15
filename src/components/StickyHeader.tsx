'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { press, spring } from '@/lib/motion';
import { useCart } from '@/lib/cart';
import { Icon } from '@/components/icons';

/**
 * Slim sticky header: brand wordmark, one-line trust micro-strip, and the cart
 * button (fly-to-cart target) with an animated quantity badge.
 */
export function StickyHeader() {
  const { totalQuantity, openDrawer, cartIconRef } = useCart();
  const reduced = !!useReducedMotion();

  return (
    <header className="sticky top-0 z-40 border-b border-clay-100 bg-clay-50/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#top" className="focus-ring flex items-center gap-2 rounded-xl">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-700 text-clay-50">
            <Icon name="leaf" className="h-[18px] w-[18px]" />
          </span>
          <span className="font-serif text-lg leading-none tracking-wide text-clay-900">
            Kerala&nbsp;Ayurveda
          </span>
        </a>

        <p className="hidden items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-forest-700 md:flex">
          <span>Third-party tested</span>
          <span aria-hidden="true" className="text-clay-300">
            •
          </span>
          <span>cGMP</span>
          <span aria-hidden="true" className="text-clay-300">
            •
          </span>
          <span>Vegan</span>
        </p>

        <motion.button
          ref={cartIconRef}
          type="button"
          onClick={openDrawer}
          whileTap={reduced ? undefined : press}
          className="focus-ring relative flex h-11 w-11 items-center justify-center rounded-full text-clay-800 transition-colors duration-150 hover:bg-clay-100"
          aria-label={`Open cart, ${totalQuantity} item${totalQuantity === 1 ? '' : 's'}`}
        >
          <Icon name="cart" className="h-[22px] w-[22px]" />
          <AnimatePresence>
            {totalQuantity > 0 && (
              <motion.span
                key={totalQuantity}
                initial={reduced ? false : { scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.3, opacity: 0, transition: { duration: 0.12 } }}
                transition={spring.pop}
                className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-saffron-500 px-1 text-[11px] font-bold leading-none text-white"
              >
                {totalQuantity}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </header>
  );
}
