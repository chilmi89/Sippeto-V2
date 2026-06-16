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
      {
        source: "/api/backend/role",
        destination: "http://localhost:8080/api/role",
      },
      {
        source: "/api/backend/role/:id",
        destination: "http://localhost:8080/api/role/:id",
      },
      {
        source: "/api/backend/permission",
        destination: "http://localhost:8080/api/permission",
      },
      {
        source: "/api/backend/permission/:id",
        destination: "http://localhost:8080/api/permission/:id",
      },
      {
        source: "/api/backend/role-permission",
        destination: "http://localhost:8080/api/role-permission",
      },
    ];
  },
};

export default nextConfig;
