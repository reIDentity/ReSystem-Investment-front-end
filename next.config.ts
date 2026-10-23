import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
    ] }];
  },
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
