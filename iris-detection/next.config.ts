import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Two lockfiles sit above this app; pin the root so Turbopack stops
  // guessing and stops warning on every build.
  turbopack: {
    root: __dirname,
  },
  // The floating dev badge sits over the terminal's control desk, which is
  // exactly where the take control lives.
  devIndicators: false,
};

export default nextConfig;
