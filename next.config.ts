import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the local Wi-Fi preview to load development assets and live updates.
  allowedDevOrigins: ["192.168.8.251"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
