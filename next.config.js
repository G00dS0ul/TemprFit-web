const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['images.unsplash.com', 'api.dicebear.com', 'img.spoonacular.com'],
  },
  webpack: (config) => {
    config.resolve.alias['react'] = path.resolve('./node_modules/react');
    config.resolve.alias['react-dom'] = path.resolve('./node_modules/react-dom');
    return config;
  },
}

let exportedConfig = nextConfig;

try {
  const withPWA = require('@ducanh2912/next-pwa').default({
    dest: 'public',
    disable: process.env.NODE_ENV !== 'production',
    register: true,
    skipWaiting: true,
    cacheOnFrontEndNav: true,
    aggressiveFrontEndNavCaching: true,
    reloadOnOnline: true,
    swcMinify: true,
    fallbacks: {
      document: '/offline',
    },
  });
  exportedConfig = withPWA(nextConfig);
} catch (e) {
  console.warn('PWA plugin could not be loaded, building without PWA support:', e.message);
}

module.exports = exportedConfig;