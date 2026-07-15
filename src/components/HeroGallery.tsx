'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { RefObject } from 'react';
import type { Image as ProductImage } from '@/lib/types';
import { duration, ease, press } from '@/lib/motion';
import { Icon } from '@/components/icons';

/**
 * Hero image gallery: thumbnail strip + main stage. The main image follows the
 * selected variant's image; tapping a thumbnail overrides it. The 4th gallery
 * image carries a "watch the ritual" play affordance (visual only).
 */
export function HeroGallery({
  images,
  variantImage,
  stageRef,
}: {
  images: ProductImage[];
  variantImage?: ProductImage;
  stageRef?: RefObject<HTMLDivElement | null>;
}) {
  const reduced = !!useReducedMotion();
  const [active, setActive] = useState<ProductImage>(variantImage ?? images[0]);

  // Variant selection swaps the stage image (contract: gallery follows variant).
  const variantKey = variantImage?.id;
  useEffect(() => {
    if (variantImage) setActive(variantImage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantKey]);

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={stageRef}
        className="relative overflow-hidden rounded-3xl border border-clay-100 bg-white shadow-soft"
      >
        {/* Aspect is reserved by the intrinsic 1200×1200 dimensions — no CLS. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={active.url + active.id}
            src={active.url}
            alt={active.altText}
            width={active.width}
            height={active.height}
            initial={reduced ? false : { opacity: 0, scale: 1.015 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, transition: { duration: duration.fast } }}
            transition={{ duration: duration.base, ease: ease.standard }}
            className="block h-auto w-full"
            draggable={false}
          />
        </AnimatePresence>
        {active.caption && (
          <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-clay-900/75 px-3 py-1.5 text-xs font-medium text-clay-50 backdrop-blur-sm">
            {active.caption}
          </span>
        )}
      </div>

      <div
        className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1"
        role="listbox"
        aria-label="Product images"
      >
        {images.map((img, i) => {
          const selected = active.id === img.id;
          const isVideoAffordance = i === 3;
          return (
            <motion.button
              key={img.id}
              type="button"
              role="option"
              aria-selected={selected}
              aria-label={img.altText}
              onClick={() => setActive(img)}
              whileTap={reduced ? undefined : press}
              className={`focus-ring relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl border-2 bg-white transition-colors duration-150 ${
                selected
                  ? 'border-saffron-400'
                  : 'border-clay-100 hover:border-clay-200'
              }`}
            >
              <img
                src={img.url}
                alt=""
                width={72}
                height={72}
                className="block h-full w-full object-cover"
                draggable={false}
              />
              {isVideoAffordance && (
                <span className="absolute inset-0 flex items-center justify-center bg-clay-900/25">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-forest-800 shadow-soft">
                    <Icon name="play" className="ml-0.5 h-3.5 w-3.5" />
                  </span>
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
