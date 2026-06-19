import type { NextConfig } from "next";
import path from "path";

const BACKEND_API_URL = process.env.BACKEND_API_URL || (process.env.NODE_ENV === "production" ? "http://backend:8080/api" : "http://localhost:8080/api");

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";
let dynamicHost = "localhost";
try {
  const urlObj = new URL(corsOrigin);
  dynamicHost = urlObj.hostname;
} catch (e) {
  const match = corsOrigin.match(/https?:\/\/([^:/]+)/);
  if (match) {
    dynamicHost = match[1];
  }
}

const minioPublic = `http://${dynamicHost}:9000`;
const backendPublic = `http://${dynamicHost}:8080`;

const BACKEND_INTERNAL = process.env.NODE_ENV === "production" ? "http://backend:8080" : "http://localhost:8080";

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
      {
        source: "/storage-bucket/:path*",
        destination: `${BACKEND_INTERNAL}/storage-bucket/:path*`
      },
      { source: "/api/auth/me",          destination: `${BACKEND_API_URL}/auth/me` },
      { source: "/api/auth/logout",      destination: `${BACKEND_API_URL}/auth/logout` },
      { source: "/api/auth/register",    destination: `${BACKEND_API_URL}/auth/register` },
      { source: "/api/backend/role",     destination: `${BACKEND_API_URL}/role` },
      { source: "/api/backend/role/:id", destination: `${BACKEND_API_URL}/role/:id` },
      { source: "/api/backend/permission", destination: `${BACKEND_API_URL}/permission` },
      { source: "/api/backend/permission/:id", destination: `${BACKEND_API_URL}/permission/:id` },
      { source: "/api/backend/role-permission", destination: `${BACKEND_API_URL}/role-permission` },
      { source: "/api/backend/users",    destination: `${BACKEND_API_URL}/users` },
      { source: "/api/backend/users/:id", destination: `${BACKEND_API_URL}/users/:id` },
      { source: "/api/backend/branches", destination: `${BACKEND_API_URL}/branches` },
      { source: "/api/backend/product-categories", destination: `${BACKEND_API_URL}/product-categories` },
      { source: "/api/backend/products", destination: `${BACKEND_API_URL}/products` },
      { source: "/api/backend/stocks",   destination: `${BACKEND_API_URL}/stocks` },
      { source: "/api/backend/admin/dashboard/stats", destination: `${BACKEND_API_URL}/admin/dashboard/stats` },
      { source: "/api/backend/admin/tenant", destination: `${BACKEND_API_URL}/admin/tenant` },
      { source: "/api/backend/kategori", destination: `${BACKEND_API_URL}/kategori` },
      { source: "/api/backend/payment_kategori", destination: `${BACKEND_API_URL}/payment_kategori` },
      { source: "/api/backend/tenant-umkm", destination: `${BACKEND_API_URL}/tenant-umkm` },
      { source: "/api/public/store/:username", destination: `${BACKEND_API_URL}/public/store/:username` },
      { source: "/api/backend/transaction/group", destination: `${BACKEND_API_URL}/transaction/group` },
      { source: "/api/backend/transaction/item", destination: `${BACKEND_API_URL}/transaction/item` },
      { source: "/api/backend/transaction/attachment", destination: `${BACKEND_API_URL}/transaction/attachment` },
      { source: "/api/backend/tenant/orders", destination: `${BACKEND_API_URL}/tenant/orders` },
      { source: "/api/backend/tenant/notifications", destination: `${BACKEND_API_URL}/tenant/notifications` },
      { source: "/api/backend/reports/sales", destination: `${BACKEND_API_URL}/reports/sales` },
      { source: "/api/umkm",             destination: `${BACKEND_API_URL}/public/tenant-umkm` },
      { source: "/api/store/checkout",   destination: `${BACKEND_API_URL}/store/checkout` },
      { source: "/api/backend/storage/upload", destination: `${BACKEND_API_URL}/storage/upload` },
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
          { key: "Content-Security-Policy", value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: http://localhost:8080 http://localhost:9000 ${minioPublic} ${backendPublic} https://api.qrserver.com; font-src 'self' data:; connect-src 'self' http://localhost:8080 ${backendPublic} ws://localhost:3000;` },
        ],
      },
    ];
  },
};

export default nextConfig;
