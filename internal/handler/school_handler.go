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
}

func NewSchoolHandler(s *service.SchoolService, sr *repository.SchoolRepository) *SchoolHandler {
	return &SchoolHandler{service: s, schoolRepo: sr}
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

	type schoolDetail struct {
		*domain.School
		Teachers []domain.User `json:"teachers"`
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(schoolDetail{School: school, Teachers: teachers})
}
