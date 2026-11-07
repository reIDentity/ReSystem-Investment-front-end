import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Resolve legacy IDs before rendering so redirects retain their HTTP status
    // rather than becoming a meta redirect after the public shell streams.
    return { beforeFiles: [{ source: "/projects/:id([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})", destination: "/api/public/project-redirect/:id" }] };
  },
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
