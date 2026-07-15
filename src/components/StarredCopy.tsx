/**
 * Renders structure/function copy whose trailing `*` becomes a link to the
 * verbatim DSHEA disclaimer in the compliance footer (#disclaimer).
 */
export function StarredCopy({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const starred = text.endsWith('*');
  const body = starred ? text.slice(0, -1) : text;
  return (
    <span className={className}>
      {body}
      {starred && (
        <a
          href="#disclaimer"
          className="focus-ring rounded text-saffron-600 no-underline hover:text-saffron-700"
          aria-label="See FDA disclaimer"
        >
          *
        </a>
      )}
    </span>
  );
}
