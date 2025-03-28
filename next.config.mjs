/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['three', '3d-force-graph', 'three-spritetext'],
  webpack: (config) => {
    // Don't externalize Three.js
    if (config.externals) {
      const index = config.externals.findIndex(
        (external) => external === 'three' || (external.three && external.three === 'THREE')
      );
      if (index >= 0) {
        config.externals.splice(index, 1);
      }
    }
    
    // Add fallbacks for node modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      child_process: false,
    };
    
    return config;
  },
  experimental: {
    esmExternals: 'loose'
  }
};

export default nextConfig; 