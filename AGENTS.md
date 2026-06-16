<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---
⚠️ **SiPetto Workspace Rules & Guidelines:**
Please read and follow the custom development guidelines, architecture rules, and feature roadmap documented in **[DEVELOPMENT.md](file:///home/syelha/Documents/SiPetto/DEVELOPMENT.md)** before performing database updates, routing changes, or UI modifications.

**PENTING (Gaya Teks & Input):**
- Selalu gunakan warna teks **hitam secara default** (`text-black` atau `text-zinc-900`) untuk semua input field, select dropdown, label, dan elemen formulir interaktif lainnya. Jangan pernah men-generate teks putih atau abu-abu yang terlalu pudar di atas latar belakang terang agar kontras dan keterbacaan teks selalu terjaga dengan baik.

**ATURAN BACKEND GO (TRANSISI API):**
- Wajib menggunakan arsitektur **per-fitur modular (feature-based)** di bawah `internal/modular/<fitur>/`.
- Setiap fitur wajib dipecah menjadi: `model_<fitur>`, `dto_<fitur>`, `repository_<fitur>`, `service_<fitur>`, `controller_<fitur>`, dan `router_<fitur>`.
- Inisialisasi rute dilakukan secara independen per fitur dan didaftarkan di `main.go` menggunakan dependency injection manual.
- Hubungkan database menggunakan **Bun ORM** dan validasi token JWT dengan `JWT_SECRET` yang sinkron dengan `.env` frontend.
- **Strategi Proxying (Hybrid Migration)**: Transisi dari Next.js API route ke Go backend wajib dilakukan secara bertahap dengan memproksi rute Next.js lama (mem-forward request via `fetch` ke port `8080` dan meneruskan token `Authorization: Bearer <token>`) demi kestabilan frontend.
- **Sintaksis SQL**: Fokus pada query SQL raw/query builder eksplisit (`db.NewRaw()` atau `db.QueryContext()`) untuk `SELECT`, `INSERT`, `UPDATE`, `DELETE`, hindari ORM relation builders bawaan yang rumit.
- **JWT Extraction**: Controller/Middleware Go wajib dapat membaca token dari cookie `token` maupun header `Authorization: Bearer <token>`.

**ALUR KERJA MIGRASI PENUH (END-TO-END TRANSITION):**
1. **Implementasi API Golang**: Bangun fitur API di backend Golang terlebih dahulu mengikuti struktur modular di atas.
2. **Setup Proxy Rewrite**: Tambahkan rule rewrite di `next.config.ts` agar request `/api/backend/<fitur>` langsung diarahkan ke `http://localhost:8080/api/<fitur>`.
3. **Hapus API Next.js Lama**: Hapus total folder API Next.js yang sudah dimigrasi (misal: `src/app/api/backend/<fitur>/`).
4. **Buat Server Actions**: Buat file action baru di `src/app/actions/<fitur>.ts` untuk membungkus komunikasi fetch ke backend Golang. Ambil cookie `token` dari `cookies()` Next.js dan masukkan ke header `Authorization: Bearer <token>`.
5. **Refaktor Halaman UI**: Hubungkan halaman UI (`page.tsx` terkait) dengan Server Actions yang baru dibuat untuk memicu aksi database/API.
6. **Optimasi UI (Tanpa Loader Memblokir)**: Selalu hilangkan visual loader animatif yang memblokir layar (`FullPageLoader`, `SectionLoader`, dll.). Render data langsung atau tampilkan error/kosong secara instan agar user experience terasa cepat.



