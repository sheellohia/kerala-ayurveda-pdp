'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { product } from '@/data/product';
import type { Goal, Review } from '@/lib/types';
import { duration, ease, press } from '@/lib/motion';
import { Icon } from '@/components/icons';
import { Stars } from '@/components/Stars';
import { CountUp } from '@/components/CountUp';

const GOAL_LABEL: Partial<Record<Goal, string>> = {
  stress: 'Stress',
  sleep: 'Sleep',
  energy: 'Energy',
  focus: 'Focus',
  recovery: 'Recovery',
  mood: 'Mood',
};

/**
 * Reviews with the real aggregate (4.7 / 213) and a goal filter. When the
 * fit-check has run, the shopper's primary goal is pre-selected —
 * "from people who chose Stress, like you". Verified + with-media lead.
 */
export function Reviews({ highlightGoal }: { highlightGoal: Goal | null }) {
  const reduced = !!useReducedMotion();
  const [filter, setFilter] = useState<Goal | 'all'>('all');

  // Follow the fit-check's primary goal when it lands (only if reviews exist for it).
  useEffect(() => {
    if (highlightGoal && product.reviews.some((r) => r.goalTag === highlightGoal)) {
      setFilter(highlightGoal);
    }
  }, [highlightGoal]);

  const availableGoals = useMemo(() => {
    const seen = new Set<Goal>();
    for (const r of product.reviews) if (r.goalTag) seen.add(r.goalTag);
    return Array.from(seen);
  }, []);

  const visible = useMemo(() => {
    const list =
      filter === 'all'
        ? [...product.reviews]
        : product.reviews.filter((r) => r.goalTag === filter);
    // Lead with media, then verified, then rating.
    return list.sort(
      (a, b) =>
        Number(!!b.hasMedia) - Number(!!a.hasMedia) ||
        Number(b.verified) - Number(a.verified) ||
        b.rating - a.rating,
    );
  }, [filter]);

  return (
    <section aria-labelledby="reviews-heading" id="reviews">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="reviews-heading" className="font-serif text-3xl text-clay-900 sm:text-4xl">
            What daily takers say
          </h2>
          <div className="mt-3 flex items-center gap-3">
            <span className="font-serif text-5xl leading-none text-clay-900">
              {product.rating.value}
            </span>
            <div>
              <Stars value={product.rating.value} className="h-[18px] w-[18px]" />
              <p className="mt-1 text-sm text-clay-600">
                <CountUp value={product.rating.count} /> verified reviews
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter reviews by goal">
          <FilterChip
            label="All"
            selected={filter === 'all'}
            onSelect={() => setFilter('all')}
            reduced={reduced}
          />
          {availableGoals.map((goal) => (
            <FilterChip
              key={goal}
              label={GOAL_LABEL[goal] ?? goal}
              selected={filter === goal}
              onSelect={() => setFilter(goal)}
              reduced={reduced}
            />
          ))}
        </div>
      </div>

      {filter !== 'all' && (
        <p className="mt-4 text-sm font-medium text-forest-700">
          {highlightGoal === filter
            ? `From people who chose ${GOAL_LABEL[filter]?.toLowerCase()}, like you.`
            : `From people who chose ${GOAL_LABEL[filter]?.toLowerCase()}.`}
        </p>
      )}

      <motion.ul layout={!reduced} className="mt-6 grid gap-4 sm:grid-cols-2">
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map((review) => (
            <motion.li
              key={review.id}
              layout={!reduced}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, transition: { duration: duration.fast } }}
              transition={{ duration: duration.medium, ease: ease.emphasizedDecelerate }}
            >
              <ReviewCard review={review} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      <p className="mt-5 text-xs text-clay-500">
        {product.rating.count} total reviews collected from verified buyers; individual
        experiences vary.
      </p>
    </section>
  );
}

function FilterChip({
  label,
  selected,
  onSelect,
  reduced,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  reduced: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      whileTap={reduced ? undefined : press}
      className={`focus-ring min-h-[40px] rounded-full border-2 px-4 text-sm font-medium transition-colors duration-150 ${
        selected
          ? 'border-forest-700 bg-forest-700 text-clay-50'
          : 'border-clay-200 bg-white text-clay-700 hover:border-clay-300'
      }`}
    >
      {label}
    </motion.button>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-clay-100 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <Stars value={review.rating} className="h-3.5 w-3.5" />
        {review.goalTag && (
          <span className="rounded-full bg-forest-50 px-2.5 py-1 text-[11px] font-semibold text-forest-700">
            {GOAL_LABEL[review.goalTag]}
          </span>
        )}
      </div>
      <h3 className="mt-2.5 text-[15px] font-semibold leading-snug text-clay-900">
        {review.title}
      </h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-clay-600">{review.body}</p>
      {review.hasMedia && (
        <div className="mt-3 flex items-center gap-2">
          <img
            src="/images/ashwagandha-ritual.svg"
            alt="Customer photo of their daily ashwagandha routine"
            width={56}
            height={42}
            className="h-[42px] w-[56px] rounded-lg border border-clay-100 object-cover"
          />
          <span className="flex items-center gap-1 text-[11px] font-medium text-clay-500">
            <Icon name="camera" className="h-3.5 w-3.5" />
            Includes photo
          </span>
        </div>
      )}
      <div className="mt-3 flex items-center gap-2 border-t border-clay-100 pt-3 text-xs text-clay-500">
        <span className="font-semibold text-clay-800">{review.author}</span>
        {review.verified && (
          <span className="flex items-center gap-1 text-forest-700">
            <Icon name="check" className="h-3 w-3" strokeWidth={2.6} />
            Verified buyer
          </span>
        )}
      </div>
    </article>
  );
}
