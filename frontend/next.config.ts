import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (!apiUrl) return [];

    return [
      {
        source: "/progress/:path*",
        destination: `${apiUrl}/progress/:path*`,
      },
      {
        source: "/ws/progress/:path*",
        destination: `${apiUrl}/ws/progress/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
