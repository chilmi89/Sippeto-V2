import { PrismaClient } from "../src/generated/prisma";
import dotenv from "dotenv";
import path from "path";

// Memuat .env dari root frontend
dotenv.config({ path: path.join(__dirname, "../.env") });

const supabaseUrl = process.env.DIRECT_URL;
const localUrl = "postgresql://postgres:chilmi2003@localhost:5432/sippeto-db-v2";

if (!supabaseUrl) {
  console.error("❌ Error: DIRECT_URL tidak ditemukan di .env");
  process.exit(1);
}

const supabasePrisma = new PrismaClient({
  datasources: { db: { url: supabaseUrl } },
});

const localPrisma = new PrismaClient({
  datasources: { db: { url: localUrl } },
});

// Daftar tabel dalam skema public untuk disinkronisasi
const tables = [
  "roles",
  "permissions",
  "role_permissions",
  "profiles",
  "branches",
  "categories",
  "payment_methods",
  "product_categories",
  "products",
  "product_stocks",
  "stock_mutations",
  "transaction_groups",
  "transaction_items",
  "transaction_attachments",
  "orders",
  "order_items",
];

async function sync() {
  console.log("⏳ Menghubungkan ke database...");

  try {
    // Jalankan seluruh operasi dalam satu transaksi agar menggunakan koneksi database lokal yang sama
    await localPrisma.$transaction(async (tx) => {
      // Nonaktifkan semua constraint & trigger sementara di database lokal
      await tx.$executeRawUnsafe("SET session_replication_role = 'replica';");
      console.log("✅ Triggers & constraints dinonaktifkan sementara di database lokal.");

      for (const table of tables) {
        console.log(`\n📦 Menyinkronkan tabel: ${table}...`);

        // 1. Ambil data dari Supabase
        const rows: any[] = await supabasePrisma.$queryRawUnsafe(`SELECT * FROM public."${table}"`);
        console.log(`   Ditemukan ${rows.length} baris data di Supabase.`);

        // 2. Bersihkan data lama di lokal
        await tx.$executeRawUnsafe(`TRUNCATE TABLE public."${table}" CASCADE`);
        
        if (rows.length === 0) {
          continue;
        }

        // 3. Masukkan data ke database lokal
        for (const row of rows) {
          const columns = Object.keys(row);
          const values = Object.values(row);

          const columnsStr = columns.map(c => `"${c}"`).join(", ");
          
          const formattedValues = values.map(val => {
            if (val === null || val === undefined) {
              return "NULL";
            }
            if (typeof val === "string") {
              return `'${val.replace(/'/g, "''")}'`;
            }
            if (typeof val === "number" || typeof val === "boolean") {
              return val.toString();
            }
            if (typeof val === "object") {
              if (val instanceof Date) {
                return `'${val.toISOString()}'`;
              }
              // Cek jika ini adalah Decimal dari Prisma
              if (val.constructor && (val.constructor.name === "Decimal" || typeof (val as any).toNumber === "function")) {
                return val.toString();
              }
              return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            }
            return `'${val.toString().replace(/'/g, "''")}'`;
          });

          const insertQuery = `INSERT INTO public."${table}" (${columnsStr}) VALUES (${formattedValues.join(", ")})`;
          await tx.$executeRawUnsafe(insertQuery);
        }
        console.log(`   ✅ Berhasil memindahkan ${rows.length} baris ke lokal.`);
      }
      
      // Kembalikan status session ke origin sebelum commit transaksi selesai
      await tx.$executeRawUnsafe("SET session_replication_role = 'origin';");
      console.log("✅ Triggers & constraints diaktifkan kembali di database lokal.");
    }, {
      timeout: 120000 // Batas waktu transaksi 2 menit untuk transfer data
    });
    
    console.log("\n🎉 SELURUH DATA BERHASIL DISINKRONISASI!");
  } catch (error) {
    console.error("❌ Terjadi kesalahan saat sinkronisasi data:", error);
  } finally {
    await supabasePrisma.$disconnect();
    await localPrisma.$disconnect();
  }
}

sync();
