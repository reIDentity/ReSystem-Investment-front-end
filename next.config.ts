import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // OAuth callback query parameters are credentials, including during local QA.
  logging: {
    incomingRequests: { ignore: [/\/api\/(?:auth\/reid|platform\/auth\/reid)\//] },
    serverFunctions: false,
    browserToTerminal: false,
  },
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
