import { product } from '@/data/product';
import { CountUp } from '@/components/CountUp';
import { Icon } from '@/components/icons';

/**
 * Brand story: Kerala gardens, 80+ years of practice, root-only standard.
 */
export function BrandStory() {
  return (
    <section
      aria-labelledby="story-heading"
      className="grid items-center gap-8 lg:grid-cols-2"
    >
      <div className="overflow-hidden rounded-3xl border border-clay-100 bg-white shadow-soft">
        <img
          src="/images/ashwagandha-root.svg"
          alt="Whole ashwagandha roots with leaves and berries, illustrated"
          width={1200}
          height={1200}
          className="block h-auto w-full"
        />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-forest-600">
          {product.vendor}
        </p>
        <h2 id="story-heading" className="mt-2 font-serif text-3xl text-clay-900 sm:text-4xl">
          Eighty years with one root
        </h2>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-clay-700">
          {product.brandStory}
        </p>
        <dl className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white p-4 text-center shadow-soft">
            <dd className="font-serif text-3xl text-forest-800">
              <CountUp value={80} suffix="+" />
            </dd>
            <dt className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-clay-500">
              Years of Ayurveda
            </dt>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-soft">
            <dd className="flex justify-center py-1.5 text-forest-800">
              <Icon name="seed" className="h-8 w-8" />
            </dd>
            <dt className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-clay-500">
              Root-only standard
            </dt>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-soft">
            <dd className="flex justify-center py-1.5 text-forest-800">
              <Icon name="flask" className="h-8 w-8" />
            </dd>
            <dt className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-clay-500">
              Every batch tested
            </dt>
          </div>
        </dl>
      </div>
    </section>
  );
}
