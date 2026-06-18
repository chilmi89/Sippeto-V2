package controller_transaction

import (
	"log"
	"net/http"
	"strconv"

	"backend-golang/internal/modular/transaction/dto_transaction"
	"backend-golang/internal/modular/transaction/service_transaction"

	"github.com/gin-gonic/gin"
)

type TransactionController struct {
	svc service_transaction.TransactionService
}

func NewTransactionController(svc service_transaction.TransactionService) *TransactionController {
	return &TransactionController{svc: svc}
}

// ─── TRANSACTION GROUPS CONTROLLERS ───

func (ctrl *TransactionController) GetGroups(c *gin.Context) {
	id := c.Query("id")
	if id != "" {
		tx, err := ctrl.svc.GetGroup(c.Request.Context(), id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data transaksi"})
			return
		}
		if tx == nil {
			c.JSON(http.StatusOK, gin.H{"data": []interface{}{}, "total": 0})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": []interface{}{tx}, "total": 1})
		return
	}

	profileID := c.Query("profile_id")
	branchID := c.Query("branch_id")
	search := c.Query("search")
	dateStart := c.Query("date_start")
	dateEnd := c.Query("date_end")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}

	res, err := ctrl.svc.GetGroups(c.Request.Context(), profileID, branchID, search, dateStart, dateEnd, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data transaksi"})
		return
	}

	c.JSON(http.StatusOK, res)
}

func (ctrl *TransactionController) CreateGroup(c *gin.Context) {
	var req dto_transaction.CreateTransactionGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload tidak valid"})
		return
	}

	if req.ProfileID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Profile ID wajib disertakan"})
		return
	}

	res, err := ctrl.svc.CreateGroup(c.Request.Context(), req)
	if err != nil {
		log.Printf("CreateGroup Controller Error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat transaksi"})
		return
	}

	c.JSON(http.StatusCreated, res)
}

func (ctrl *TransactionController) UpdateGroup(c *gin.Context) {
	var req dto_transaction.UpdateTransactionGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload tidak valid"})
		return
	}

	if req.ID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID transaksi wajib disertakan"})
		return
	}

	res, err := ctrl.svc.UpdateGroup(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui transaksi"})
		return
	}

	c.JSON(http.StatusOK, res)
}

func (ctrl *TransactionController) DeleteGroup(c *gin.Context) {
	id := c.Query("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID transaksi wajib disertakan"})
		return
	}

	err := ctrl.svc.DeleteGroup(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus transaksi"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Transaksi berhasil dihapus"})
}

// ─── TRANSACTION ITEMS CONTROLLERS ───

func (ctrl *TransactionController) GetItems(c *gin.Context) {
	groupID := c.Query("group_id")
	categoryID := c.Query("category_id")
	itemType := c.Query("type")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}

	res, err := ctrl.svc.GetItems(c.Request.Context(), groupID, categoryID, itemType, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data item"})
		return
	}

	c.JSON(http.StatusOK, res)
}

func (ctrl *TransactionController) CreateItem(c *gin.Context) {
	var req dto_transaction.CreateTransactionItemDirectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload tidak valid"})
		return
	}

	if req.GroupID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Group ID wajib disertakan"})
		return
	}

	res, err := ctrl.svc.CreateItemDirect(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat item transaksi"})
		return
	}

	c.JSON(http.StatusCreated, res)
}

func (ctrl *TransactionController) UpdateItem(c *gin.Context) {
	var req dto_transaction.UpdateTransactionItemDirectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload tidak valid"})
		return
	}

	if req.ID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID item wajib disertakan"})
		return
	}

	res, err := ctrl.svc.UpdateItemDirect(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui item transaksi"})
		return
	}

	c.JSON(http.StatusOK, res)
}

func (ctrl *TransactionController) DeleteItem(c *gin.Context) {
	id := c.Query("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID item wajib disertakan"})
		return
	}

	err := ctrl.svc.DeleteItemDirect(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus item transaksi"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item transaksi berhasil dihapus"})
}

// ─── TRANSACTION ATTACHMENTS CONTROLLERS ───

func (ctrl *TransactionController) GetAttachments(c *gin.Context) {
	groupID := c.Query("group_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}

	res, err := ctrl.svc.GetAttachments(c.Request.Context(), groupID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data lampiran"})
		return
	}

	c.JSON(http.StatusOK, res)
}

func (ctrl *TransactionController) CreateAttachment(c *gin.Context) {
	var req dto_transaction.CreateAttachmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload tidak valid"})
		return
	}

	if req.GroupID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Group ID wajib disertakan"})
		return
	}
	if req.FileURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "URL file wajib disertakan"})
		return
	}

	res, err := ctrl.svc.CreateAttachment(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menambahkan lampiran"})
		return
	}

	c.JSON(http.StatusCreated, res)
}

func (ctrl *TransactionController) UpdateAttachment(c *gin.Context) {
	var req dto_transaction.UpdateAttachmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload tidak valid"})
		return
	}

	if req.ID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID lampiran wajib disertakan"})
		return
	}

	res, err := ctrl.svc.UpdateAttachment(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui lampiran"})
		return
	}

	c.JSON(http.StatusOK, res)
}

func (ctrl *TransactionController) DeleteAttachment(c *gin.Context) {
	id := c.Query("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID lampiran wajib disertakan"})
		return
	}

	err := ctrl.svc.DeleteAttachment(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus lampiran"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Lampiran berhasil dihapus"})
}
