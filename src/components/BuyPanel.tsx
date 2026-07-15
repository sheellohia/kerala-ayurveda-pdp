'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { product, variantByOptions, pricePerDay } from '@/data/product';
import type { ProductVariant } from '@/lib/types';
import type { SellingMode } from '@/lib/cart';
import { duration, ease, lift, press, spring } from '@/lib/motion';
import { discounted, formatAmount, formatMoney, packDisplayLabel } from '@/lib/format';
import { Icon } from '@/components/icons';
import { Stars } from '@/components/Stars';
import { StarredCopy } from '@/components/StarredCopy';

/**
 * The hero buy panel: title, rating, subhead, safety micro-line, price,
 * Form + Pack selectors, Subscribe/One-time toggle, cost-per-day, and the
 * primary Add to cart (fly-to-cart source is wired by the parent).
 */
export function BuyPanel({
  form,
  pack,
  mode,
  variant,
  onSelectForm,
  onSelectPack,
  onSelectMode,
  onAddToCart,
  ctaRef,
}: {
  form: string;
  pack: string;
  mode: SellingMode;
  variant: ProductVariant;
  onSelectForm: (form: string) => void;
  onSelectPack: (pack: string) => void;
  onSelectMode: (mode: SellingMode) => void;
  onAddToCart: () => boolean;
  ctaRef: (node: HTMLButtonElement | null) => void;
}) {
  const reduced = !!useReducedMotion();
  const [errorKey, setErrorKey] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const plan = product.sellingPlans[0];
  const oneTime = variant.price;
  const subPrice = discounted(oneTime, plan.discountPercentage);
  const shown = mode === 'subscription' ? subPrice : oneTime;
  const strike =
    mode === 'subscription'
      ? oneTime
      : variant.compareAtPrice && variant.compareAtPrice.amount > oneTime.amount
        ? variant.compareAtPrice
        : null;
  const basePerDay = pricePerDay(variant);
  const perDay =
    mode === 'subscription'
      ? Math.round(basePerDay * (1 - plan.discountPercentage / 100) * 100) / 100
      : basePerDay;

  const formOption = product.options.find((o) => o.name === 'Form');
  const packOption = product.options.find((o) => o.name === 'Pack');

  const handleAdd = () => {
    setErrorMsg(null);
    const ok = onAddToCart();
    if (!ok) {
      setErrorMsg('Something went wrong — try again');
      setErrorKey((k) => k + 1);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-forest-600">
          {product.vendor}
        </p>
        <h1 className="mt-1.5 font-serif text-4xl leading-tight text-clay-900 sm:text-5xl">
          {product.title}
        </h1>
        <a
          href="#reviews"
          className="focus-ring mt-2.5 inline-flex items-center gap-2 rounded-lg text-sm text-clay-700 hover:text-clay-900"
        >
          <Stars value={product.rating.value} />
          <span className="font-semibold text-clay-900">{product.rating.value}</span>
          <span className="underline decoration-clay-300 underline-offset-2">
            {product.rating.count} reviews
          </span>
        </a>
        <p className="mt-3 text-[17px] leading-relaxed text-clay-700">
          <StarredCopy text={product.subtitle} />
        </p>
        <p className="mt-2.5 flex items-start gap-1.5 text-xs leading-relaxed text-clay-500">
          <Icon name="shield" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-600" />
          {product.safetyShort}
        </p>
      </div>

      {/* Price — updates instantly with selection */}
      <div className="flex items-baseline gap-2.5" aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={`${shown.amount}-${mode}`}
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: duration.fast, ease: ease.standard }}
            className="font-serif text-3xl text-clay-900"
          >
            {formatMoney(shown)}
          </motion.span>
        </AnimatePresence>
        {strike && (
          <span className="text-lg text-clay-400 line-through">{formatMoney(strike)}</span>
        )}
        {mode === 'subscription' && (
          <span className="rounded-full bg-forest-100 px-2.5 py-1 text-xs font-semibold text-forest-700">
            Save {plan.discountPercentage}%
          </span>
        )}
      </div>

      {/* Form selector */}
      {formOption && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-clay-800">Form</legend>
          <div className="grid grid-cols-2 gap-2.5">
            {formOption.values.map((value) => (
              <SelectCard
                key={value}
                selected={form === value}
                onSelect={() => onSelectForm(value)}
                label={value}
                sub={value === 'Capsules' ? 'Tasteless, pre-measured' : 'Traditional, earthy'}
                icon={value === 'Capsules' ? 'capsule' : 'powder'}
                reduced={reduced}
              />
            ))}
          </div>
        </fieldset>
      )}

      {/* Pack selector */}
      {packOption && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-clay-800">Pack</legend>
          <div className="grid grid-cols-3 gap-2.5">
            {packOption.values.map((value) => {
              const v = variantByOptions(form, value);
              const available = !!v?.availableForSale;
              const best = value === '3 Bottles';
              return (
                <SelectCard
                  key={value}
                  selected={pack === value && available}
                  disabled={!available}
                  onSelect={() => available && onSelectPack(value)}
                  label={packDisplayLabel(value, form)}
                  sub={
                    !available
                      ? 'Out of stock'
                      : v
                        ? `${formatMoney(v.price)} · ${formatAmount(pricePerDay(v))}/day`
                        : ''
                  }
                  tag={best && available ? 'Best value' : undefined}
                  reduced={reduced}
                  compact
                />
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Subscribe vs one-time */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-clay-800">Purchase</legend>
        <div className="flex flex-col gap-2.5">
          <ModeCard
            selected={mode === 'subscription'}
            onSelect={() => onSelectMode('subscription')}
            title={`Subscribe & save ${plan.discountPercentage}%`}
            price={formatMoney(subPrice)}
            strike={formatMoney(oneTime)}
            sub={`${plan.name} · skip or cancel anytime — one click, no fees`}
            reduced={reduced}
          />
          <ModeCard
            selected={mode === 'one-time'}
            onSelect={() => onSelectMode('one-time')}
            title="One-time purchase"
            price={formatMoney(oneTime)}
            sub="No account needed"
            reduced={reduced}
          />
        </div>
      </fieldset>

      {/* Cost-per-day + supply — instant update */}
      <p className="-mt-1 text-sm text-clay-600" aria-live="polite">
        <span className="font-semibold text-clay-900">{formatAmount(perDay)}/day</span>
        {' · '}lasts about{' '}
        <span className="font-semibold text-clay-900">{variant.daysSupply} days</span> at 1
        serving daily
      </p>

      {/* Add to cart + inline error */}
      <motion.div
        key={errorKey}
        animate={
          errorKey > 0 && !reduced ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }
        }
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        <motion.button
          ref={ctaRef}
          type="button"
          onClick={handleAdd}
          disabled={!variant.availableForSale}
          whileHover={reduced || !variant.availableForSale ? undefined : lift}
          whileTap={reduced || !variant.availableForSale ? undefined : press}
          transition={spring.select}
          className={`focus-ring flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl text-base font-semibold shadow-soft transition-colors duration-150 ${
            variant.availableForSale
              ? 'bg-saffron-500 text-white hover:bg-saffron-600'
              : 'cursor-not-allowed bg-clay-200 text-clay-500'
          }`}
        >
          <Icon name="cart" className="h-5 w-5" />
          {variant.availableForSale
            ? `Add to cart — ${formatMoney(shown)}`
            : 'Out of stock'}
        </motion.button>
      </motion.div>
      {errorMsg && (
        <p role="alert" className="-mt-2 flex items-center gap-1.5 text-sm text-saffron-700">
          <Icon name="alert" className="h-4 w-4" />
          {errorMsg}
        </p>
      )}
    </div>
  );
}

/* --- Local building blocks (selection vocabulary: spring fill + check) --- */

function SelectCard({
  selected,
  disabled = false,
  onSelect,
  label,
  sub,
  icon,
  tag,
  reduced,
  compact = false,
}: {
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  label: string;
  sub?: string;
  icon?: string;
  tag?: string;
  reduced: boolean;
  compact?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      whileTap={disabled || reduced ? undefined : press}
      className={`focus-ring relative flex min-h-[44px] flex-col items-start rounded-xl border-2 text-left transition-colors duration-150 ${
        compact ? 'px-3 py-2.5' : 'px-3.5 py-3'
      } ${
        disabled
          ? 'cursor-not-allowed border-clay-100 bg-clay-50 opacity-60'
          : selected
            ? 'border-saffron-500 bg-saffron-50'
            : 'border-clay-200 bg-white hover:border-clay-300'
      }`}
    >
      {tag && (
        <span className="absolute -top-2.5 right-2 rounded-full bg-forest-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-clay-50">
          {tag}
        </span>
      )}
      <span className="flex items-center gap-1.5 text-sm font-semibold text-clay-900">
        {icon && <Icon name={icon} className="h-4 w-4 text-forest-700" />}
        {label}
      </span>
      {sub && (
        <span
          className={`mt-0.5 text-xs ${disabled ? 'font-medium text-clay-500' : 'text-clay-500'}`}
        >
          {sub}
        </span>
      )}
      <AnimatePresence>
        {selected && !disabled && (
          <motion.span
            initial={reduced ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reduced ? undefined : { scale: 0, opacity: 0, transition: { duration: 0.1 } }}
            transition={spring.select}
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-saffron-500 text-white"
          >
            <Icon name="check" className="h-3 w-3" strokeWidth={2.6} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function ModeCard({
  selected,
  onSelect,
  title,
  price,
  strike,
  sub,
  reduced,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  price: string;
  strike?: string;
  sub: string;
  reduced: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      whileTap={reduced ? undefined : press}
      className={`focus-ring flex items-start gap-3 rounded-xl border-2 px-3.5 py-3 text-left transition-colors duration-150 ${
        selected
          ? 'border-saffron-500 bg-saffron-50'
          : 'border-clay-200 bg-white hover:border-clay-300'
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150 ${
          selected ? 'border-saffron-500 bg-saffron-500' : 'border-clay-300 bg-white'
        }`}
        aria-hidden="true"
      >
        {selected && (
          <motion.span
            initial={reduced ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={spring.select}
            className="text-white"
          >
            <Icon name="check" className="h-3 w-3" strokeWidth={3} />
          </motion.span>
        )}
      </span>
      <span className="flex-1">
        <span className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="text-sm font-semibold text-clay-900">{title}</span>
          <span className="text-sm">
            <span className="font-semibold text-clay-900">{price}</span>
            {strike && <span className="ml-1.5 text-clay-400 line-through">{strike}</span>}
          </span>
        </span>
        <span className="mt-0.5 block text-xs text-clay-500">{sub}</span>
      </span>
    </motion.button>
  );
}
