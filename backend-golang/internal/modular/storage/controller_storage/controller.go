package controller_storage

import (
	"fmt"
	"io"
	"net/http"
	"strings"

	"backend-golang/internal/modular/storage/dto_storage"
	"backend-golang/internal/modular/storage/service_storage"

	"github.com/gin-gonic/gin"
)

type StorageController struct {
	svc service_storage.StorageService
}

func NewStorageController(svc service_storage.StorageService) *StorageController {
	return &StorageController{svc: svc}
}

func (ctrl *StorageController) UploadFile(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Berkas tidak ditemukan (field 'file' diperlukan)"})
		return
	}

	bucketType := c.DefaultQuery("bucket", "product")
	name := c.Query("name")
	tenant := c.Query("tenant")

	res, err := ctrl.svc.UploadFile(c.Request.Context(), file, bucketType, name, tenant)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}


	c.JSON(http.StatusOK, gin.H{
		"data":    res,
		"message": "Berkas berhasil diunggah",
	})
}

func (ctrl *StorageController) DeleteFile(c *gin.Context) {
	var req dto_storage.DeleteFileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "URL berkas wajib disertakan"})
		return
	}

	err := ctrl.svc.DeleteFile(c.Request.Context(), req.URL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Berkas berhasil dihapus"})
}

func (ctrl *StorageController) ServeFile(c *gin.Context) {
	filepath := c.Param("filepath")
	filepath = strings.TrimPrefix(filepath, "/")
	parts := strings.SplitN(filepath, "/", 2)
	if len(parts) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format path tidak valid"})
		return
	}
	bucketName := parts[0]
	objectName := parts[1]

	reader, stat, err := ctrl.svc.GetFile(c.Request.Context(), bucketName, objectName)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Berkas tidak ditemukan"})
		return
	}
	defer reader.Close()

	c.Writer.Header().Set("Content-Type", stat.ContentType)
	c.Writer.Header().Set("Content-Length", fmt.Sprintf("%d", stat.Size))
	c.Writer.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	c.Writer.WriteHeader(http.StatusOK)

	_, _ = io.Copy(c.Writer, reader)
}
