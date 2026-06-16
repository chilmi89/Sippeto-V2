package service_profile

import (
	"context"
	"errors"

	"backend-golang/internal/modular/profile/dto_profile"
	"backend-golang/internal/modular/profile/repository_profile"
)

type ProfileService interface {
	GetProfileMe(ctx context.Context, userID string) (*dto_profile.ProfileResponse, error)
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
	}

	return resp, nil
}
