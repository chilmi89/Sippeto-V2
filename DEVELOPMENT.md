# 🧠 PANDUAN PENGEMBANGAN & ATURAN WORKSPACE (SiPetto)

Dokumen ini berfungsi sebagai instruksi kerja dan panduan aturan bagi developer/AI Agent di masa depan untuk melanjutkan pengembangan sistem **SiPetto** (Sistem Informasi Keuangan & Katalog Online UMKM).

---

## 1. STRUKTUR WORKSPACE & TEKNOLOGI STACK

*   **Framework Utama:** Next.js (App Router)
*   **Styling:** Tailwind CSS & Lucide Icons
*   **Database ORM:** Prisma Client (`src/generated/prisma`)
*   **Backend Engine:** Golang (Gin Framework) dengan PostgreSQL (Bun ORM)
*   **Autentikasi:** JWT (dikelola via middleware di Golang)

### 📂 Pembagian Rute & Folder Utama:
*   `src/app/backend/admin/` : Halaman dashboard untuk Super Admin/Owner SiPetto (monitoring server, tenant, dan transaksi global).
*   `src/app/backend/tenant/` : Halaman dashboard untuk masing-masing UMKM/Tenant (kelola keuangan, cabang, transaksi internal, dan kelak produk).
*   `src/app/store/[username]` : (Rencana depan) Halaman katalog online publik yang bisa diakses pembeli tanpa login.
*   `src/app/api/` : API endpoints untuk backend, diletakkan terstruktur sesuai perannya.
*   `prisma/schema.prisma` : File definisi skema Prisma untuk sinkronisasi client.

---

## 2. ATURAN PENGEMBANGAN (DEVELOPMENT RULES)

### 🔒 Keamanan Database
1.  **Isolasi Data Tenant:** Setiap tabel yang berisi data spesifik milik tenant (seperti transaksi, kategori, cabang, dan produk) wajib memiliki kolom `profile_id` yang terhubung ke `profiles(id)`.
2.  **Akses Data:** Tenant hanya boleh melihat/mengubah data miliknya sendiri. Pengunjung umum (publik) hanya boleh membaca data tertentu seperti katalog produk aktif.

### 🗄️ Manajemen Skema Database
1.  **Dilarang Melakukan Destructive Migrate:** Jangan jalankan `npx prisma migrate dev` atau `--force` yang dapat menghapus database produksi/development yang aktif.
2.  **Alur Sinkronisasi yang Benar:**
    *   Jalankan SQL tabel/perubahan baru melalui **Supabase SQL Editor**.
    *   Tarik skema database terbaru ke lokal dengan:
        ```bash
        npx prisma db pull
        ```
    *   Generate ulang client Prisma dengan:
        ```bash
        npx prisma generate
        ```

### 💬 Keamanan & Privasi E-Catalog WA Order
1.  **Sembunyikan Nomor WA Tenant:** Jangan memaparkan nomor WhatsApp tenant secara mentah dalam HTML frontend (seperti `<a href="https://wa.me/...">`). Gunakan API Route Redirect di sisi server untuk mengalihkan pembeli secara dinamis ke WhatsApp API.
2.  **Proteksi Formulir (Anti-Spam):** Tambahkan validasi sisi server dan teknik **Honeypot** (input tersembunyi yang mendeteksi bot pengisi form) untuk memblokir spam bot pembuat pesanan palsu.

---

## 3. ARSITEKTUR & ATURAN TRANSISI BACKEND GOLANG

Untuk melakukan transisi dari Next.js API Routes ke Go Backend secara bertahap dan terstruktur, developer/AI Agent wajib mematuhi aturan arsitektur berikut:

### 📂 Aturan Struktur Folder Per-Fitur (Feature-Based Modular)
Setiap penambahan fitur baru di backend Go harus ditempatkan di dalam folder mandiri per-fitur di bawah direktori `internal/modular/<fitur>/`. Contoh untuk fitur `role`:
1.  **`model_<fitur>`** (Contoh: `model_role`): Menyimpan struct Bun ORM yang merepresentasikan tabel PostgreSQL.
2.  **`dto_<fitur>`** (Contoh: `dto_role`): Menyimpan payload request/response (Data Transfer Object) dalam format JSON.
3.  **`repository_<fitur>`** (Contoh: `repository_role`): Berisi interface dan implementasi query SQL menggunakan Bun ORM dengan memprioritaskan SQL syntax raw.
4.  **`service_<fitur>`** (Contoh: `service_role`): Berisi logika bisnis utama yang memanggil repository dan mengembalikan DTO.
5.  **`controller_<fitur>`** (Contoh: `controller_role`): Handler HTTP Gin yang memproses request payload, memanggil service, dan mengirimkan HTTP response secara minimalis tanpa validasi yang kompleks.
6.  **`router_<fitur>`** (Contoh: `router_role`): Setup routing group Gin (seperti `/api/...`) dan menyuntikkan (dependency injection) controller, service, dan repository terkait.

### 🔌 Panduan Migrasi Penuh & Larangan Keras Prisma
1.  **Dilarang Keras Impor Prisma di Frontend:** Seluruh folder frontend (seperti `src/app/actions/*` atau UI components) tidak boleh mengimpor `@/lib/prisma` atau menggunakan Prisma client langsung untuk manipulasi/pembacaan database.
2.  **Transisi Penuh ke Golang API:** Pindahkan semua kode query database ke backend Golang, dan ubah Server Actions di frontend agar memanggil endpoint backend Golang menggunakan `fetch` (meneruskan token cookie via header `Authorization: Bearer <token>`).
3.  **Hapus API Routes Lama:** Setelah sebuah API Route Next.js dipindahkan ke Golang backend, hapus folder rute tersebut secara total dari `src/app/api/backend/` untuk mencegah kebingungan kode.

### 🗄️ Aturan Penulisan Query SQL di Go
1.  **Gunakan Raw SQL Syntax**: Sesuai dengan aturan proyek, hindari penggunaan ORM relations builders yang rumit. Gunakan `db.NewRaw()` atau `db.QueryContext()` untuk mengeksekusi sintaksis `SELECT`, `INSERT`, `UPDATE`, dan `DELETE` secara eksplisit agar query mudah dibaca dan dioptimalkan.
2.  **Session Replication untuk Restore/Testing**: Saat melakukan testing/impor massal data relasional melingkar (circular constraints) di lokal, jalankan perintah dalam sesi `SET session_replication_role = 'replica';` untuk menonaktifkan trigger/constraint asing sementara.

### 🛡️ Kredensial & Autentikasi (JWT)
*   Gunakan variabel `DATABASE_URL` dari file `.env` untuk inisialisasi koneksi Bun ORM.
*   Pemeriksaan token JWT di Go Backend harus divalidasi menggunakan `JWT_SECRET` yang dibagikan dari file `.env` yang sama dengan Next.js frontend untuk menjamin keselarasan session login.
*   Middleware Go harus dapat membaca token baik dari header `Authorization: Bearer <token>` maupun dari cookie `token`.

---

## 🎯 RANCANGAN ROADMAP EKSEKUSI PROGRAM

### FASE 1: MASTER DATA, MULTI-CABANG, & BACKEND PRODUK
- [ ] **Skema Database (Pusat & Cabang):**
  - [ ] Buat tabel master `products` di database PostgreSQL (menghubungkan ke `profiles` dan `categories`).
  - [ ] Buat tabel `product_stocks` untuk melacak stok fisik produk per masing-masing cabang (`branches`).
  - [ ] Buat tabel `stock_mutations` untuk mencatat riwayat transfer stok antar-cabang, restock, maupun penyesuaian stok.
  - [ ] Perbarui tabel existing `profiles` dengan menambahkan kolom `username` (untuk subdomain/katalog publik).
  - [ ] Perbarui tabel existing `transaction_items` dengan menambahkan kolom `product_id` dan `quantity`.
- [ ] **Sinkronisasi Kode:**
  - [ ] Jalankan `npx prisma db pull` dan `npx prisma generate` untuk memperbarui tipe data ORM di project lokal.
- [ ] **Rute API CRUD:**
  - [ ] Buat API CRUD produk di `/api/backend/tenant/products` (khusus data produk tingkat pusat/owner).
  - [ ] Buat API alokasi & mutasi stok di `/api/backend/tenant/stocks` (untuk transfer barang antar cabang dan manajemen stok masuk/keluar).
  - [ ] Hubungkan unggah gambar produk ke MinIO Storage.

### FASE 2: DASHBOARD MANAGEMENT & POS INTEGRASI MULTI-CABANG
- [ ] **UI Kelola Produk & Cabang:**
  - [ ] Buat halaman UI Kelola Produk di dashboard tenant (`/backend/tenant/products`).
  - [ ] Tambahkan modal form tambah/edit produk dengan pilihan kategori dan harga dasar/jual.
  - [ ] Tambahkan UI Kelola Stok per Cabang di dashboard tenant untuk melihat distribusi stok di masing-masing cabang.
- [ ] **Transaksi POS (Kasir) & Auto-Deduct Stock:**
  - [ ] Modifikasi transaksi POS (kasir) agar menarik data produk dari tabel `products` berdasarkan stok cabang aktif (`product_stocks` milik cabang saat ini).
  - [ ] Implementasikan auto-deduct stock (pengurangan stok otomatis) pada tabel `product_stocks` sesuai dengan cabang (`branch_id`) tempat transaksi POS tersebut berhasil dibuat.
  - [ ] Buat log mutasi stok otomatis bertipe `SALE` di `stock_mutations` setiap kali transaksi kasir berhasil diselesaikan.

### FASE 3: ETALASE KATALOG PUBLIK MULTI-TENANT
- [ ] Buat rute publik `/store/[username]` bebas autentikasi (menggunakan kolom `username` dari profil tenant).
- [ ] Desain antarmuka etalase toko yang responsive (mobile-first), menampilkan produk aktif (`is_active = true`), harga, deskripsi, dan info ketersediaan stok di cabang utama.
- [ ] Bangun keranjang belanja lokal di frontend menggunakan browser LocalStorage.

### FASE 4: CHECKOUT FORM & REDIRECT WHATSAPP
- [ ] Tambahkan form data diri pemesan (Nama, Alamat, Jenis Pembayaran).
- [ ] Terapkan validasi input dan deteksi bot Honeypot.
- [ ] Buat secure redirect API ke WhatsApp yang menyusun pesan daftar belanjaan pelanggan secara otomatis dan mengirimkannya langsung ke nomor telepon tenant (`profiles.phone_number`).

### FASE 5: INTEGRASI CHECKOUT SEMI-OTOMATIS & KONFIRMASI ADMIN
- [ ] **Skema Database Pesanan (Orders):**
  - [ ] Buat tabel `orders` di PostgreSQL untuk menampung data pesanan masuk dari E-Catalog sebelum dikonfirmasi (kolom: id, profile_id, branch_id, reference_number, customer_name, customer_phone, customer_address, payment_method, total_price, status ['PENDING', 'SUCCESS', 'CANCELLED']).
  - [ ] Buat tabel `order_items` untuk detail produk belanjaan (kolom: id, order_id, product_id, quantity, price).
- [ ] **API Endpoint Simpan Pesanan:**
  - [ ] Buat API Route `/api/store/checkout` untuk mencatat pesanan baru berstatus `PENDING` di database pada saat pembeli melakukan checkout dari etalase toko.
- [ ] **Dashboard Kelola Pesanan & Auto-Record Keuangan:**
  - [ ] Buat antarmuka Kelola Pesanan di rute `/backend/tenant/orders` untuk melihat daftar pesanan masuk yang sedang dikonsultasikan di WA.
  - [ ] Implementasikan tombol aksi **"Konfirmasi Lunas"** yang memicu rangkaian otomasi:
    - [ ] Mengubah status pesanan menjadi `SUCCESS`.
    - [ ] Memotong stok fisik pada tabel `product_stocks` sesuai cabang yang melayani.
    - [ ] Mencatat log mutasi stok bertipe `SALE` pada tabel `stock_mutations`.
    - [ ] Membuat laporan keuangan masuk (`INCOME`) secara otomatis pada tabel `transaction_groups` dan `transaction_items` kategori penjualan produk.

