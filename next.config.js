/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['three', '3d-force-graph', 'three-spritetext'],
  webpack: (config) => {
    // This is required to make 3d-force-graph work with Next.js
    config.externals = config.externals || [];
    config.externals.push({ canvas: 'canvas' });
    return config;
  },
}

module.exports = nextConfig 