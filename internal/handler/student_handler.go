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
	// Role might be string in context if middleware puts it as string, let's check middleware again.
	// Middleware: ctx = context.WithValue(ctx, RoleContextKey, domain.Role(roleStr))
	// So it is domain.Role.
	if !ok {
		// Fallback if type assertion fails (e.g. if it was string)
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
