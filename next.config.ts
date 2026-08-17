import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal .next/standalone server bundle for the Docker image.
  output: "standalone",
};

export default nextConfig;
