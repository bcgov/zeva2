import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  logging: {
    incomingRequests: {
      ignore: [/\api\/health/],
    },
  },
};

export default nextConfig;
