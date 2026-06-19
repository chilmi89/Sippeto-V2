import React from "react";
import { notFound } from "next/navigation";
import StorefrontClient from "@/components/store/StorefrontClient";
import StoreHero from "@/components/store/StoreHero";

const API_BASE = process.env.BACKEND_API_URL || "http://localhost:8080/api";

// ─── Fetch langsung ke Go backend (Server Component) ──────────────────────────
const getStoreData = async (username: string) => {
  const res = await fetch(`${API_BASE}/public/store/${username}`, {
    cache: "no-store",
  });

  if (!res.ok) return null;

  const json = await res.json();
  return json as {
    profile: {
      id: string;
      business_name: string | null;
      full_name: string | null;
      email: string;
      phone_number: string | null;
      address: string | null;
      avatar_url: string | null;
      banner_url: string | null;
      bio: string | null;
      username: string | null;
      created_at: string;
      payment_qr: string | null;
      metadata: unknown;
    };
    products: Array<{
      id: string;
      profile_id: string;
      category_id: string | null;
      name: string;
      description: string | null;
      base_price: number;
      sell_price: number;
      image_url: string | null;
      is_active: boolean;
      product_categories: { name: string } | null;
      product_stocks: Array<{ stock: number; branch_id: string }>;
    }>;
    branches: Array<{
      id: string;
      name: string;
      address: string | null;
      phone_number: string | null;
      payment_qr: string | null;
    }>;
  };
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Params = Promise<{ username: string }>;

// ─── Metadata (gunakan cache yang sama) ───────────────────────────────────────
export async function generateMetadata({ params }: { params: Params }) {
  const { username } = await params;
  const data = await getStoreData(username);

  if (!data) {
    return {
      title: "Toko Tidak Ditemukan - SiPetto",
      description: "Halaman toko UMKM tidak ditemukan di ekosistem SiPetto.",
    };
  }

  const { profile } = data;
  const storeTitle = profile.business_name || profile.username || username;
  return {
    title: `${storeTitle} - E-Catalog Online SiPetto`,
    description:
      profile.bio ||
      `Temukan produk-produk terbaik dari ${storeTitle} dengan pemesanan praktis via WhatsApp.`,
    openGraph: {
      title: `${storeTitle} - E-Catalog Online SiPetto`,
      images: profile.banner_url ? [{ url: profile.banner_url }] : [],
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function StorePage({ params }: { params: Params }) {
  const { username } = await params;
  const data = await getStoreData(username);

  if (!data) notFound();

  const { profile, products, branches } = data;

  const serializedProfile = {
    id: profile.id,
    business_name: profile.business_name,
    full_name: profile.full_name,
    email: profile.email,
    phone_number: profile.phone_number,
    address: profile.address,
    avatar_url: profile.avatar_url,
    banner_url: profile.banner_url,
    bio: profile.bio,
    username: profile.username,
    created_at: profile.created_at ?? null,
    payment_qr: profile.payment_qr,
    metadata: profile.metadata,
  };

  const serializedProducts = products.map((p) => ({
    id: p.id,
    profile_id: p.profile_id,
    category_id: p.category_id,
    name: p.name,
    description: p.description,
    base_price: p.base_price,
    sell_price: p.sell_price,
    image_url: p.image_url,
    is_active: p.is_active,
    product_categories: p.product_categories ? { name: p.product_categories.name } : null,
    product_stocks: p.product_stocks.map((s) => ({ stock: s.stock, branch_id: s.branch_id })),
  }));

  const serializedBranches = branches.map((b) => ({
    id: b.id,
    name: b.name,
    address: b.address,
    phone_number: b.phone_number,
    payment_qr: b.payment_qr,
  }));

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 pb-20 relative overflow-hidden">
      {/* Background Ambient — CSS only, no JS, no animation */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/6 rounded-full blur-[100px]" />
      </div>

      {/* Hero (Server Component — dirender di server, tanpa JS bundle) */}
      <StoreHero profile={serializedProfile} productCount={serializedProducts.length} />

      {/* Interactive Client Part */}
      <StorefrontClient
        profile={serializedProfile}
        products={serializedProducts}
        branches={serializedBranches}
      />
    </div>
  );
}