@echo off
title MinIO Server (Sippeto Local)
set MINIO_ROOT_USER=sippeto_admin
set MINIO_ROOT_PASSWORD=sippetosucces2026

echo Starting MinIO Server for Sippeto V2...
echo API:      http://localhost:9000
echo Console:  http://localhost:9090
echo User:     sippeto_admin
echo.

minio.exe server "%~dp0minio-data" --address ":9000" --console-address ":9090"
pause
