package service

import (
	"context"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

var ErrInvalidCredentials = errors.New("invalid credentials")
var ErrEmailAlreadyExists = errors.New("email already exists")

type AuthService struct {
	repo        *repository.UserRepository
	schoolRepo  *repository.SchoolRepository
	studentRepo *repository.StudentRepository
	jwtSecret   []byte
	tokenExpiry time.Duration
}

func NewAuthService(repo *repository.UserRepository, schoolRepo *repository.SchoolRepository, studentRepo *repository.StudentRepository, secret string) *AuthService {
	return &AuthService{
		repo:        repo,
		schoolRepo:  schoolRepo,
		studentRepo: studentRepo,
		jwtSecret:   []byte(secret),
		tokenExpiry: 24 * time.Hour,
	}
}

func (s *AuthService) Register(ctx context.Context, email, password string, role domain.Role) (*domain.User, error) {
	existing, err := s.repo.GetUserByEmail(ctx, email)
	if err == nil && existing != nil {
		return nil, ErrEmailAlreadyExists
	}
	if err != nil && !errors.Is(err, repository.ErrUserNotFound) {
		return nil, err
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &domain.User{
		Email:        email,
		Name:         email, // default to email if not provided
		PasswordHash: string(hashedPassword),
		Role:         role,
	}

	if err := s.repo.CreateUser(ctx, user); err != nil {
		return nil, err
	}

	// Auto-create school if role is school_admin
	if role == domain.RoleSchoolAdmin {
		school := &domain.School{
			AdminUserID: user.ID,
			Name:        "My School", // Generic name, can be updated later
		}
		if err := s.schoolRepo.CreateSchool(ctx, school); err != nil {
			// Ideally rollback user creation here in a transaction
			return nil, err
		}
	} else if role == domain.RoleTeacher {
		// Auto-create teacher profile for independent teachers or to valid FK
		profile := &domain.TeacherProfile{
			UserID:   user.ID,
			SchoolID: nil, // Independent by default
			Bio:      "",
			Subjects: []string{},
		}
		if err := s.schoolRepo.CreateTeacherProfile(ctx, profile); err != nil {
			return nil, err
		}
	} else if role == domain.RoleStudent {
		// Auto-create student profile
		student := &domain.Student{
			UserID:     user.ID,
			ParentName: "", // Unknown at registration
			GradeLevel: "", // Unknown at registration
		}

		if err := s.studentRepo.Create(ctx, student); err != nil {
			return nil, err
		}
	}

	return user, nil
}

func (s *AuthService) Login(ctx context.Context, email, password string) (string, error) {
	user, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			return "", ErrInvalidCredentials
		}
		return "", err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return "", ErrInvalidCredentials
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":   user.ID,
		"email": user.Email,
		"role":  user.Role,
		"exp":   time.Now().Add(s.tokenExpiry).Unix(),
	})

	tokenString, err := token.SignedString(s.jwtSecret)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func (s *AuthService) VerifyToken(tokenString string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return s.jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

func (s *AuthService) GetUserByID(ctx context.Context, id string) (*domain.User, error) {
	return s.repo.GetUserByID(ctx, id)
}

func (s *AuthService) UpdateUser(ctx context.Context, userID, name, email string) (*domain.User, error) {
	user, err := s.repo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	user.Name = name
	user.Email = email

	if err := s.repo.UpdateUser(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *AuthService) ChangePassword(ctx context.Context, userID, currentPassword, newPassword string) error {
	user, err := s.repo.GetUserByID(ctx, userID)
	if err != nil {
		return errors.New("user not found")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(currentPassword)); err != nil {
		return errors.New("current password is incorrect")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	return s.repo.UpdatePassword(ctx, userID, string(hashedPassword))
}

func (s *AuthService) SearchUsers(ctx context.Context, q string) ([]domain.User, error) {
	return s.repo.SearchUsers(ctx, q)
}
