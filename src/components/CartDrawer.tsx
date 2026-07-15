'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { product } from '@/data/product';
import { drawerPanel, duration, press, staggerContainer, staggerItem } from '@/lib/motion';
import { lineUnitPrice, lineVariant, useCart } from '@/lib/cart';
import { useBodyScrollLock, useDialogFocus } from '@/lib/hooks';
import { formatAmount, formatMoney, packDisplayLabel } from '@/lib/format';
import { Icon } from '@/components/icons';

/**
 * Client cart drawer (prototype — maps to the Shopify AJAX Cart API in
 * production). Slides in with drawerPanel; line items stagger in; checkout is
 * a labeled demo stub.
 */
export function CartDrawer() {
  const cart = useCart();
  const reduced = !!useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  useBodyScrollLock(cart.isOpen);
  // Trap Tab inside the drawer while open; restore focus to the trigger on close.
  useDialogFocus(cart.isOpen, panelRef);

  useEffect(() => {
    if (!cart.isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cart.closeDrawer();
    };
    window.addEventListener('keydown', onKey);
    window.setTimeout(() => panelRef.current?.focus(), 30);
    return () => window.removeEventListener('keydown', onKey);
  }, [cart.isOpen, cart]);

  return (
    <AnimatePresence>
      {cart.isOpen && (
        <div className="fixed inset-0 z-50">
          <motion.button
            type="button"
            aria-label="Close cart"
            onClick={cart.closeDrawer}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: duration.fast } }}
            transition={{ duration: duration.base }}
            className="absolute inset-0 cursor-default bg-clay-900/45 backdrop-blur-[2px]"
            tabIndex={-1}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Your cart"
            tabIndex={-1}
            variants={reduced ? undefined : drawerPanel}
            initial={reduced ? { x: 0 } : 'hidden'}
            animate="visible"
            exit={reduced ? { opacity: 0 } : 'exit'}
            className="focus-ring absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-clay-50 shadow-lift outline-none"
          >
            <div className="flex items-center justify-between border-b border-clay-100 bg-white/70 px-5 py-4">
              <h2 className="font-serif text-xl text-clay-900">
                Your cart{' '}
                <span className="text-base text-clay-500">
                  ({cart.totalQuantity} item{cart.totalQuantity === 1 ? '' : 's'})
                </span>
              </h2>
              <button
                type="button"
                onClick={cart.closeDrawer}
                aria-label="Close cart"
                className="focus-ring flex h-9 w-9 items-center justify-center rounded-full text-clay-500 transition-colors duration-150 hover:bg-clay-100 hover:text-clay-800"
              >
                <Icon name="close" className="h-[18px] w-[18px]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {cart.lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-clay-100 text-clay-500">
                    <Icon name="cart" className="h-6 w-6" />
                  </span>
                  <p className="mt-4 font-serif text-xl text-clay-800">
                    Your cart is empty
                  </p>
                  <p className="mt-1.5 max-w-[240px] text-sm text-clay-500">
                    Not sure where to start? The fit-check will point you to the right
                    pack.
                  </p>
                </div>
              ) : (
                <motion.ul
                  variants={reduced ? undefined : staggerContainer}
                  initial={reduced ? false : 'hidden'}
                  animate="visible"
                  className="flex flex-col gap-4"
                >
                  <AnimatePresence initial={false}>
                    {cart.lines.map((line) => {
                      const variant = lineVariant(line);
                      if (!variant) return null;
                      const unit = lineUnitPrice(line);
                      const form =
                        variant.selectedOptions.find((o) => o.name === 'Form')?.value ?? '';
                      const pack =
                        variant.selectedOptions.find((o) => o.name === 'Pack')?.value ?? '';
                      return (
                        <motion.li
                          key={`${line.variantId}-${line.sellingMode}`}
                          variants={reduced ? undefined : staggerItem}
                          exit={
                            reduced
                              ? undefined
                              : { opacity: 0, x: 24, transition: { duration: duration.base } }
                          }
                          layout={!reduced}
                          className="flex gap-3.5 rounded-2xl border border-clay-100 bg-white p-3.5 shadow-soft"
                        >
                          <img
                            src={variant.image?.url ?? product.featuredImage.url}
                            alt={variant.image?.altText ?? product.title}
                            width={72}
                            height={72}
                            className="h-[72px] w-[72px] shrink-0 rounded-xl border border-clay-100 bg-clay-50 object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-clay-900">
                                  {product.title} — {form}
                                </p>
                                <p className="text-xs text-clay-500">
                                  {packDisplayLabel(pack, form)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => cart.removeLine(line.variantId, line.sellingMode)}
                                aria-label={`Remove ${variant.title} from cart`}
                                className="focus-ring -mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-clay-400 transition-colors duration-150 hover:bg-clay-100 hover:text-clay-700"
                              >
                                <Icon name="close" className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <p className="mt-1 text-xs font-medium text-forest-700">
                              {line.sellingMode === 'subscription'
                                ? `Subscription · ${product.sellingPlans[0].name} · ${product.sellingPlans[0].discountPercentage}% off`
                                : 'One-time purchase'}
                            </p>
                            <div className="mt-2.5 flex items-center justify-between">
                              <div
                                className="flex items-center rounded-full border border-clay-200"
                                role="group"
                                aria-label="Quantity"
                              >
                                <motion.button
                                  type="button"
                                  whileTap={reduced ? undefined : press}
                                  onClick={() =>
                                    cart.setQuantity(
                                      line.variantId,
                                      line.sellingMode,
                                      line.quantity - 1,
                                    )
                                  }
                                  aria-label="Decrease quantity"
                                  className="focus-ring flex h-8 w-8 items-center justify-center rounded-full text-clay-600 hover:text-clay-900"
                                >
                                  <Icon name="minus" className="h-3.5 w-3.5" />
                                </motion.button>
                                <span className="w-6 text-center text-sm font-semibold text-clay-900">
                                  {line.quantity}
                                </span>
                                <motion.button
                                  type="button"
                                  whileTap={reduced ? undefined : press}
                                  onClick={() =>
                                    cart.setQuantity(
                                      line.variantId,
                                      line.sellingMode,
                                      line.quantity + 1,
                                    )
                                  }
                                  aria-label="Increase quantity"
                                  className="focus-ring flex h-8 w-8 items-center justify-center rounded-full text-clay-600 hover:text-clay-900"
                                >
                                  <Icon name="plus" className="h-3.5 w-3.5" />
                                </motion.button>
                              </div>
                              <p className="text-sm">
                                <span className="font-semibold text-clay-900">
                                  {formatAmount(
                                    Math.round(unit * line.quantity * 100) / 100,
                                    variant.price.currencyCode,
                                  )}
                                </span>
                                {line.sellingMode === 'subscription' && (
                                  <span className="ml-1.5 text-xs text-clay-400 line-through">
                                    {formatAmount(
                                      Math.round(variant.price.amount * line.quantity * 100) / 100,
                                      variant.price.currencyCode,
                                    )}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </motion.ul>
              )}
            </div>

            {cart.lines.length > 0 && (
              <div className="border-t border-clay-100 bg-white/70 px-5 py-4">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium text-clay-600">Subtotal</p>
                  <p className="font-serif text-2xl text-clay-900">
                    {formatMoney({ amount: cart.subtotal, currencyCode: 'USD' })}
                  </p>
                </div>
                {cart.lines.some((l) => l.sellingMode === 'subscription') && (
                  <p className="mt-1.5 text-xs leading-relaxed text-clay-500">
                    Subscription items renew every {product.sellingPlans[0].intervalDays}{' '}
                    days — skip or cancel anytime, one click, no fees.
                  </p>
                )}
                <button
                  type="button"
                  disabled
                  className="mt-3.5 flex h-[52px] w-full cursor-not-allowed items-center justify-center rounded-2xl bg-clay-200 text-[15px] font-semibold text-clay-500"
                  title="Checkout is disabled in this prototype"
                >
                  Checkout (demo)
                </button>
                <p className="mt-2 text-center text-[11px] text-clay-400">
                  Prototype cart — in production this maps to Shopify’s AJAX Cart API.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
