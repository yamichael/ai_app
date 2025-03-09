/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Only use basePath and assetPrefix in production (GitHub Pages)
  ...(process.env.NODE_ENV === 'production' ? {
    basePath: '/ai_app',
    assetPrefix: '/ai_app/',
  } : {}),
};

module.exports = nextConfig;
