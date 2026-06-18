#!/bin/bash

# Pastikan Docker berjalan
if ! docker info >/dev/null 2>&1; then
    echo "Error: Docker daemon tidak berjalan. Jalankan Docker terlebih dahulu."
    exit 1
fi

echo "Memulai MinIO container..."

# Hapus container lama jika ada dengan nama yang sama
docker rm -f minio-server >/dev/null 2>&1

# Jalankan container MinIO baru
docker run -d \
  --name minio-server \
  -p 9000:9000 \
  -p 9001:9001 \
  -v minio_data:/data \
  -e "MINIO_ROOT_USER=sippeto_admin" \
  -e "MINIO_ROOT_PASSWORD=sippetosucces2026" \
  --restart unless-stopped \
  minio/minio server /data --console-address ":9001"

echo "MinIO container berhasil dijalankan!"
echo "API Endpoint     : http://localhost:9000"
echo "Console (Web GUI): http://localhost:9001"
echo "Username         : sippeto_admin"
echo "Password         : sippetosucces2026"
