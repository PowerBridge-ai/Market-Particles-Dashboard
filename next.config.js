/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['three', '3d-force-graph', 'three-spritetext'],
  webpack: (config) => {
    // This is required to make 3d-force-graph work with Next.js
    config.externals = config.externals || [];
    config.externals.push({ canvas: 'canvas' });

    // Mark pg modules as server-side only
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      dns: false,
    };
    
    return config;
  },
  // Restrict environment where pg imports can run
  serverComponentsExternalPackages: ['pg'],
}

module.exports = nextConfig 