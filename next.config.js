/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  webpack: (config, { isServer }) => {
    // Handle canvas package
    if (!isServer) {
      config.externals = {
        canvas: 'canvas',
      }
    }

    // Handle WebGL context
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      canvas: false,
    }

    return config
  },
  // Add transpilePackages to handle 3d-force-graph and related packages
  transpilePackages: [
    'three',
    '3d-force-graph',
    'force-graph',
    'three-spritetext'
  ],
  experimental: {
    esmExternals: 'loose'
  }
}

module.exports = nextConfig 