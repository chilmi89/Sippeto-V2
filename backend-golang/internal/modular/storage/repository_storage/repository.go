package repository_storage

import (
	"github.com/uptrace/bun"
)

type StorageRepository interface {
	// Interface kosong untuk mematuhi arsitektur modular proyek
}

type storageRepository struct {
	db *bun.DB
}

func NewStorageRepository(db *bun.DB) StorageRepository {
	return &storageRepository{db: db}
}
