import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const apiBase = configuredApiUrl.replace(/\/+$/, "");
    const apiPrefix = apiBase.endsWith("/api") ? apiBase : `${apiBase}/api`;

    return [
      {
        source: "/api/:path*",
        destination: `${apiPrefix}/:path*`,
      },
    ];
  },
};

export default nextConfig;
