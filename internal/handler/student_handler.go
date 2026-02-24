package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/service"
)

type StudentHandler struct {
	service *service.StudentService
}

func NewStudentHandler(s *service.StudentService) *StudentHandler {
	return &StudentHandler{service: s}
}

func (h *StudentHandler) List(w http.ResponseWriter, r *http.Request) {
	// Parse limit and offset
	limitStr := r.URL.Query().Get("limit")
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 {
		limit = 50 // Default
	}

	offsetStr := r.URL.Query().Get("offset")
	offset, _ := strconv.Atoi(offsetStr)
	if offset < 0 {
		offset = 0 // Default
	}

	search := r.URL.Query().Get("search")

	students, err := h.service.GetAllStudents(r.Context(), limit, offset, search)
	if err != nil {
		http.Error(w, "failed to fetch students", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(students)
}

func (h *StudentHandler) ListMyStudents(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	role, ok := r.Context().Value(RoleContextKey).(domain.Role)
	if !ok {
		roleStr, okStr := r.Context().Value(RoleContextKey).(string)
		if okStr {
			role = domain.Role(roleStr)
		} else {
			http.Error(w, "unauthorized - unknown role", http.StatusUnauthorized)
			return
		}
	}

	students, err := h.service.GetMyStudents(r.Context(), userID, role)
	if err != nil {
		http.Error(w, "failed to fetch my students", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(students)
}

func (h *StudentHandler) ListByCourse(w http.ResponseWriter, r *http.Request) {
	courseID := r.URL.Query().Get("course_id")
	if courseID == "" {
		http.Error(w, "course_id is required", http.StatusBadRequest)
		return
	}

	limitStr := r.URL.Query().Get("limit")
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 {
		limit = 50
	}

	offsetStr := r.URL.Query().Get("offset")
	offset, _ := strconv.Atoi(offsetStr)
	if offset < 0 {
		offset = 0
	}

	search := r.URL.Query().Get("search")

	students, err := h.service.GetStudentsByCourse(r.Context(), courseID, limit, offset, search)
	if err != nil {
		http.Error(w, "failed to fetch students by course", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(students)
}

func (h *StudentHandler) ListConnections(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	limitStr := r.URL.Query().Get("limit")
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 {
		limit = 50
	}

	offsetStr := r.URL.Query().Get("offset")
	offset, _ := strconv.Atoi(offsetStr)
	if offset < 0 {
		offset = 0
	}

	search := r.URL.Query().Get("search")

	students, err := h.service.GetConnectedStudents(r.Context(), userID, limit, offset, search)
	if err != nil {
		http.Error(w, "failed to fetch connected students", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(students)
}

func (h *StudentHandler) Suggestions(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	if q == "" {
		json.NewEncoder(w).Encode([]interface{}{})
		return
	}

	students, err := h.service.SearchSuggestions(r.Context(), q)
	if err != nil {
		http.Error(w, "failed to search students", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(students)
}
