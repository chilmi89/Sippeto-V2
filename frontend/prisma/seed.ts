import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Memulai proses seeding...');

    // 1. Pastikan Role 'Admin', 'UMKM', dan 'Owner' ada
    const adminRole = await prisma.roles.upsert({
        where: { name: 'Admin' },
        update: {},
        create: { name: 'Admin' },
    });

    const ownerRole = await prisma.roles.upsert({
        where: { name: 'owner' },
        update: {},
        create: { name: 'owner' },
    });

    console.log('✅ Roles berhasil disiapkan.');

    // 2. Buat Akun Admin Default
    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'sippeto2026';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const adminId = crypto.randomUUID();
    const admin = await prisma.profiles.upsert({
        where: { email: adminEmail },
        update: {
            password: hashedPassword,
            role_id: adminRole.id,
            is_active: true,
        },
        create: {
            id: adminId,
            full_name: 'Super Admin SiPetto',
            email: adminEmail,
            password: hashedPassword,
            role_id: adminRole.id,
            is_active: true,
            metadata: { "system": "master" }
        },
    });

    console.log('✅ Akun Admin berhasil dibuat/diperbarui:');
    console.log(`   - Email: ${adminEmail}`);
    console.log(`   - Password: ${adminPassword}`);
    console.log('🚀 Seeding selesai!');
}

main()
    .catch((e) => {
        console.error('❌ Gagal saat seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
