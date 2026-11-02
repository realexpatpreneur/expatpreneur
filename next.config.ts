import type { NextConfig } from "next";

const buildTime = new Date().toISOString();

const nextConfig: NextConfig = {
  env: { BUILD_TIME: buildTime },
  // Pages you have just seen, or that were fetched ahead of a click, are
  // kept in the browser for 30 seconds, so going back and forth between
  // them is instant. Posting anything clears them straight away.
  experimental: {
    staleTimes: { dynamic: 30, static: 300 },
  },
};

export default nextConfig;