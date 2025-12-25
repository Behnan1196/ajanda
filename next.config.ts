import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/coach',
        destination: '/tutor',
        permanent: true,
      },
      {
        source: '/coach/:path*',
        destination: '/tutor/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
