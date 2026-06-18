package dto_storage

type UploadResponse struct {
	URL      string `json:"url"`
	FileName string `json:"file_name"`
	Size     int64  `json:"size"`
	MimeType string `json:"mime_type"`
}

type DeleteFileRequest struct {
	URL string `json:"url" binding:"required"`
}
