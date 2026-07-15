'use client';

import { useCallback, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { product, findVariant, variantByOptions } from '@/data/product';
import type { Goal, RecommendationOffer } from '@/lib/types';
import { CartProvider, flyToCart, useCart, type SellingMode } from '@/lib/cart';
import { StickyHeader } from '@/components/StickyHeader';
import { HeroGallery } from '@/components/HeroGallery';
import { BuyPanel } from '@/components/BuyPanel';
import { FitCheckLauncher } from '@/components/FitCheckLauncher';
import { FitCheck, type FitCheckSession } from '@/components/FitCheck';
import { BenefitStrip } from '@/components/BenefitStrip';
import { SupplementFactsPanel } from '@/components/SupplementFactsPanel';
import { ExpectationsTimeline } from '@/components/ExpectationsTimeline';
import { TrustBand } from '@/components/TrustBand';
import { Reviews } from '@/components/Reviews';
import { FaqAccordion } from '@/components/FaqAccordion';
import { BrandStory } from '@/components/BrandStory';
import { StickyBuyBar } from '@/components/StickyBuyBar';
import { CartDrawer } from '@/components/CartDrawer';
import { ComplianceFooter } from '@/components/ComplianceFooter';
import { Reveal } from '@/components/Reveal';

/**
 * The full PDP experience. Composes every section per the design spec and owns
 * the shared selection state (Form / Pack / purchase mode) that the buy panel,
 * hero gallery, sticky buy-bar, and fit-check result all bind to.
 */
export function PdpExperience() {
  return (
    <CartProvider>
      <PdpInner />
    </CartProvider>
  );
}

function PdpInner() {
  const cart = useCart();
  const reduced = !!useReducedMotion();

  /* --- Shared variant selection (Capsules / 1 Bottle pre-selected: most popular) --- */
  const [form, setForm] = useState('Capsules');
  const [pack, setPack] = useState('1 Bottle');
  const [mode, setMode] = useState<SellingMode>('one-time');
  const variant =
    variantByOptions(form, pack) ??
    product.variants.find((v) => v.availableForSale) ??
    product.variants[0];

  /* --- Fit-check session + reviews highlight --- */
  const [fitCheckOpen, setFitCheckOpen] = useState(false);
  const [session, setSession] = useState<FitCheckSession | null>(null);
  const highlightGoal: Goal | null = session
    ? (session.answers.primaryGoal ?? session.answers.goals[0] ?? null)
    : null;

  /* --- Buy panel highlight after the fit-check pre-fills it --- */
  const buyPanelRef = useRef<HTMLDivElement | null>(null);
  const [buyPanelFlash, setBuyPanelFlash] = useState(false);
  const flashTimerRef = useRef<number | null>(null);

  /* --- Fly-to-cart source: the hero gallery stage --- */
  const heroStageRef = useRef<HTMLDivElement | null>(null);

  /* --- Sticky buy-bar: IntersectionObserver on the native hero CTA --- */
  const [heroCtaVisible, setHeroCtaVisible] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const heroCtaRef = useCallback((node: HTMLButtonElement | null) => {
    observerRef.current?.disconnect();
    if (!node) return;
    observerRef.current = new IntersectionObserver(
      ([entry]) => setHeroCtaVisible(entry.isIntersecting),
      { threshold: 0 },
    );
    observerRef.current.observe(node);
  }, []);

  /* --- Selection handlers (keep the combination purchasable) --- */
  const handleSelectForm = useCallback(
    (nextForm: string) => {
      setForm(nextForm);
      const target = variantByOptions(nextForm, pack);
      if (!target?.availableForSale) {
        // Snap to the nearest in-stock pack for this form (largest first).
        const packs = product.options.find((o) => o.name === 'Pack')?.values ?? [];
        const fallback = [...packs]
          .reverse()
          .find((p) => variantByOptions(nextForm, p)?.availableForSale);
        if (fallback) setPack(fallback);
      }
    },
    [pack],
  );

  /* --- Shared add-to-cart: cart line + fly + badge pop + drawer --- */
  const addVariantToCart = useCallback(
    (variantId: string, sellingMode: SellingMode, sourceEl: HTMLElement | null): boolean => {
      const v = findVariant(variantId);
      if (!v || !v.availableForSale) return false;
      cart.addLine(variantId, sellingMode, 1);
      flyToCart(
        sourceEl,
        cart.cartIconRef.current,
        v.image?.url ?? product.featuredImage.url,
        reduced,
      );
      // Let the fly land before the drawer slides in (still < ~600ms total).
      window.setTimeout(() => cart.openDrawer(), reduced ? 0 : 420);
      return true;
    },
    [cart, reduced],
  );

  const handleHeroAdd = useCallback(
    () => addVariantToCart(variant.id, mode, heroStageRef.current),
    [addVariantToCart, variant.id, mode],
  );

  const handleBarAdd = useCallback(
    (sourceEl: HTMLElement | null) => addVariantToCart(variant.id, mode, sourceEl),
    [addVariantToCart, variant.id, mode],
  );

  /* --- Fit-check bindings: result pre-fills the buy panel --- */
  const applyOffer = useCallback((offer: RecommendationOffer) => {
    const v = findVariant(offer.recommendedVariantId);
    if (!v) return;
    const offerForm = v.selectedOptions.find((o) => o.name === 'Form')?.value;
    const offerPack = v.selectedOptions.find((o) => o.name === 'Pack')?.value;
    if (offerForm) setForm(offerForm);
    if (offerPack) setPack(offerPack);
    setMode(offer.sellingMode);
  }, []);

  const addRecommended = useCallback(
    (offer: RecommendationOffer): boolean => {
      applyOffer(offer);
      return addVariantToCart(offer.recommendedVariantId, offer.sellingMode, heroStageRef.current);
    },
    [applyOffer, addVariantToCart],
  );

  // A match result binds to the buy panel immediately — even if the shopper
  // then leaves via "show me the product". Caution has no offer → no-op.
  const handleFitCheckResult = useCallback(
    (s: FitCheckSession) => {
      setSession(s);
      if (s.recommendation.offer) applyOffer(s.recommendation.offer);
    },
    [applyOffer],
  );

  // Closing after a match: make the pre-filled buy panel visible.
  const handleFitCheckClose = useCallback(() => {
    setFitCheckOpen(false);
    if (!session?.recommendation.offer) return;
    buyPanelRef.current?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'center',
    });
    setBuyPanelFlash(true);
    if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
    flashTimerRef.current = window.setTimeout(() => setBuyPanelFlash(false), 1800);
  }, [session, reduced]);

  return (
    <div id="top" className="min-h-screen">
      <StickyHeader />

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* 2. Hero: gallery + buy panel (above the fold — no scroll reveal) */}
        <section className="grid gap-8 pb-14 pt-6 sm:pt-10 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          {/* min-w-0: keep intrinsic content (thumb strip) from inflating the auto track */}
          <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
            <HeroGallery
              images={product.images}
              variantImage={variant.image}
              stageRef={heroStageRef}
            />
          </div>
          <div
            ref={buyPanelRef}
            className={`min-w-0 flex flex-col gap-6 rounded-3xl transition-shadow duration-500 ${
              buyPanelFlash
                ? 'ring-2 ring-saffron-400 ring-offset-8 ring-offset-clay-50'
                : 'ring-0 ring-transparent'
            }`}
          >
            <BuyPanel
              form={form}
              pack={pack}
              mode={mode}
              variant={variant}
              onSelectForm={handleSelectForm}
              onSelectPack={setPack}
              onSelectMode={setMode}
              onAddToCart={handleHeroAdd}
              ctaRef={heroCtaRef}
            />
            {/* 3. Fit-check launcher, directly under the buy panel */}
            <FitCheckLauncher session={session} onOpen={() => setFitCheckOpen(true)} />
          </div>
        </section>

        {/* 4–10. Editorial sections */}
        <div className="flex flex-col gap-20 pb-24 sm:gap-24">
          <Reveal as="section">
            <BenefitStrip />
          </Reveal>
          <Reveal as="section">
            <SupplementFactsPanel />
          </Reveal>
          <Reveal as="section">
            <ExpectationsTimeline />
          </Reveal>
          <Reveal as="section">
            <TrustBand />
          </Reveal>
          <Reveal as="section">
            <Reviews highlightGoal={highlightGoal} />
          </Reveal>
          <Reveal as="section">
            <FaqAccordion />
          </Reveal>
          <Reveal as="section">
            <BrandStory />
          </Reveal>
        </div>
      </main>

      {/* 12. Compliance footer (verbatim DSHEA disclaimer) */}
      <ComplianceFooter />

      {/* Spacer so the fixed mobile buy-bar never covers footer content */}
      <div className="h-20 lg:hidden" aria-hidden="true" />

      {/* 11. Sticky mobile buy-bar — only when the native CTA is off screen */}
      <StickyBuyBar
        show={!heroCtaVisible}
        variant={variant}
        mode={mode}
        onAdd={handleBarAdd}
      />

      {/* The fit-check centerpiece */}
      <FitCheck
        open={fitCheckOpen}
        onClose={handleFitCheckClose}
        onResult={handleFitCheckResult}
        onAddRecommended={addRecommended}
        onApplyOffer={applyOffer}
        stored={session}
      />

      <CartDrawer />
    </div>
  );
}
