import { PrismaClient } from '../src/generated/prisma/index';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Memulai proses seeding kategori...');

    // 1. Dapatkan Profile Admin sebagai Pemilik Kategori Master
    const admin = await prisma.profiles.findUnique({
        where: { email: 'admin@gmail.com' }
    });

    if (!admin) {
        console.error('❌ Error: Akun admin@gmail.com tidak ditemukan.');
        console.log('💡 Tip: Jalankan "npx prisma db seed" terlebih dahulu untuk membuat akun admin.');
        return;
    }

    const adminId = admin.id;

    // 2. Data Kategori Pemasukan & Pengeluaran
    const defaultCategories = [
        // Pemasukan
        { name: 'Penjualan Produk', type: 'pemasukan' },
        { name: 'Layanan Jasa', type: 'pemasukan' },
        { name: 'Pendapatan Lainnya', type: 'pemasukan' },
        
        // Pengeluaran
        { name: 'Biaya Operasional', type: 'pengeluaran' },
        { name: 'Pembelian Stok', type: 'pengeluaran' },
        { name: 'Sewa Tempat', type: 'pengeluaran' },
        { name: 'Gaji Karyawan', type: 'pengeluaran' },
        { name: 'Pajak', type: 'pengeluaran' },
        { name: 'Listrik & Air', type: 'pengeluaran' },
    ];

    console.log(`📦 Seeding ${defaultCategories.length} kategori...`);

    for (const cat of defaultCategories) {
        await prisma.categories.upsert({
            where: {
                profile_id_name_type: {
                    profile_id: adminId,
                    name: cat.name,
                    type: cat.type
                }
            },
            update: {},
            create: {
                profile_id: adminId,
                name: cat.name,
                type: cat.type
            }
        });
    }

    // 3. Seed Metode Pembayaran
    const defaultPayments = ['Tunai', 'Transfer', 'E-Wallet', 'QRIS'];
    console.log(`💳 Seeding ${defaultPayments.length} metode pembayaran...`);
    
    for (const pay of defaultPayments) {
        await prisma.payment_methods.upsert({
            where: {
                profile_id_name: {
                    profile_id: adminId,
                    name: pay
                }
            },
            update: { is_active: true },
            create: {
                profile_id: adminId,
                name: pay,
                is_active: true
            }
        });
    }

    console.log('✅ Seeding kategori dan metode pembayaran selesai!');
}

main()
    .catch((e) => {
        console.error('❌ Gagal saat seeding category:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

