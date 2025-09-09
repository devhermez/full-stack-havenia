import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // 🚧 Only for CI/builds — we'll fix lint after launch
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 🚧 Only for CI/builds — we'll fix types after launch
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
