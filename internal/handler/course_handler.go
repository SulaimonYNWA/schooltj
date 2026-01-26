package handler

import (
	"encoding/json"
	"net/http"

	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/service"
)

type CourseHandler struct {
	service *service.CourseService
}

func NewCourseHandler(s *service.CourseService) *CourseHandler {
	return &CourseHandler{service: s}
}

type createCourseRequest struct {
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	TeacherID   *string `json:"teacher_id,omitempty"` // Required for SchoolAdmin
}

func (h *CourseHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	role, okRole := r.Context().Value(RoleContextKey).(domain.Role)

	if !ok || !okRole {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req createCourseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	course, err := h.service.CreateCourse(r.Context(), userID, role, req.Title, req.Description, req.Price, req.TeacherID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(course)
}

func (h *CourseHandler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	role, okRole := r.Context().Value(RoleContextKey).(domain.Role)

	if !ok || !okRole {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	courses, err := h.service.ListCourses(r.Context(), userID, role)
	if err != nil {
		http.Error(w, "failed to fetch courses", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(courses)
}
