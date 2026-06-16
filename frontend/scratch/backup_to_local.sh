#!/bin/bash

# =========================================================================
# SCRIPT BACKUP SUPABASE KE POSTGRESQL LOKAL (SiPetto)
# =========================================================================

# Menentukan lokasi file .env (satu tingkat di atas folder scratch)
ENV_FILE="../.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: File .env tidak ditemukan di $ENV_FILE"
    echo "Pastikan Anda menjalankan script ini dari folder 'frontend/scratch/'"
    exit 1
fi

# Membaca DIRECT_URL dari file .env
# Menghapus tanda kutip jika ada
DIRECT_URL=$(grep -E "^DIRECT_URL=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$DIRECT_URL" ]; then
    echo "❌ Error: DIRECT_URL tidak ditemukan di file .env"
    exit 1
fi

# Konfigurasi Lokal
DEFAULT_LOCAL_DB="sipetto_local"
DEFAULT_LOCAL_USER="postgres"

echo "=== Konfigurasi PostgreSQL Lokal ==="
read -p "Masukkan nama database lokal [$DEFAULT_LOCAL_DB]: " LOCAL_DB
LOCAL_DB=${LOCAL_DB:-$DEFAULT_LOCAL_DB}

read -p "Masukkan username PostgreSQL lokal [$DEFAULT_LOCAL_USER]: " LOCAL_USER
LOCAL_USER=${LOCAL_USER:-$DEFAULT_LOCAL_USER}

TEMP_BACKUP_FILE="supabase_temp_backup.sql"

echo ""
echo "⏳ 1. Mengekspor schema 'public' dan data dari Supabase..."
# pg_dump menggunakan DIRECT_URL
pg_dump -d "$DIRECT_URL" \
  --schema=public \
  --clean \
  --if-exists \
  -F p \
  -f "$TEMP_BACKUP_FILE"

if [ $? -ne 0 ]; then
    echo "❌ Gagal mengekspor data dari Supabase. Periksa koneksi internet dan kredensial Anda."
    exit 1
fi
echo "✅ Ekspor selesai. File cadangan sementara disimpan di $TEMP_BACKUP_FILE"

echo ""
echo "⏳ 2. Membuat database lokal '$LOCAL_DB' jika belum ada..."
# Membuat database lokal
pg_isready -h localhost -U "$LOCAL_USER" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Layanan PostgreSQL lokal tidak berjalan atau user '$LOCAL_USER' tidak sah."
    echo "Bersihkan file sementara..."
    rm -f "$TEMP_BACKUP_FILE"
    exit 1
fi

# Mencoba membuat database jika belum ada
psql -h localhost -U "$LOCAL_USER" -c "CREATE DATABASE \"$LOCAL_DB\";" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Database baru '$LOCAL_DB' berhasil dibuat."
else
    echo "ℹ️ Database '$LOCAL_DB' sudah ada. Proses restore akan menimpa data lama."
fi

echo ""
echo "⏳ 3. Mengimpor skema dan data ke PostgreSQL lokal '$LOCAL_DB'..."
# Melakukan restore ke lokal
psql -h localhost -U "$LOCAL_USER" -d "$LOCAL_DB" -f "$TEMP_BACKUP_FILE"

if [ $? -ne 0 ]; then
    echo "❌ Gagal mengimpor data ke PostgreSQL lokal."
    rm -f "$TEMP_BACKUP_FILE"
    exit 1
fi

echo ""
echo "⏳ 4. Membersihkan file cadangan sementara..."
rm -f "$TEMP_BACKUP_FILE"

echo "========================================================================="
echo "🎉 PROSES BACKUP & RESTORE SELESAI!"
echo "Database Supabase berhasil disinkronkan ke PostgreSQL lokal '$LOCAL_DB'."
echo "========================================================================="
