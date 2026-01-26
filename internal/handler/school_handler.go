package handler

import (
	"encoding/json"
	"net/http"

	"github.com/schooltj/internal/service"
)

type SchoolHandler struct {
	service *service.SchoolService
}

func NewSchoolHandler(s *service.SchoolService) *SchoolHandler {
	return &SchoolHandler{service: s}
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
