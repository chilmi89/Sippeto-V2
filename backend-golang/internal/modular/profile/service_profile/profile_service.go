package service_profile

import (
	"context"
	"errors"

	"backend-golang/internal/modular/profile/dto_profile"
	"backend-golang/internal/modular/profile/model_profile"
	"backend-golang/internal/modular/profile/repository_profile"

	"golang.org/x/crypto/bcrypt"
)

type ProfileService interface {
	GetProfileMe(ctx context.Context, userID string) (*dto_profile.ProfileResponse, error)
	GetUsers(ctx context.Context) ([]dto_profile.UserResponse, error)
	GetUserByID(ctx context.Context, id string) (*dto_profile.UserResponse, error)
	CreateUser(ctx context.Context, req dto_profile.CreateUserRequest) (*dto_profile.UserResponse, error)
	UpdateUser(ctx context.Context, id string, req dto_profile.UpdateUserRequest) (*dto_profile.UserResponse, error)
	DeleteUser(ctx context.Context, id string) error
}

type profileService struct {
	repo repository_profile.ProfileRepository
}

func NewProfileService(repo repository_profile.ProfileRepository) ProfileService {
	return &profileService{repo: repo}
}

func (s *profileService) GetProfileMe(ctx context.Context, userID string) (*dto_profile.ProfileResponse, error) {
	profile, err := s.repo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if profile == nil {
		return nil, errors.New("Profil tidak ditemukan.")
	}

	var permissions []string
	if profile.RoleID != "" {
		permissions, err = s.repo.FindPermissionsByRoleID(ctx, profile.RoleID)
		if err != nil {
			return nil, err
		}
	}

	if permissions == nil {
		permissions = []string{}
	}

	resp := &dto_profile.ProfileResponse{
		ID:           profile.ID,
		RoleID:       profile.RoleID,
		Email:        profile.Email,
		FullName:     profile.FullName,
		BusinessName: profile.BusinessName,
		Username:     profile.Username,
		PhoneNumber:  profile.PhoneNumber,
		Address:      profile.Address,
		AvatarURL:    profile.AvatarURL,
		BannerURL:    profile.BannerURL,
		Bio:          profile.Bio,
		IsActive:     profile.IsActive,
		CreatedAt:    profile.CreatedAt,
		UpdatedAt:    profile.UpdatedAt,
		BranchID:     profile.BranchID,
		PaymentQR:    profile.PaymentQR,
		RoleName:     profile.RoleName,
		Permissions:  permissions,
		Metadata:     profile.Metadata,
	}

	return resp, nil
}

func (s *profileService) GetUsers(ctx context.Context) ([]dto_profile.UserResponse, error) {
	profiles, err := s.repo.FindAll(ctx)
	if err != nil {
		return nil, err
	}

	var resp []dto_profile.UserResponse
	for _, p := range profiles {
		var role *dto_profile.UserRole
		if p.RoleID != "" {
			role = &dto_profile.UserRole{
				ID:   p.RoleID,
				Name: p.RoleName,
			}
		}

		resp = append(resp, dto_profile.UserResponse{
			ID:           p.ID,
			Email:        p.Email,
			FullName:     p.FullName,
			PhoneNumber:  p.PhoneNumber,
			IsActive:     p.IsActive,
			CreatedAt:    p.CreatedAt,
			BusinessName: p.BusinessName,
			BranchID:     p.BranchID,
			Roles:        role,
		})
	}

	if resp == nil {
		resp = []dto_profile.UserResponse{}
	}
	return resp, nil
}

func (s *profileService) GetUserByID(ctx context.Context, id string) (*dto_profile.UserResponse, error) {
	p, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if p == nil {
		return nil, errors.New("User tidak ditemukan")
	}

	var role *dto_profile.UserRole
	if p.RoleID != "" {
		role = &dto_profile.UserRole{
			ID:   p.RoleID,
			Name: p.RoleName,
		}
	}

	return &dto_profile.UserResponse{
		ID:           p.ID,
		Email:        p.Email,
		FullName:     p.FullName,
		PhoneNumber:  p.PhoneNumber,
		IsActive:     p.IsActive,
		CreatedAt:    p.CreatedAt,
		BusinessName: p.BusinessName,
		BranchID:     p.BranchID,
		Roles:        role,
	}, nil
}

func (s *profileService) CreateUser(ctx context.Context, req dto_profile.CreateUserRequest) (*dto_profile.UserResponse, error) {
	existing, err := s.repo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("Email sudah terdaftar")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if err != nil {
		return nil, errors.New("Gagal memproses sandi")
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	profile := &model_profile.Profile{
		Email:        req.Email,
		Password:     string(hashed),
		FullName:     &req.FullName,
		RoleID:       req.RoleID,
		BusinessName: req.BusinessName,
		PhoneNumber:  req.PhoneNumber,
		IsActive:     isActive,
		BranchID:     req.BranchID,
	}

	err = s.repo.Create(ctx, profile)
	if err != nil {
		return nil, err
	}

	createdProfile, err := s.repo.FindByID(ctx, profile.ID)
	if err != nil {
		return nil, err
	}

	var role *dto_profile.UserRole
	if createdProfile.RoleID != "" {
		role = &dto_profile.UserRole{
			ID:   createdProfile.RoleID,
			Name: createdProfile.RoleName,
		}
	}

	return &dto_profile.UserResponse{
		ID:           createdProfile.ID,
		Email:        createdProfile.Email,
		FullName:     createdProfile.FullName,
		PhoneNumber:  createdProfile.PhoneNumber,
		IsActive:     createdProfile.IsActive,
		CreatedAt:    createdProfile.CreatedAt,
		BusinessName: createdProfile.BusinessName,
		BranchID:     createdProfile.BranchID,
		Roles:        role,
	}, nil
}

func (s *profileService) UpdateUser(ctx context.Context, id string, req dto_profile.UpdateUserRequest) (*dto_profile.UserResponse, error) {
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, errors.New("User tidak ditemukan")
	}

	passwordToSave := existing.Password
	if req.Password != "" {
		hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
		if err != nil {
			return nil, errors.New("Gagal memproses sandi baru")
		}
		passwordToSave = string(hashed)
	}

	emailToSave := existing.Email
	if req.Email != "" && req.Email != existing.Email {
		emailCheck, err := s.repo.FindByEmail(ctx, req.Email)
		if err != nil {
			return nil, err
		}
		if emailCheck != nil {
			return nil, errors.New("Email sudah digunakan oleh user lain")
		}
		emailToSave = req.Email
	}

	isActive := existing.IsActive
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	// Preserve other existing fields that are not sent in the update request (which are nil/empty in req)
	businessNameToSave := existing.BusinessName
	if req.BusinessName != nil {
		businessNameToSave = req.BusinessName
	}

	branchIDToSave := existing.BranchID
	if req.BranchID != nil {
		branchIDToSave = req.BranchID
	}

	phoneNumberToSave := existing.PhoneNumber
	if req.PhoneNumber != nil {
		phoneNumberToSave = req.PhoneNumber
	}

	fullNameToSave := existing.FullName
	if req.FullName != "" {
		fullNameToSave = &req.FullName
	}

	roleIDToSave := existing.RoleID
	if req.RoleID != "" {
		roleIDToSave = req.RoleID
	}

	profile := &model_profile.Profile{
		ID:           existing.ID,
		RoleID:       roleIDToSave,
		Email:        emailToSave,
		Password:     passwordToSave,
		FullName:     fullNameToSave,
		BusinessName: businessNameToSave,
		PhoneNumber:  phoneNumberToSave,
		IsActive:     isActive,
		BranchID:     branchIDToSave,
	}

	err = s.repo.Update(ctx, profile)
	if err != nil {
		return nil, err
	}

	updatedProfile, err := s.repo.FindByID(ctx, profile.ID)
	if err != nil {
		return nil, err
	}

	var role *dto_profile.UserRole
	if updatedProfile.RoleID != "" {
		role = &dto_profile.UserRole{
			ID:   updatedProfile.RoleID,
			Name: updatedProfile.RoleName,
		}
	}

	return &dto_profile.UserResponse{
		ID:           updatedProfile.ID,
		Email:        updatedProfile.Email,
		FullName:     updatedProfile.FullName,
		PhoneNumber:  updatedProfile.PhoneNumber,
		IsActive:     updatedProfile.IsActive,
		CreatedAt:    updatedProfile.CreatedAt,
		BusinessName: updatedProfile.BusinessName,
		BranchID:     updatedProfile.BranchID,
		Roles:        role,
	}, nil
}

func (s *profileService) DeleteUser(ctx context.Context, id string) error {
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if existing == nil {
		return errors.New("User tidak ditemukan")
	}

	return s.repo.Delete(ctx, id)
}
