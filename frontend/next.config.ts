import type { NextConfig } from "next";
import path from "path";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8080";
const BACKEND_API_URL = BACKEND_URL.endsWith("/api") ? BACKEND_URL.slice(0, -4) : BACKEND_URL;

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: path.resolve("."),
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      { source: "/api/auth/me",          destination: `${BACKEND_API_URL}/api/auth/me` },
      { source: "/api/auth/logout",      destination: `${BACKEND_API_URL}/api/auth/logout` },
      { source: "/api/auth/register",    destination: `${BACKEND_API_URL}/api/auth/register` },
      { source: "/api/backend/role",     destination: `${BACKEND_API_URL}/api/role` },
      { source: "/api/backend/role/:id", destination: `${BACKEND_API_URL}/api/role/:id` },
      { source: "/api/backend/permission", destination: `${BACKEND_API_URL}/api/permission` },
      { source: "/api/backend/permission/:id", destination: `${BACKEND_API_URL}/api/permission/:id` },
      { source: "/api/backend/role-permission", destination: `${BACKEND_API_URL}/api/role-permission` },
      { source: "/api/backend/users",    destination: `${BACKEND_API_URL}/api/users` },
      { source: "/api/backend/users/:id", destination: `${BACKEND_API_URL}/api/users/:id` },
      { source: "/api/backend/branches", destination: `${BACKEND_API_URL}/api/branches` },
      { source: "/api/backend/product-categories", destination: `${BACKEND_API_URL}/api/product-categories` },
      { source: "/api/backend/products", destination: `${BACKEND_API_URL}/api/products` },
      { source: "/api/backend/stocks",   destination: `${BACKEND_API_URL}/api/stocks` },
      { source: "/api/backend/admin/dashboard/stats", destination: `${BACKEND_API_URL}/api/admin/dashboard/stats` },
      { source: "/api/backend/admin/tenant", destination: `${BACKEND_API_URL}/api/admin/tenant` },
      { source: "/api/backend/kategori", destination: `${BACKEND_API_URL}/api/kategori` },
      { source: "/api/backend/payment_kategori", destination: `${BACKEND_API_URL}/api/payment_kategori` },
      { source: "/api/backend/tenant-umkm", destination: `${BACKEND_API_URL}/api/tenant-umkm` },
      { source: "/api/public/store/:username", destination: `${BACKEND_API_URL}/api/public/store/:username` },
      { source: "/api/backend/transaction/group", destination: `${BACKEND_API_URL}/api/transaction/group` },
      { source: "/api/backend/transaction/item", destination: `${BACKEND_API_URL}/api/transaction/item` },
      { source: "/api/backend/transaction/attachment", destination: `${BACKEND_API_URL}/api/transaction/attachment` },
      { source: "/api/backend/tenant/orders", destination: `${BACKEND_API_URL}/api/tenant/orders` },
      { source: "/api/backend/tenant/notifications", destination: `${BACKEND_API_URL}/api/tenant/notifications` },
      { source: "/api/backend/reports/sales", destination: `${BACKEND_API_URL}/api/reports/sales` },
      { source: "/api/umkm",             destination: `${BACKEND_API_URL}/api/public/tenant-umkm` },
      { source: "/api/store/checkout",   destination: `${BACKEND_API_URL}/api/store/checkout` },
      { source: "/api/backend/storage/upload", destination: `${BACKEND_API_URL}/api/storage/upload` },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: http://localhost:8080 http://localhost:9000; font-src 'self' data:; connect-src 'self' http://localhost:8080 ws://localhost:3000;" },
        ],
      },
    ];
  },
};

export default nextConfig;
