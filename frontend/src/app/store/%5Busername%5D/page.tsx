import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import StorefrontClient from "@/components/store/StorefrontClient";
import StoreHero from "@/components/store/StoreHero";

const GOLANG_BASE = process.env.BACKEND_API_URL || "http://localhost:8080/api";

// ─── Cache TTL: 5 menit (data toko jarang berubah) ───────────────────────────
const fetchStoreDataDirect = async (username: string) => {
  try {
    const res = await fetch(`${GOLANG_BASE}/public/store/${username}`, {
      method: "GET",
      next: { revalidate: 300 } // 5 menit
    });

    if (!res.ok) return null;
    const data = await res.json();
    return {
      profile: data.profile,
      rawProducts: data.products || [],
      rawBranches: data.branches || [],
    };
  } catch (err) {
    console.error("fetchStoreDataDirect Error:", err);
    return null;
  }
};

const getStoreDataCached = unstable_cache(
  fetchStoreDataDirect,
  // Cache key berdasarkan username
  ["store-data"],
  { revalidate: 300, tags: ["store"] } // 5 menit
);

const getStoreData = process.env.NODE_ENV === "development"
  ? fetchStoreDataDirect
  : getStoreDataCached;

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

  const { profile, rawProducts, rawBranches } = data;

  // Serialize agar bisa dikirim ke client component
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
    created_at: profile.created_at,
    payment_qr: profile.payment_qr,
    metadata: profile.metadata,
  };

  const serializedProducts = rawProducts.map((p: any) => ({
    id: p.id,
    profile_id: p.profile_id,
    category_id: p.category_id,
    name: p.name,
    description: p.description,
    base_price: Number(p.base_price),
    sell_price: Number(p.sell_price),
    image_url: p.image_url,
    is_active: p.is_active ?? true,
    product_categories: p.product_categories ? { name: p.product_categories.name } : null,
    product_stocks: (p.product_stocks || []).map((s: any) => ({ stock: s.stock, branch_id: s.branch_id })),
  }));

  const serializedBranches = rawBranches.map((b: any) => ({
    id: b.id,
    name: b.name,
    address: b.address,
    phone_number: b.phone_number,
    payment_qr: b.payment_qr,
  }));

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 pb-20 relative overflow-hidden">
      {/* Background Ambient */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/6 rounded-full blur-[100px]" />
      </div>

      {/* Hero */}
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
