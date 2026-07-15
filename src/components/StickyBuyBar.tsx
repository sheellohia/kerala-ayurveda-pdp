'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { ProductVariant } from '@/lib/types';
import type { SellingMode } from '@/lib/cart';
import { product } from '@/data/product';
import { duration, ease, press } from '@/lib/motion';
import { discounted, formatMoney, packDisplayLabel } from '@/lib/format';
import { Icon } from '@/components/icons';

/**
 * Sticky mobile buy-bar. Shown only while the hero Add-to-cart is off screen
 * (IntersectionObserver lives in the parent — never two CTAs at once).
 * Fixed positioning + a spacer in the page mean zero layout shift.
 */
export function StickyBuyBar({
  show,
  variant,
  mode,
  onAdd,
}: {
  show: boolean;
  variant: ProductVariant;
  mode: SellingMode;
  onAdd: (sourceEl: HTMLElement | null) => boolean;
}) {
  const reduced = !!useReducedMotion();
  const imgRef = useRef<HTMLImageElement>(null);
  const [error, setError] = useState(false);

  const price =
    mode === 'subscription'
      ? discounted(variant.price, product.sellingPlans[0].discountPercentage)
      : variant.price;
  const form = variant.selectedOptions.find((o) => o.name === 'Form')?.value ?? '';
  const pack = variant.selectedOptions.find((o) => o.name === 'Pack')?.value ?? '';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={reduced ? false : { y: '110%' }}
          animate={{ y: 0 }}
          exit={{ y: '110%', transition: { duration: duration.base, ease: ease.emphasizedAccelerate } }}
          transition={{ duration: duration.drawer, ease: ease.emphasizedDecelerate }}
          className="fixed inset-x-0 bottom-0 z-30 border-t border-clay-100 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-lift backdrop-blur-md lg:hidden"
        >
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-2.5">
            <img
              ref={imgRef}
              src={variant.image?.url ?? product.featuredImage.url}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 shrink-0 rounded-xl border border-clay-100 bg-clay-50 object-cover"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-clay-900">
                {product.title} · {packDisplayLabel(pack, form)}
              </p>
              <p className="text-xs text-clay-500">
                {formatMoney(price)}
                {mode === 'subscription' && ' · subscription'}
              </p>
            </div>
            <motion.button
              type="button"
              onClick={() => {
                const ok = onAdd(imgRef.current);
                setError(!ok);
              }}
              disabled={!variant.availableForSale}
              whileTap={reduced || !variant.availableForSale ? undefined : press}
              className={`focus-ring flex h-11 shrink-0 items-center gap-2 rounded-2xl px-5 text-sm font-semibold transition-colors duration-150 ${
                variant.availableForSale
                  ? 'bg-saffron-500 text-white hover:bg-saffron-600'
                  : 'cursor-not-allowed bg-clay-200 text-clay-500'
              }`}
            >
              <Icon name="cart" className="h-4 w-4" />
              {variant.availableForSale ? 'Add' : 'Out of stock'}
            </motion.button>
          </div>
          {error && (
            <p role="alert" className="px-4 pb-2 text-center text-xs text-saffron-700">
              Something went wrong — try again
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
