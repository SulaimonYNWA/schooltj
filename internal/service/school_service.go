package service

import (
	"context"
	"errors"

	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/repository"
)

type SchoolService struct {
	schoolRepo    *repository.SchoolRepository
	authService   *AuthService
	CourseService *CourseService // Exposed for seeding/internal use
}

func NewSchoolService(schoolRepo *repository.SchoolRepository, authService *AuthService, courseService *CourseService) *SchoolService {
	return &SchoolService{
		schoolRepo:    schoolRepo,
		authService:   authService,
		CourseService: courseService,
	}
}

func (s *SchoolService) AddTeacherToSchool(ctx context.Context, adminUserID, teacherEmail, teacherPassword, bio string) (*domain.User, error) {
	// 1. Get School of the Admin
	school, err := s.schoolRepo.GetSchoolByAdminID(ctx, adminUserID)
	if err != nil {
		return nil, err
	}

	// 2. Create User (Role Teacher)
	user, err := s.authService.Register(ctx, teacherEmail, teacherPassword, domain.RoleTeacher)
	if err != nil {
		return nil, err
	}

	// 3. Link Teacher to School and update bio
	if err := s.schoolRepo.AddTeacherToSchool(ctx, school.ID, user.ID); err != nil {
		return nil, err
	}

	// Update bio separately if it exists
	if bio != "" {
		_, err = s.schoolRepo.DB.ExecContext(ctx, "UPDATE teacher_profiles SET bio = ? WHERE user_id = ?", bio, user.ID)
		if err != nil {
			return nil, err
		}
	}

	return user, nil
}

func (s *SchoolService) ListTeachers(ctx context.Context, adminUserID string) ([]domain.User, error) {
	school, err := s.schoolRepo.GetSchoolByAdminID(ctx, adminUserID)
	if err != nil {
		return nil, err
	}
	return s.schoolRepo.ListTeachers(ctx, school.ID)
}

func (s *SchoolService) UpdateSchoolByID(ctx context.Context, userID string, role domain.Role, schoolID string, updates *domain.School) (*domain.School, error) {
	school, err := s.schoolRepo.GetSchoolByID(ctx, schoolID)
	if err != nil {
		return nil, err
	}

	// Permission check: only the school's admin or system admin
	if role != domain.RoleAdmin && school.AdminUserID != userID {
		return nil, errors.New("you do not have permission to edit this school")
	}

	// Apply updates
	if updates.Name != "" {
		school.Name = updates.Name
	}
	school.Description = updates.Description
	school.Phone = updates.Phone
	school.Email = updates.Email
	school.Address = updates.Address
	school.City = updates.City
	school.Website = updates.Website
	school.LogoURL = updates.LogoURL
	if updates.TaxID != "" {
		school.TaxID = updates.TaxID
	}

	if err := s.schoolRepo.UpdateSchool(ctx, school); err != nil {
		return nil, err
	}

	return s.schoolRepo.GetSchoolByID(ctx, schoolID)
}

func (s *SchoolService) DeleteSchool(ctx context.Context, userID string, role domain.Role, schoolID string) error {
	school, err := s.schoolRepo.GetSchoolByID(ctx, schoolID)
	if err != nil {
		return err
	}

	if role != domain.RoleAdmin && school.AdminUserID != userID {
		return errors.New("you do not have permission to delete this school")
	}

	return s.schoolRepo.DeleteSchool(ctx, schoolID)
}
