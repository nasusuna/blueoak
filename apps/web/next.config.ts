import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@service-app/core", "@service-app/db"],
  agentRules: false,
};

export default nextConfig;
