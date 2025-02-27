import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb", // Set limit (adjust based on your needs)
    },
  },
};

export default nextConfig;
