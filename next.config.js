/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/ai_app',
  assetPrefix: '/ai_app/',
};

module.exports = nextConfig;
