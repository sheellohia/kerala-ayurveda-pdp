import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ashwagandha — Kerala Ayurveda',
  description:
    'KSM-66® root-only Ashwagandha to help your body handle everyday stress. Find out if it’s right for you.',
};

export const viewport: Viewport = {
  themeColor: '#faf6f1',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/*
          Brand fonts match the real Kerala Ayurveda store: Marcellus (serif
          display) + Figtree (sans body). Loaded via <link> with preconnect so
          the build has no font-fetch dependency; CSS-var fallbacks (globals.css)
          keep the layout intact if the fonts are unavailable offline.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Marcellus&family=Figtree:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
