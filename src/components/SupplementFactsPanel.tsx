import { product } from '@/data/product';
import { CountUp } from '@/components/CountUp';
import { Icon } from '@/components/icons';

/**
 * Dosed transparency: an FDA-style Supplement Facts panel beside plain-language
 * transparency chips. Framed as facts, not efficacy claims.
 */
export function SupplementFactsPanel() {
  const facts = product.supplementFacts;

  return (
    <section aria-labelledby="facts-heading" id="facts">
      <h2 id="facts-heading" className="font-serif text-3xl text-clay-900 sm:text-4xl">
        Dosed transparency
      </h2>
      <p className="mt-2 max-w-xl text-[15px] text-clay-600">
        No “proprietary blend”. What’s on the label is the whole story — facts, not
        promises.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* FDA-style panel */}
        <div className="rounded-2xl border-2 border-clay-900 bg-white p-5 sm:p-6">
          <p className="font-serif text-3xl leading-none text-clay-900">
            Supplement Facts
          </p>
          <div className="mt-2.5 border-b border-clay-900 pb-2 text-sm text-clay-800">
            <p>
              Serving Size <span className="font-semibold">{facts.servingSize}</span>
            </p>
          </div>
          <div className="border-b-8 border-clay-900 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wide text-clay-800">
            Amount per serving
          </div>
          <div className="flex items-baseline justify-between gap-3 border-b border-clay-300 py-2.5">
            <div>
              <p className="text-sm font-semibold text-clay-900">
                {facts.extractName} ({facts.botanicalName})
              </p>
              <p className="text-xs text-clay-600">{facts.plantPart}</p>
            </div>
            <p className="whitespace-nowrap text-sm font-semibold text-clay-900">
              {facts.mgPerServing} mg†
            </p>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-b-4 border-clay-900 py-2.5">
            <p className="text-sm text-clay-800">
              Standardized to withanolides ≥ {facts.withanolidePercent}%
            </p>
            <p className="whitespace-nowrap text-sm font-semibold text-clay-900">
              {Math.round((facts.mgPerServing * facts.withanolidePercent) / 100)} mg†
            </p>
          </div>
          <p className="pt-2.5 text-xs text-clay-600">
            † Daily Value not established.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-clay-600">
            <span className="font-semibold text-clay-800">Other ingredients:</span>{' '}
            {facts.otherIngredients.join(', ')}. {facts.allergens}
          </p>
        </div>

        {/* Plain-language transparency chips */}
        <div className="flex flex-col justify-center gap-4">
          <div
            className="prose-sm max-w-none text-[15px] leading-relaxed text-clay-700"
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          />
          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white p-4 shadow-soft">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay-500">
                Per serving
              </dt>
              <dd className="mt-1 font-serif text-3xl text-forest-800">
                <CountUp value={facts.mgPerServing} suffix=" mg" />
              </dd>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-soft">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay-500">
                Withanolides
              </dt>
              <dd className="mt-1 font-serif text-3xl text-forest-800">
                <CountUp value={facts.withanolidePercent} suffix="%" />
              </dd>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-soft">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay-500">
                Plant part
              </dt>
              <dd className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-clay-900">
                <Icon name="seed" className="h-4 w-4 text-forest-600" />
                Root only — no leaf
              </dd>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-soft">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay-500">
                Capsule
              </dt>
              <dd className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-clay-900">
                <Icon name="leaf" className="h-4 w-4 text-forest-600" />
                {facts.vegan ? 'Vegan' : 'Vegetarian'} · {facts.capsuleType}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
