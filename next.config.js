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
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/events/:eventId/register',
          destination: '/api/events/:eventId/register',
          has: [{ type: 'header', key: 'content-type', value: 'application/json' }]
        },
        {
          source: '/api/events/:eventId/deregister',
          destination: '/api/events/:eventId/deregister',
          has: [{ type: 'header', key: 'content-type', value: 'application/json' }]
        }
      ],
    }
  },
}

module.exports = nextConfig 