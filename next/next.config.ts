import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  logging: {
    incomingRequests: {
      ignore: [/\api\/health/],
    },
  },
  experimental: {
    cpus: 4,
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
