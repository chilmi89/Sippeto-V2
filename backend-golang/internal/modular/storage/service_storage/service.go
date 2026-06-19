package service_storage

import (
	"context"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/url"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"backend-golang/internal/modular/storage/dto_storage"
	"backend-golang/internal/modular/storage/repository_storage"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type StorageService interface {
	UploadFile(ctx context.Context, file *multipart.FileHeader, bucketType string, name string, tenant string) (*dto_storage.UploadResponse, error)
	DeleteFile(ctx context.Context, fileURL string) error
	GetFile(ctx context.Context, bucketName, objectName string) (io.ReadCloser, minio.ObjectInfo, error)
}

type storageService struct {
	repo          repository_storage.StorageRepository
	minioClient   *minio.Client
	productBucket string
	profileBucket string
	endpoint      string
	useSSL        bool
	publicURL     string
}

func NewStorageService(repo repository_storage.StorageRepository) StorageService {
	endpoint := os.Getenv("MINIO_ENDPOINT")
	accessKeyID := os.Getenv("MINIO_ACCESS_KEY")
	secretAccessKey := os.Getenv("MINIO_SECRET_KEY")
	useSSLStr := os.Getenv("MINIO_USE_SSL")
	productBucket := os.Getenv("MINIO_PRODUCT_BUCKET")
	profileBucket := os.Getenv("MINIO_PROFILE_BUCKET")
	publicURL := os.Getenv("MINIO_PUBLIC_URL")

	if endpoint == "" {
		endpoint = "localhost:9000"
	}
	if productBucket == "" {
		productBucket = "sippeto-product"
	}
	if profileBucket == "" {
		profileBucket = "sippeto-profile"
	}

	if accessKeyID == "" || secretAccessKey == "" {
		log.Println("Peringatan: MINIO_ACCESS_KEY atau MINIO_SECRET_KEY tidak diset — MinIO tidak akan berfungsi")
	}

	useSSL := false
	if b, err := strconv.ParseBool(useSSLStr); err == nil {
		useSSL = b
	}

	// Inisialisasi Klien MinIO
	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		log.Printf("Peringatan: Gagal inisialisasi MinIO client: %v\n", err)
	} else {
		log.Println("Berhasil inisialisasi MinIO client!")

		// Cek dan buat kedua bucket secara otomatis
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		buckets := []string{productBucket, profileBucket}
		for _, bucket := range buckets {
			exists, err := client.BucketExists(ctx, bucket)
			if err != nil {
				log.Printf("Peringatan: Gagal memeriksa keberadaan bucket MinIO '%s': %v\n", bucket, err)
				continue
			}
			if !exists {
				err = client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{})
				if err != nil {
					log.Printf("Gagal membuat bucket MinIO '%s': %v\n", bucket, err)
					continue
				}
				log.Printf("Bucket MinIO '%s' berhasil dibuat!\n", bucket)

				// Setel policy bucket ke Public Read secara otomatis
				policy := fmt.Sprintf(`{
					"Version": "2012-10-17",
					"Statement": [
						{
							"Effect": "Allow",
							"Principal": {"AWS": ["*"]},
							"Action": ["s3:GetObject"],
							"Resource": ["arn:aws:s3:::%s/*"]
						}
					]
				}`, bucket)

				err = client.SetBucketPolicy(ctx, bucket, policy)
				if err != nil {
					log.Printf("Peringatan: Gagal menetapkan policy Public Read pada bucket MinIO '%s': %v\n", bucket, err)
				} else {
					log.Printf("Policy Public Read berhasil diterapkan pada bucket MinIO '%s'!\n", bucket)
				}
			}
		}
	}

	return &storageService{
		repo:          repo,
		minioClient:   client,
		productBucket: productBucket,
		profileBucket: profileBucket,
		endpoint:      endpoint,
		useSSL:        useSSL,
		publicURL:     publicURL,
	}
}

// detectContentType mendeteksi tipe konten berdasarkan magic bytes
func detectContentType(buf []byte) string {
	if len(buf) < 12 {
		return "application/octet-stream"
	}
	// JPEG: starts with FF D8 FF
	if len(buf) >= 3 && buf[0] == 0xFF && buf[1] == 0xD8 && buf[2] == 0xFF {
		return "image/jpeg"
	}
	// PNG: starts with 89 50 4E 47
	if len(buf) >= 4 && buf[0] == 0x89 && buf[1] == 0x50 && buf[2] == 0x4E && buf[3] == 0x47 {
		return "image/png"
	}
	// GIF: starts with GIF87a or GIF89a
	if len(buf) >= 6 && buf[0] == 0x47 && buf[1] == 0x49 && buf[2] == 0x46 && (buf[3] == 0x38) && (buf[4] == 0x37 || buf[4] == 0x39) && buf[5] == 0x61 {
		return "image/gif"
	}
	// WEBP: RIFF + WEBP
	if len(buf) >= 12 && string(buf[0:4]) == "RIFF" && string(buf[8:12]) == "WEBP" {
		return "image/webp"
	}
	return "application/octet-stream"
}

// sanitizeFilename membersihkan string untuk digunakan sebagai bagian dari object name
func sanitizeFilename(s string) string {
	if s == "" {
		return ""
	}
	// Lowercase, ganti spasi dengan hyphens
	s = strings.ToLower(s)
	s = strings.ReplaceAll(s, " ", "-")
	// Hanya izinkan alfanumerik dan hyphen
	reg := regexp.MustCompile(`[^a-z0-9-]`)
	s = reg.ReplaceAllString(s, "")
	// Hapus multiple consecutive hyphens
	reg = regexp.MustCompile(`-+`)
	s = reg.ReplaceAllString(s, "-")
	// Potong max 50 karakter
	if len(s) > 50 {
		s = s[:50]
	}
	// Hapus leading/trailing hyphens
	s = strings.Trim(s, "-")
	return s
}

func (s *storageService) UploadFile(ctx context.Context, file *multipart.FileHeader, bucketType string, name string, tenant string) (*dto_storage.UploadResponse, error) {
	if s.minioClient == nil {
		return nil, fmt.Errorf("klien minio belum terinisialisasi")
	}

	maxSize := int64(5 * 1024 * 1024)
	if bucketType == "profile" {
		maxSize = int64(2 * 1024 * 1024)
	}

	if file.Size > maxSize {
		return nil, fmt.Errorf("ukuran file terlalu besar (maks %d MB)", maxSize/(1024*1024))
	}

	bucketName := s.productBucket
	if bucketType == "profile" {
		bucketName = s.profileBucket
	}

	src, err := file.Open()
	if err != nil {
		return nil, fmt.Errorf("gagal membuka berkas: %w", err)
	}
	defer src.Close()

	// Validasi magic bytes untuk mendeteksi tipe file sebenarnya
	magicBuf := make([]byte, 512)
	_, err = src.Read(magicBuf)
	if err != nil && err != io.EOF {
		return nil, fmt.Errorf("gagal membaca berkas: %w", err)
	}
	_, err = src.Seek(0, io.SeekStart)
	if err != nil {
		return nil, fmt.Errorf("gagal mereset posisi berkas: %w", err)
	}

	detectedContentType := detectContentType(magicBuf)
	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/gif":  true,
		"image/webp": true,
	}
	if !allowedTypes[detectedContentType] {
		return nil, fmt.Errorf("tipe file tidak diizinkan: %s", detectedContentType)
	}

	// Ekstrak ekstensi file
	ext := ""
	for i := len(file.Filename) - 1; i >= 0; i-- {
		if file.Filename[i] == '.' {
			ext = file.Filename[i:]
			break
		}
	}
	if ext == "" {
		ext = ".jpg"
	}

	// Bangun nama objek yang informatif
	prefix := bucketType
	safeName := sanitizeFilename(name)
	safeTenant := sanitizeFilename(tenant)
	timePart := time.Now().Format("20060102")
	randomPart := fmt.Sprintf("%x", time.Now().UnixNano())[8:14]

	parts := []string{prefix}
	if safeName != "" {
		parts = append(parts, safeName)
	}
	if safeTenant != "" {
		parts = append(parts, safeTenant)
	}
	parts = append(parts, timePart, randomPart)
	objectName := fmt.Sprintf("%s%s", strings.Join(parts, "-"), ext)

	if detectedContentType == "" {
		detectedContentType = "application/octet-stream"
	}

	// Mengunggah berkas ke MinIO ke bucket yang terpilih
	_, err = s.minioClient.PutObject(ctx, bucketName, objectName, src, file.Size, minio.PutObjectOptions{
		ContentType: detectedContentType,
	})
	if err != nil {
		return nil, fmt.Errorf("gagal mengunggah berkas ke MinIO (bucket: %s): %w", bucketName, err)
	}

	// Membuat URL akses publik berkas
	var fileURL string
	if s.publicURL != "" {
		fileURL = fmt.Sprintf("%s/%s/%s", strings.TrimSuffix(s.publicURL, "/"), bucketName, objectName)
	} else {
		scheme := "http"
		if s.useSSL {
			scheme = "https"
		}
		fileURL = fmt.Sprintf("%s://%s/%s/%s", scheme, s.endpoint, bucketName, objectName)
	}

	return &dto_storage.UploadResponse{
		URL:      fileURL,
		FileName: objectName,
		Size:     file.Size,
		MimeType: detectedContentType,
	}, nil
}

func (s *storageService) DeleteFile(ctx context.Context, fileURL string) error {
	if s.minioClient == nil {
		return fmt.Errorf("klien minio belum terinisialisasi")
	}
	if fileURL == "" {
		return nil
	}

	// Parse URL untuk mengekstrak bucket dan object name
	// Format URL: http(s)://<endpoint>/<bucket>/<objectName>
	parsed, err := url.Parse(fileURL)
	if err != nil {
		return fmt.Errorf("gagal parse URL: %w", err)
	}

	// Path akan berupa /<bucket>/<objectName>
	path := strings.TrimPrefix(parsed.Path, "/")
	parts := strings.SplitN(path, "/", 2)
	if len(parts) < 2 {
		return fmt.Errorf("format URL storage tidak valid: %s", fileURL)
	}

	bucketName := parts[0]
	objectName := parts[1]

	err = s.minioClient.RemoveObject(ctx, bucketName, objectName, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("gagal menghapus berkas dari MinIO: %w", err)
	}

	return nil
}

func (s *storageService) GetFile(ctx context.Context, bucketName, objectName string) (io.ReadCloser, minio.ObjectInfo, error) {
	if s.minioClient == nil {
		return nil, minio.ObjectInfo{}, fmt.Errorf("klien minio belum terinisialisasi")
	}

	object, err := s.minioClient.GetObject(ctx, bucketName, objectName, minio.GetObjectOptions{})
	if err != nil {
		return nil, minio.ObjectInfo{}, err
	}

	stat, err := object.Stat()
	if err != nil {
		object.Close()
		return nil, minio.ObjectInfo{}, err
	}

	return object, stat, nil
}

