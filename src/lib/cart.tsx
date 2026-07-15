'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import type { ReactNode, RefObject } from 'react';
import { findVariant, product } from '@/data/product';
import type { ProductVariant, RecommendationOffer } from '@/lib/types';
import { discounted } from '@/lib/format';

// NOTE: In the Shopify build this whole store maps 1:1 to the AJAX Cart API
// (/cart/add.js, /cart/change.js, /cart.js) — the reducer below mirrors its verbs.

export type SellingMode = RecommendationOffer['sellingMode'];

export interface CartLine {
  variantId: string;
  quantity: number;
  sellingMode: SellingMode;
}

interface CartState {
  lines: CartLine[];
  open: boolean;
}

type CartAction =
  | { type: 'add'; variantId: string; sellingMode: SellingMode; quantity: number }
  | { type: 'remove'; variantId: string; sellingMode: SellingMode }
  | { type: 'setQuantity'; variantId: string; sellingMode: SellingMode; quantity: number }
  | { type: 'open' }
  | { type: 'close' };

function sameLine(line: CartLine, variantId: string, sellingMode: SellingMode): boolean {
  return line.variantId === variantId && line.sellingMode === sellingMode;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      const existing = state.lines.find((l) =>
        sameLine(l, action.variantId, action.sellingMode),
      );
      const lines = existing
        ? state.lines.map((l) =>
            sameLine(l, action.variantId, action.sellingMode)
              ? { ...l, quantity: l.quantity + action.quantity }
              : l,
          )
        : [
            ...state.lines,
            {
              variantId: action.variantId,
              sellingMode: action.sellingMode,
              quantity: action.quantity,
            },
          ];
      return { ...state, lines };
    }
    case 'remove':
      return {
        ...state,
        lines: state.lines.filter((l) => !sameLine(l, action.variantId, action.sellingMode)),
      };
    case 'setQuantity': {
      if (action.quantity <= 0) {
        return {
          ...state,
          lines: state.lines.filter((l) => !sameLine(l, action.variantId, action.sellingMode)),
        };
      }
      return {
        ...state,
        lines: state.lines.map((l) =>
          sameLine(l, action.variantId, action.sellingMode)
            ? { ...l, quantity: Math.min(action.quantity, 10) }
            : l,
        ),
      };
    }
    case 'open':
      return { ...state, open: true };
    case 'close':
      return { ...state, open: false };
    default:
      return state;
  }
}

/** Unit price for a line, honoring the subscription discount. */
export function lineUnitPrice(line: CartLine): number {
  const variant = findVariant(line.variantId);
  if (!variant) return 0;
  if (line.sellingMode === 'subscription') {
    return discounted(variant.price, product.sellingPlans[0].discountPercentage).amount;
  }
  return variant.price.amount;
}

export function lineVariant(line: CartLine): ProductVariant | undefined {
  return findVariant(line.variantId);
}

interface CartContextValue {
  lines: CartLine[];
  totalQuantity: number;
  subtotal: number;
  isOpen: boolean;
  addLine: (variantId: string, sellingMode: SellingMode, quantity?: number) => void;
  removeLine: (variantId: string, sellingMode: SellingMode) => void;
  setQuantity: (variantId: string, sellingMode: SellingMode, quantity: number) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** Attached to the header cart button — the fly-to-cart target. */
  cartIconRef: RefObject<HTMLButtonElement | null>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { lines: [], open: false });
  const cartIconRef = useRef<HTMLButtonElement | null>(null);

  const addLine = useCallback((variantId: string, sellingMode: SellingMode, quantity = 1) => {
    dispatch({ type: 'add', variantId, sellingMode, quantity });
  }, []);
  const removeLine = useCallback((variantId: string, sellingMode: SellingMode) => {
    dispatch({ type: 'remove', variantId, sellingMode });
  }, []);
  const setQuantity = useCallback(
    (variantId: string, sellingMode: SellingMode, quantity: number) => {
      dispatch({ type: 'setQuantity', variantId, sellingMode, quantity });
    },
    [],
  );
  const openDrawer = useCallback(() => dispatch({ type: 'open' }), []);
  const closeDrawer = useCallback(() => dispatch({ type: 'close' }), []);

  const value = useMemo<CartContextValue>(() => {
    const totalQuantity = state.lines.reduce((sum, l) => sum + l.quantity, 0);
    const subtotal =
      Math.round(
        state.lines.reduce((sum, l) => sum + lineUnitPrice(l) * l.quantity, 0) * 100,
      ) / 100;
    return {
      lines: state.lines,
      totalQuantity,
      subtotal,
      isOpen: state.open,
      addLine,
      removeLine,
      setQuantity,
      openDrawer,
      closeDrawer,
      cartIconRef,
    };
  }, [state, addLine, removeLine, setQuantity, openDrawer, closeDrawer]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}

/**
 * Fly-to-cart: clone the product image and send it to the cart icon
 * (~500ms, ease.standard, ending scale ~0 + fade). Skipped entirely under
 * reduced motion. Uses WAAPI so no React state is involved.
 */
export function flyToCart(
  source: HTMLElement | null,
  target: HTMLElement | null,
  imageUrl: string,
  reducedMotion: boolean,
): void {
  if (reducedMotion || !source || !target || typeof document === 'undefined') return;
  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (from.width === 0 || to.width === 0) return;

  const ghost = document.createElement('img');
  ghost.src = imageUrl;
  ghost.alt = '';
  ghost.setAttribute('aria-hidden', 'true');
  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    objectFit: 'contain',
    borderRadius: '16px',
    zIndex: '90',
    pointerEvents: 'none',
    willChange: 'transform, opacity',
  });
  document.body.appendChild(ghost);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);

  const animation = ghost.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5}px) scale(0.4)`, opacity: 0.9, offset: 0.6 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.05)`, opacity: 0 },
    ],
    // duration.fly (0.5s) + ease.standard from src/lib/motion.ts.
    { duration: 500, easing: 'cubic-bezier(0.2, 0, 0, 1)', fill: 'forwards' },
  );
  animation.onfinish = () => ghost.remove();
  animation.oncancel = () => ghost.remove();
}
