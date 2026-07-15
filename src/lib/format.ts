import type { CurrencyCode, Money } from '@/lib/types';

/**
 * Money / number formatting helpers shared across the PDP UI.
 * Money.amount is a number in the prototype (see types.ts); production would
 * parse the Storefront API's decimal strings at the adapter boundary.
 */

const formatters = new Map<string, Intl.NumberFormat>();

function formatterFor(currencyCode: CurrencyCode, maxFraction = 2): Intl.NumberFormat {
  const key = `${currencyCode}-${maxFraction}`;
  let fmt = formatters.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: maxFraction === 0 ? 0 : 2,
      maximumFractionDigits: maxFraction,
    });
    formatters.set(key, fmt);
  }
  return fmt;
}

/** "$25.95" */
export function formatMoney(money: Money): string {
  return formatterFor(money.currencyCode).format(money.amount);
}

/** "$25.95" from a raw amount. */
export function formatAmount(amount: number, currencyCode: CurrencyCode = 'USD'): string {
  return formatterFor(currencyCode).format(amount);
}

/** Apply a percentage discount, rounded to cents. */
export function discounted(money: Money, percentOff: number): Money {
  return {
    amount: Math.round(money.amount * (1 - percentOff / 100) * 100) / 100,
    currencyCode: money.currencyCode,
  };
}

/** "$0.87/day" */
export function perDayLabel(money: Money): string {
  return `${formatMoney(money)}/day`;
}

/** Pack option values are bottle-flavored; powder ships in pouches. */
export function packDisplayLabel(packValue: string, form: string): string {
  if (form.toLowerCase() === 'powder') {
    return packValue.replace('Bottles', 'Pouches').replace('Bottle', 'Pouch');
  }
  return packValue;
}

/**
 * Display form of the engine's "Form · Pack" offer label (e.g. "Powder ·
 * 2 Bottles" → "Powder · 2 Pouches"). Display-only — the engine's label is
 * never mutated; anything that parses it keeps reading the original.
 */
export function offerPackDisplayLabel(label: string): string {
  const parts = label.split(' · ');
  if (parts.length !== 2) return label;
  return `${parts[0]} · ${packDisplayLabel(parts[1], parts[0])}`;
}
