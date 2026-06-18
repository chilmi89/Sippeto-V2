package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	"backend-golang/internal/db"

	"github.com/joho/godotenv"
)

const supabaseDomain = "qdlxxwalojyclmsovzmy.supabase.co"

type colTarget struct {
	Table  string
	Column string
	Bucket string
}

var targets = []colTarget{
	{Table: "profiles", Column: "avatar_url", Bucket: "sippeto-profile"},
	{Table: "profiles", Column: "banner_url", Bucket: "sippeto-profile"},
	{Table: "profiles", Column: "payment_qr", Bucket: "sippeto-product"},
	{Table: "products", Column: "image_url", Bucket: "sippeto-product"},
	{Table: "branches", Column: "payment_qr", Bucket: "sippeto-product"},
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: No .env file found")
	}

	endpoint := os.Getenv("MINIO_ENDPOINT")
	if endpoint == "" {
		endpoint = "localhost:9000"
	}

	bunDB, err := db.InitDB()
	if err != nil {
		log.Fatalf("Failed to connect database: %v", err)
	}
	defer bunDB.Close()

	// Gunakan Bun Raw query dengan placeholder ?
	total := 0
	like := "%" + supabaseDomain + "%"

	for _, t := range targets {
		// SELECT rows with Supabase URLs
		selQuery := fmt.Sprintf("SELECT id, %s FROM %s WHERE %s LIKE ?", t.Column, t.Table, t.Column)
		rows, err := bunDB.Query(selQuery, like)
		if err != nil {
			log.Printf("Error querying %s.%s: %v", t.Table, t.Column, err)
			continue
		}

		var ids, urls []string
		for rows.Next() {
			var id, url string
			if err := rows.Scan(&id, &url); err != nil {
				continue
			}
			ids = append(ids, id)
			urls = append(urls, url)
		}
		rows.Close()

		if len(ids) == 0 {
			continue
		}

		log.Printf("Found %d Supabase URLs in %s.%s", len(ids), t.Table, t.Column)

		for i, id := range ids {
			oldURL := urls[i]
			filename := extractFilename(oldURL)
			if filename == "" {
				log.Printf("  ⚠ %s.%s id=%s: can't extract filename", t.Table, t.Column, id)
				continue
			}
			newURL := fmt.Sprintf("http://%s/%s/%s", endpoint, t.Bucket, filename)
			_, err := bunDB.Exec(
				fmt.Sprintf("UPDATE %s SET %s = ? WHERE id = ?", t.Table, t.Column),
				newURL, id)
			if err != nil {
				log.Printf("  ✗ %s.%s id=%s: %v", t.Table, t.Column, id, err)
				continue
			}
			log.Printf("  ✓ %s id=%s → %s", t.Column, id, newURL)
			total++
		}
	}

	log.Printf("\n✅ Done! %d URLs migrated to MinIO.", total)
}

func extractFilename(url string) string {
	parts := strings.Split(url, "/")
	return parts[len(parts)-1]
}
