package service

import (
	"context"
	"errors"

	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/repository"
)

type AnnouncementService struct {
	repo *repository.AnnouncementRepository
}

func NewAnnouncementService(repo *repository.AnnouncementRepository) *AnnouncementService {
	return &AnnouncementService{repo: repo}
}

// Create makes a new announcement (teacher/admin only).
func (s *AnnouncementService) Create(ctx context.Context, authorID string, role domain.Role, a *domain.Announcement) error {
	if role != domain.RoleTeacher && role != domain.RoleSchoolAdmin && role != domain.RoleAdmin {
		return errors.New("only teachers and admins can create announcements")
	}
	a.AuthorID = authorID
	return s.repo.Create(ctx, a)
}

// ListByCourse returns announcements for a specific course.
func (s *AnnouncementService) ListByCourse(ctx context.Context, courseID string) ([]domain.Announcement, error) {
	return s.repo.ListByCourse(ctx, courseID)
}

// MyFeed returns all announcements relevant to a student.
func (s *AnnouncementService) MyFeed(ctx context.Context, userID string, role domain.Role) ([]domain.Announcement, error) {
	if role == domain.RoleStudent {
		return s.repo.ListForStudent(ctx, userID)
	}
	return s.repo.ListAll(ctx)
}

// Delete removes an announcement.
func (s *AnnouncementService) Delete(ctx context.Context, announcementID, userID string) error {
	return s.repo.Delete(ctx, announcementID, userID)
}
