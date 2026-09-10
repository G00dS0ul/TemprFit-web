/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ['images.unsplash.com', 'api.dicebear.com', 'img.spoonacular.com'],
  },
}

module.exports = nextConfig
