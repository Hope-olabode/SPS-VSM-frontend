import type { NextConfig } from "next";

// Where the Express API (backend-node) runs. Only the Next.js server uses this, so it is not NEXT_PUBLIC_.
const API_URL = process.env.API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  // Next.js gzips responses by default, and a gzipped server-sent-events stream is held back until it fills up, so the dashboard never
  // heard about a kiosk check-in until the page was reloaded. The API stream (/backend/notifications/stream) must go through as it is.
  compress: false,
  // The browser calls /backend/... on this same site and Next.js forwards it to the API.
  // Same origin means no CORS, and the API's httpOnly login cookie is visible to src/proxy.ts.
  async rewrites() {
    return [{ source: "/backend/:path*", destination: `${API_URL}/api/:path*` }];
  },
  // Say outright that this site may use the camera (the QR scanner and the visitor photo step). Other sites embedded in a page may not.
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "Permissions-Policy", value: "camera=(self)" }] }];
  },
  experimental: {
    agentFeedback: true,
  },
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
