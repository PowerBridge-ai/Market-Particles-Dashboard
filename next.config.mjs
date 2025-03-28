/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['three', '3d-force-graph', 'three-spritetext'],
  webpack: (config) => {
    config.externals = config.externals || {};
    config.externals['three'] = 'THREE';
    return config;
  },
  experimental: {
    esmExternals: 'loose'
  }
};

export default nextConfig; 