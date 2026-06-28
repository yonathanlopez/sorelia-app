import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async rewrites() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE44_APP_BASE_URL;
    if (!baseUrl) {
      return [];
    }

    return [
      {
        source: '/api/:path*',
        destination: `${baseUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
