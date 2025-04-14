import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/progress/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/progress/:path*`,
      },
      {
        source: "/ws/progress/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/ws/progress/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
