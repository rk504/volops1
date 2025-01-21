/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['images.unsplash.com'],
  },
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore TS errors during build
  },
  experimental: {
    missingSuspenseWithCSRError: false,
  },
}

module.exports = nextConfig 