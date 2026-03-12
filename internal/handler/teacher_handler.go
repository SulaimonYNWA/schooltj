package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/schooltj/internal/service"
)

type TeacherHandler struct {
	service *service.TeacherService
}

func NewTeacherHandler(s *service.TeacherService) *TeacherHandler {
	return &TeacherHandler{service: s}
}

// ListAllTeachers handles GET /api/teachers
func (h *TeacherHandler) ListAllTeachers(w http.ResponseWriter, r *http.Request) {
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")
	search := r.URL.Query().Get("search")

	limit := 30
	offset := 0

	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
		limit = l
	}
	if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
		offset = o
	}

	teachers, err := h.service.GetAllTeachers(r.Context(), limit, offset, search)
	if err != nil {
		log.Printf("[TeacherHandler.ListAllTeachers] error: %v", err)
		http.Error(w, "failed to fetch teachers", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(teachers)
}
