import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the file-tracing root to this project — a stray lockfile in a parent
  // directory otherwise makes Next infer the wrong workspace root.
  outputFileTracingRoot: projectRoot,
  images: {
    // Product imagery is served from Shopify's CDN in production; allow it here.
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;
