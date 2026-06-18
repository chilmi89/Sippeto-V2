package model_storage

import "time"

type StorageFile struct {
	ID        string    `json:"id"`
	FileName  string    `json:"file_name"`
	Bucket    string    `json:"bucket"`
	URL       string    `json:"url"`
	Size      int64     `json:"size"`
	MimeType  string    `json:"mime_type"`
	CreatedAt time.Time `json:"created_at"`
}
