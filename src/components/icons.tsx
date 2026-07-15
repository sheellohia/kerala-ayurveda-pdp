import type { ReactElement } from 'react';

/**
 * Inline SVG icon map. Keys cover everything the product fixture and fit-check
 * questions reference (leaf, moon, sun, sparkle, dumbbell, heart, capsule,
 * powder, shield, seed, flask) plus the UI chrome the PDP needs.
 * All are 24×24 stroke icons inheriting `currentColor`.
 */

export interface IconProps {
  name: string;
  className?: string;
  strokeWidth?: number;
}

const GLYPHS: Record<string, ReactElement> = {
  leaf: (
    <>
      <path d="M20 4C10.5 4.4 4.8 9.6 4.8 17.2c0 .9.1 1.8.3 2.8C13 20 20 14 20 4Z" />
      <path d="M5 20C8.5 14.5 13 9.5 20 4" />
    </>
  ),
  moon: <path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a7 7 0 0 0 10.7 10.7Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.5 14 9.9l6.4 2.1-6.4 2.1L12 20.5 10 14.1 3.6 12 10 9.9Z" />
      <path d="M19 3v3M20.5 4.5h-3" />
    </>
  ),
  dumbbell: (
    <>
      <path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" />
    </>
  ),
  heart: (
    <path d="M12 20.5C7.2 16.4 3.5 13.2 3.5 9.6 3.5 7.1 5.4 5 7.9 5c1.6 0 3.1.9 4.1 2.4C13 5.9 14.5 5 16.1 5c2.5 0 4.4 2.1 4.4 4.6 0 3.6-3.7 6.8-8.5 10.9Z" />
  ),
  capsule: (
    <>
      <rect x="3.2" y="8.6" width="17.6" height="6.8" rx="3.4" transform="rotate(-28 12 12)" />
      <path d="m8.8 8.2 6 7.2" transform="rotate(-4 12 12)" />
    </>
  ),
  powder: (
    <>
      <path d="M4.5 17.5a7.5 7.5 0 0 1 15 0Z" />
      <path d="M8 9.5 9.5 8M12 8.5V6.5M16 9.5 14.5 8" />
      <path d="M3 20.5h18" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 5.8v5c0 4.6 2.9 7.7 7 9.2 4.1-1.5 7-4.6 7-9.2v-5Z" />
      <path d="m8.8 11.8 2.2 2.2 4.2-4.5" />
    </>
  ),
  seed: (
    <>
      <path d="M12 21v-8" />
      <path d="M12 13c0-4.4-3.2-6.8-7.5-6.8C4.5 10.6 7.7 13 12 13Z" />
      <path d="M12 13c0-4.4 3.2-6.8 7.5-6.8C19.5 10.6 16.3 13 12 13Z" />
    </>
  ),
  flask: (
    <>
      <path d="M9.5 3h5M10.5 3v5.2L5 17.6A2.1 2.1 0 0 0 6.9 20.7h10.2a2.1 2.1 0 0 0 1.9-3.1L13.5 8.2V3" />
      <path d="M7.2 14.5h9.6" />
    </>
  ),
  cart: (
    <>
      <path d="M3 4h2.2l2.5 11.2a1.6 1.6 0 0 0 1.6 1.3h7.6a1.6 1.6 0 0 0 1.6-1.3L20.4 8H6.1" />
      <circle cx="9.5" cy="20.3" r="1.4" />
      <circle cx="16.9" cy="20.3" r="1.4" />
    </>
  ),
  star: (
    <path
      d="M12 2.8l2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.3l-5.7 3 1.1-6.3L2.8 9.5l6.4-.9Z"
      fill="currentColor"
      stroke="none"
    />
  ),
  check: <path d="m4.5 12.5 5 5 10-11" />,
  'chevron-down': <path d="m6 9.5 6 6 6-6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  play: (
    <path
      d="M9.2 6.6v10.8c0 .8.9 1.3 1.6.9l8.2-5.4c.6-.4.6-1.4 0-1.8l-8.2-5.4c-.7-.4-1.6.1-1.6.9Z"
      fill="currentColor"
      stroke="none"
    />
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <path d="M12 7.6v.2" strokeWidth={2.4} />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.6 2.7 19.4a1.2 1.2 0 0 0 1 1.8h16.6a1.2 1.2 0 0 0 1-1.8Z" />
      <path d="M12 9.5v4.5" />
      <path d="M12 17.2v.2" strokeWidth={2.4} />
    </>
  ),
  'arrow-right': <path d="M4 12h16M13.5 5.5 20 12l-6.5 6.5" />,
  edit: <path d="m4.5 19.5.9-3.8L16.6 4.5a2 2 0 0 1 2.9 2.9L8.3 18.6l-3.8.9Z" />,
  refresh: (
    <>
      <path d="M4 5v5h5" />
      <path d="M20 19v-5h-5" />
      <path d="M4.6 10a8 8 0 0 1 13.7-3.2L20 8.5" />
      <path d="M19.4 14a8 8 0 0 1-13.7 3.2L4 15.5" />
    </>
  ),
  document: (
    <>
      <path d="M7 3h7.5L19 7.5V21H7Z" />
      <path d="M14 3v5h5" />
      <path d="M10 12.5h6M10 15.5h6M10 18.5h4" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8.5h3l1.6-2.5h6.8L17 8.5h3a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="14" r="3.4" />
    </>
  ),
  truck: (
    <>
      <path d="M2.5 6h12v11h-12zM14.5 10h4l3 3.5V17h-7" />
      <circle cx="6.5" cy="18.5" r="1.6" />
      <circle cx="17.5" cy="18.5" r="1.6" />
    </>
  ),
};

export function Icon({ name, className, strokeWidth = 1.7 }: IconProps) {
  const glyph = GLYPHS[name] ?? GLYPHS.leaf;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {glyph}
    </svg>
  );
}
