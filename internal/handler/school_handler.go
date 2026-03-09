package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/repository"
	"github.com/schooltj/internal/service"
)

type SchoolHandler struct {
	service    *service.SchoolService
	schoolRepo *repository.SchoolRepository
	courseRepo *repository.CourseRepository
}

func NewSchoolHandler(s *service.SchoolService, sr *repository.SchoolRepository, cr *repository.CourseRepository) *SchoolHandler {
	return &SchoolHandler{service: s, schoolRepo: sr, courseRepo: cr}
}

type addTeacherRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Bio      string `json:"bio"`
}

func (h *SchoolHandler) AddTeacher(w http.ResponseWriter, r *http.Request) {
	adminID, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req addTeacherRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	user, err := h.service.AddTeacherToSchool(r.Context(), adminID, req.Email, req.Password, req.Bio)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

func (h *SchoolHandler) ListTeachers(w http.ResponseWriter, r *http.Request) {
	adminID, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	teachers, err := h.service.ListTeachers(r.Context(), adminID)
	if err != nil {
		http.Error(w, "failed to fetch teachers", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(teachers)
}

// ListSchools handles GET /api/schools
func (h *SchoolHandler) ListSchools(w http.ResponseWriter, r *http.Request) {
	schools, err := h.schoolRepo.ListSchools(r.Context())
	if err != nil {
		log.Printf("[SchoolHandler.ListSchools] error: %v", err)
		http.Error(w, "failed to fetch schools", http.StatusInternalServerError)
		return
	}
	if schools == nil {
		schools = []domain.School{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(schools)
}

// GetSchoolDetail handles GET /api/schools/{id}
func (h *SchoolHandler) GetSchoolDetail(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	school, err := h.schoolRepo.GetSchoolByID(r.Context(), id)
	if err != nil {
		log.Printf("[SchoolHandler.GetSchoolDetail] error: %v", err)
		http.Error(w, "school not found", http.StatusNotFound)
		return
	}

	teachers, _ := h.schoolRepo.ListTeachers(r.Context(), id)
	if teachers == nil {
		teachers = []domain.User{}
	}

	courses, _ := h.courseRepo.ListCourses(r.Context(), repository.CourseFilter{SchoolID: &id})
	if courses == nil {
		courses = []*domain.Course{}
	}

	type schoolDetail struct {
		*domain.School
		Teachers []domain.User    `json:"teachers"`
		Courses  []*domain.Course `json:"courses"`
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(schoolDetail{School: school, Teachers: teachers, Courses: courses})
}

// UpdateSchool handles PUT /api/schools/my
func (h *SchoolHandler) UpdateSchool(w http.ResponseWriter, r *http.Request) {
	adminID, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	school, err := h.schoolRepo.GetSchoolByAdminID(r.Context(), adminID)
	if err != nil {
		http.Error(w, "school not found", http.StatusNotFound)
		return
	}

	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Phone       string `json:"phone"`
		Email       string `json:"email"`
		Address     string `json:"address"`
		City        string `json:"city"`
		Website     string `json:"website"`
		LogoURL     string `json:"logo_url"`
		TaxID       string `json:"tax_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name != "" {
		school.Name = req.Name
	}
	school.Description = req.Description
	school.Phone = req.Phone
	school.Email = req.Email
	school.Address = req.Address
	school.City = req.City
	school.Website = req.Website
	school.LogoURL = req.LogoURL
	if req.TaxID != "" {
		school.TaxID = req.TaxID
	}

	if err := h.schoolRepo.UpdateSchool(r.Context(), school); err != nil {
		log.Printf("[SchoolHandler.UpdateSchool] error: %v", err)
		http.Error(w, "failed to update school", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(school)
}

// UpdateSchoolByID handles PUT /api/schools/{id}
func (h *SchoolHandler) UpdateSchoolByID(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	role, okRole := r.Context().Value(RoleContextKey).(domain.Role)
	schoolID := chi.URLParam(r, "id")

	if !ok || !okRole || schoolID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Phone       string `json:"phone"`
		Email       string `json:"email"`
		Address     string `json:"address"`
		City        string `json:"city"`
		Website     string `json:"website"`
		LogoURL     string `json:"logo_url"`
		TaxID       string `json:"tax_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	updates := &domain.School{
		Name:        req.Name,
		Description: req.Description,
		Phone:       req.Phone,
		Email:       req.Email,
		Address:     req.Address,
		City:        req.City,
		Website:     req.Website,
		LogoURL:     req.LogoURL,
		TaxID:       req.TaxID,
	}

	school, err := h.service.UpdateSchoolByID(r.Context(), userID, role, schoolID, updates)
	if err != nil {
		log.Printf("[SchoolHandler.UpdateSchoolByID] error: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(school)
}

// DeleteSchool handles DELETE /api/schools/{id}
func (h *SchoolHandler) DeleteSchool(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	role, okRole := r.Context().Value(RoleContextKey).(domain.Role)
	schoolID := chi.URLParam(r, "id")

	if !ok || !okRole || schoolID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	if err := h.service.DeleteSchool(r.Context(), userID, role, schoolID); err != nil {
		log.Printf("[SchoolHandler.DeleteSchool] error: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "school deleted"}`))
}
