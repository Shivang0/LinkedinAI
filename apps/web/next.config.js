/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@linkedin-ai/database',
    '@linkedin-ai/services',
    '@linkedin-ai/shared',
    '@linkedin-ai/queue',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
      },
      {
        protocol: 'https',
        hostname: '*.licdn.com',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcrypt'],
  },
};

module.exports = nextConfig;
