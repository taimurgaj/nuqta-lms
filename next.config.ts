import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  async rewrites() {
    return [
      { source: "/ide", destination: "/ide/index.html" },
      { source: "/ide/", destination: "/ide/index.html" },
    ];
  },
};

export default nextConfig;
