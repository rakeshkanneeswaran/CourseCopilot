import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb", // Set limit (adjust based on your needs)
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "eduverseai-production.s3.ap-south-1.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
