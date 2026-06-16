import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: path.resolve("."),
  },
  images: {
    remotePatterns: [
      {
        // Supabase Storage — tangkap semua subdomain project
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // Supabase Storage fallback dengan supabase.in
        protocol: "https",
        hostname: "*.supabase.in",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/auth/me",
        destination: "http://localhost:8080/api/auth/me",
      },
      {
        source: "/api/auth/logout",
        destination: "http://localhost:8080/api/auth/logout",
      },
    ];
  },
};

export default nextConfig;
