import { product } from '@/data/product';
import { Icon } from '@/components/icons';

/**
 * Compliance footer: the verbatim DSHEA disclaimer (bold, always visible —
 * never inside a collapsed accordion), the full safety block, and the
 * wellness-not-medical-advice line.
 */
export function ComplianceFooter() {
  return (
    <footer id="disclaimer" className="border-t border-clay-200 bg-clay-100/60">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border-2 border-clay-300 bg-white p-5 sm:p-6">
          <p className="text-sm font-bold leading-relaxed text-clay-900">
            {product.disclaimer}
          </p>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-clay-800">
              <Icon name="shield" className="h-4 w-4 text-forest-700" />
              Safety information
            </h2>
            <p className="mt-2.5 text-[13px] leading-relaxed text-clay-600">
              {product.safetyFull}
            </p>
          </div>
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-clay-800">
              <Icon name="info" className="h-4 w-4 text-forest-700" />
              About this experience
            </h2>
            <p className="mt-2.5 text-[13px] leading-relaxed text-clay-600">
              The “Is this right for me?” fit-check offers general wellness guidance
              based on your answers — it is not medical advice, a diagnosis, or a
              substitute for talking with a qualified healthcare professional.
            </p>
            <p className="mt-2.5 text-[13px] leading-relaxed text-clay-500">
              Demo prototype: product data, reviews, pricing, and the Certificate of
              Analysis are illustrative and would be replaced by the live SKU’s
              substantiated data before publishing.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-clay-200 pt-5 text-xs text-clay-500 sm:flex-row sm:items-center">
          <p className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest-700 text-clay-50">
              <Icon name="leaf" className="h-3 w-3" />
            </span>
            <span className="font-serif text-sm text-clay-800">{product.vendor}</span>
          </p>
          <p>KSM-66® is a registered trademark of Ixoreal Biomed Inc.</p>
        </div>
      </div>
    </footer>
  );
}
