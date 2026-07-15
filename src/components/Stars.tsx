import { Icon } from '@/components/icons';

/**
 * Star rating row with fractional fill (e.g. 4.7 of 5) via a clipped overlay.
 * Purely presentational; the accessible value is exposed as a label.
 */
export function Stars({
  value,
  className = 'h-4 w-4',
  gap = 'gap-0.5',
}: {
  value: number;
  className?: string;
  gap?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const row = (color: string) => (
    <div className={`flex ${gap} ${color}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Icon key={i} name="star" className={className} />
      ))}
    </div>
  );
  return (
    <div
      className="relative inline-flex"
      role="img"
      aria-label={`Rated ${value} out of 5 stars`}
    >
      {row('text-clay-200')}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${pct}%` }}
        aria-hidden="true"
      >
        {row('text-saffron-400')}
      </div>
    </div>
  );
}
