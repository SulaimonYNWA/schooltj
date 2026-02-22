package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/service"
)

type GradeHandler struct {
	service *service.GradeService
}

func NewGradeHandler(s *service.GradeService) *GradeHandler {
	return &GradeHandler{service: s}
}

// CreateGrade handles POST /api/courses/{id}/grades
func (h *GradeHandler) CreateGrade(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(UserContextKey).(string)
	courseID := chi.URLParam(r, "id")

	var grade domain.Grade
	if err := json.NewDecoder(r.Body).Decode(&grade); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	grade.CourseID = courseID
	grade.GradedBy = userID

	if err := h.service.CreateGrade(r.Context(), &grade); err != nil {
		log.Printf("[GradeHandler.CreateGrade] error: %v", err)
		http.Error(w, "failed to create grade", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(grade)
}

// ListCourseGrades handles GET /api/courses/{id}/grades
func (h *GradeHandler) ListCourseGrades(w http.ResponseWriter, r *http.Request) {
	courseID := chi.URLParam(r, "id")
	grades, err := h.service.ListByCourse(r.Context(), courseID)
	if err != nil {
		log.Printf("[GradeHandler.ListCourseGrades] error: %v", err)
		http.Error(w, "failed to fetch grades", http.StatusInternalServerError)
		return
	}
	if grades == nil {
		grades = []domain.Grade{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(grades)
}

// MyGrades handles GET /api/my-grades
func (h *GradeHandler) MyGrades(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(UserContextKey).(string)
	grades, err := h.service.ListByStudent(r.Context(), userID)
	if err != nil {
		log.Printf("[GradeHandler.MyGrades] error: %v", err)
		http.Error(w, "failed to fetch grades", http.StatusInternalServerError)
		return
	}
	if grades == nil {
		grades = []domain.Grade{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(grades)
}
