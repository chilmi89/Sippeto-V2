package service_stock

import (
	"context"
	"fmt"
	"time"

	"backend-golang/internal/modular/stock/dto_stock"
	"backend-golang/internal/modular/stock/repository_stock"
)

type StockService interface {
	GetStocksPageData(ctx context.Context, userID string) (*dto_stock.StocksPageDataResponse, error)
	UpdateStock(ctx context.Context, userID string, req dto_stock.UpdateStockRequest) (*dto_stock.UpdateStockResponse, error)
}

type stockService struct {
	repo repository_stock.StockRepository
}

func NewStockService(repo repository_stock.StockRepository) StockService {
	return &stockService{repo: repo}
}

func (s *stockService) GetStocksPageData(ctx context.Context, userID string) (*dto_stock.StocksPageDataResponse, error) {
	// 1. Ambil profile & permissions
	profile, err := s.repo.GetProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	permissions, err := s.repo.GetPermissions(ctx, userID)
	if err != nil {
		return nil, err
	}

	hasPermission := false
	for _, perm := range permissions {
		if perm == "kelola_stok" {
			hasPermission = true
			break
		}
	}

	if !hasPermission {
		return nil, fmt.Errorf("akses ditolak")
	}

	// 2. Tentukan tenant owner ID
	var tenantOwnerID string
	if profile.BranchID != nil && *profile.BranchID != "" {
		ownerID, err := s.repo.GetBranchTenantOwner(ctx, *profile.BranchID)
		if err != nil {
			return nil, fmt.Errorf("gagal mendapatkan owner cabang: %v", err)
		}
		tenantOwnerID = ownerID
	} else {
		tenantOwnerID = profile.ID
	}
	profile.TenantOwnerID = tenantOwnerID

	// 3. Fetch Branches
	branches, err := s.repo.GetBranchesByTenant(ctx, tenantOwnerID)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil cabang: %v", err)
	}

	// Auto-create default branch "Pusat" if owner has 0 branches
	if (profile.BranchID == nil || *profile.BranchID == "") && len(branches) == 0 {
		defaultBranch, err := s.repo.CreateBranch(ctx, tenantOwnerID, "Pusat")
		if err != nil {
			return nil, fmt.Errorf("gagal membuat cabang Pusat default: %v", err)
		}
		branches = append(branches, *defaultBranch)
	}

	// 4. Fetch Products
	products, err := s.repo.GetProductsByTenant(ctx, tenantOwnerID)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil produk: %v", err)
	}

	// 5. Fetch & Flatten Stocks
	var flattenedStocks []dto_stock.ProductStockResponse
	if profile.BranchID == nil || *profile.BranchID == "" {
		// Owner View: Lihat semua stok produk di semua cabang
		realStocks, err := s.repo.GetProductStocksByTenant(ctx, tenantOwnerID)
		if err != nil {
			return nil, fmt.Errorf("gagal mengambil data stok: %v", err)
		}

		// Map real stocks for lookup
		stockMap := make(map[string]dto_stock.ProductStockResponse)
		for _, sVal := range realStocks {
			key := fmt.Sprintf("%s-%s", sVal.ProductID, sVal.BranchID)
			stockMap[key] = sVal
		}

		// Build flattened stock (including virtual stocks)
		for _, prod := range products {
			for _, br := range branches {
				key := fmt.Sprintf("%s-%s", prod.ID, br.ID)
				if ps, found := stockMap[key]; found {
					flattenedStocks = append(flattenedStocks, ps)
				} else {
					// Virtual stock
					flattenedStocks = append(flattenedStocks, dto_stock.ProductStockResponse{
						ID:        fmt.Sprintf("virtual-%s-%s", prod.ID, br.ID),
						ProductID: prod.ID,
						BranchID:  br.ID,
						Stock:     0,
						MinStock:  0,
						Products: dto_stock.ProductDetailInfo{
							Name:      prod.Name,
							SellPrice: 0, // Fallback, could query or ignore
						},
						Branches: dto_stock.BranchNameInfo{
							Name: br.Name,
						},
					})
				}
			}
		}
	} else {
		// Staff View: Lihat stok produk di cabangnya saja
		userBranchID := *profile.BranchID
		realStocks, err := s.repo.GetProductStocksByBranch(ctx, userBranchID)
		if err != nil {
			return nil, fmt.Errorf("gagal mengambil data stok cabang: %v", err)
		}

		stockMap := make(map[string]dto_stock.ProductStockResponse)
		for _, sVal := range realStocks {
			stockMap[sVal.ProductID] = sVal
		}

		currentBranchName := "Cabang Anda"
		for _, br := range branches {
			if br.ID == userBranchID {
				currentBranchName = br.Name
				break
			}
		}

		for _, prod := range products {
			if ps, found := stockMap[prod.ID]; found {
				flattenedStocks = append(flattenedStocks, ps)
			} else {
				flattenedStocks = append(flattenedStocks, dto_stock.ProductStockResponse{
					ID:        fmt.Sprintf("virtual-%s-%s", prod.ID, userBranchID),
					ProductID: prod.ID,
					BranchID:  userBranchID,
					Stock:     0,
					MinStock:  0,
					Products: dto_stock.ProductDetailInfo{
						Name:      prod.Name,
						SellPrice: 0,
					},
					Branches: dto_stock.BranchNameInfo{
						Name: currentBranchName,
					},
				})
			}
		}
	}

	// 6. Fetch Mutations
	var mutations []dto_stock.StockMutationResponse
	if profile.BranchID == nil || *profile.BranchID == "" {
		m, err := s.repo.GetMutationsByTenant(ctx, tenantOwnerID)
		if err != nil {
			return nil, fmt.Errorf("gagal mengambil riwayat mutasi: %v", err)
		}
		mutations = m
	} else {
		m, err := s.repo.GetMutationsByBranch(ctx, *profile.BranchID)
		if err != nil {
			return nil, fmt.Errorf("gagal mengambil riwayat mutasi cabang: %v", err)
		}
		mutations = m
	}

	return &dto_stock.StocksPageDataResponse{
		Profile:   *profile,
		Stocks:    flattenedStocks,
		Mutations: mutations,
		Branches:  branches,
		Products:  products,
	}, nil
}

func (s *stockService) UpdateStock(ctx context.Context, userID string, req dto_stock.UpdateStockRequest) (*dto_stock.UpdateStockResponse, error) {
	// 1. Ambil profile & permissions
	profile, err := s.repo.GetProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	permissions, err := s.repo.GetPermissions(ctx, userID)
	if err != nil {
		return nil, err
	}

	hasPermission := false
	for _, perm := range permissions {
		if perm == "kelola_stok" {
			hasPermission = true
			break
		}
	}

	if !hasPermission {
		return nil, fmt.Errorf("akses ditolak")
	}

	if req.ProductID == "" {
		return nil, fmt.Errorf("Product ID wajib disertakan")
	}

	isOwner := profile.BranchID == nil || *profile.BranchID == ""

	// =================================================================
	// SKENARIO A: TRANSFER STOK ANTAR-CABANG
	// =================================================================
	if req.IsTransfer != nil && *req.IsTransfer {
		if req.FromBranchID == nil || *req.FromBranchID == "" || req.ToBranchID == nil || *req.ToBranchID == "" || req.Quantity == nil || *req.Quantity <= 0 {
			return nil, fmt.Errorf("Data transfer (Pengirim, Penerima, Jumlah) tidak lengkap atau tidak valid")
		}

		if *req.FromBranchID == *req.ToBranchID {
			return nil, fmt.Errorf("Cabang pengirim dan penerima tidak boleh sama")
		}

		// Validasi Hak Akses Cabang untuk Staff
		if !isOwner {
			userBranch := *profile.BranchID
			if *req.FromBranchID != userBranch && *req.ToBranchID != userBranch {
				return nil, fmt.Errorf("Anda tidak memiliki hak untuk melakukan transfer dari/ke cabang lain")
			}
		}

		mutation, err := s.repo.TransferStockTx(ctx, req)
		if err != nil {
			return nil, err
		}

		notesVal := ""
		if mutation.Notes != nil {
			notesVal = *mutation.Notes
		}

		return &dto_stock.UpdateStockResponse{
			Success: true,
			Action:  "transfer",
			TransferMutation: &dto_stock.StockMutationResponse{
				ID:           mutation.ID,
				ProductID:    mutation.ProductID,
				FromBranchID: mutation.FromBranchID,
				ToBranchID:   mutation.ToBranchID,
				Quantity:     mutation.Quantity,
				Type:         mutation.Type,
				Notes:        &notesVal,
				CreatedAt:    mutation.CreatedAt.Format(time.RFC3339),
			},
		}, nil
	}

	// =================================================================
	// SKENARIO B: MULTI-ALOKASI STOK (Oleh Owner)
	// =================================================================
	if len(req.BranchStocks) > 0 {
		if !isOwner {
			return nil, fmt.Errorf("Hanya owner yang dapat melakukan alokasi stok multi-cabang")
		}

		err := s.repo.MultiAllocateStockTx(ctx, req)
		if err != nil {
			return nil, err
		}

		return &dto_stock.UpdateStockResponse{
			Success: true,
			Action:  "multi_allocation",
		}, nil
	}

	// =================================================================
	// SKENARIO C: SINGLE OPNAME STOK (Oleh Cabang)
	// =================================================================
	if req.BranchID != nil && *req.BranchID != "" && req.Stock != nil && req.MinStock != nil {
		// Validasi staff hanya boleh adjust cabang sendiri
		if !isOwner && *req.BranchID != *profile.BranchID {
			return nil, fmt.Errorf("Anda hanya dapat menyesuaikan stok di cabang Anda sendiri")
		}

		err := s.repo.AdjustStockTx(ctx, req)
		if err != nil {
			return nil, err
		}

		return &dto_stock.UpdateStockResponse{
			Success: true,
			Action:  "single_opname",
		}, nil
	}

	return nil, fmt.Errorf("Payload update stok tidak valid")
}
