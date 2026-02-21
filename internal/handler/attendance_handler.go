package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/service"
)

type AttendanceHandler struct {
	service *service.AttendanceService
}

func NewAttendanceHandler(s *service.AttendanceService) *AttendanceHandler {
	return &AttendanceHandler{service: s}
}

type markAttendanceRequest struct {
	Date    string                     `json:"date"`
	Records []service.AttendanceRecord `json:"records"`
}

// MarkAttendance handles POST /api/courses/{id}/attendance
func (h *AttendanceHandler) MarkAttendance(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	role, okRole := r.Context().Value(RoleContextKey).(domain.Role)
	courseID := chi.URLParam(r, "id")

	if !ok || !okRole || courseID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req markAttendanceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.service.MarkAttendance(r.Context(), userID, role, courseID, req.Date, req.Records); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "attendance recorded"})
}

// GetSessionAttendance handles GET /api/courses/{id}/attendance?date=
func (h *AttendanceHandler) GetSessionAttendance(w http.ResponseWriter, r *http.Request) {
	_, ok := r.Context().Value(UserContextKey).(string)
	courseID := chi.URLParam(r, "id")
	date := r.URL.Query().Get("date")

	if !ok || courseID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	records, err := h.service.GetSessionAttendance(r.Context(), courseID, date)
	if err != nil {
		log.Printf("[AttendanceHandler.GetSessionAttendance] error: %v", err)
		http.Error(w, "failed to fetch attendance", http.StatusInternalServerError)
		return
	}
	if records == nil {
		records = []domain.Attendance{}
	}
	json.NewEncoder(w).Encode(records)
}

// GetCourseRoster handles GET /api/courses/{id}/roster
func (h *AttendanceHandler) GetCourseRoster(w http.ResponseWriter, r *http.Request) {
	_, ok := r.Context().Value(UserContextKey).(string)
	courseID := chi.URLParam(r, "id")

	if !ok || courseID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	roster, err := h.service.GetCourseRoster(r.Context(), courseID)
	if err != nil {
		log.Printf("[AttendanceHandler.GetCourseRoster] error: %v", err)
		http.Error(w, "failed to fetch roster", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(roster)
}

// MyAttendance handles GET /api/my-attendance?course_id=
func (h *AttendanceHandler) MyAttendance(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	courseID := r.URL.Query().Get("course_id")
	records, err := h.service.GetStudentAttendance(r.Context(), userID, courseID)
	if err != nil {
		log.Printf("[AttendanceHandler.MyAttendance] error: %v", err)
		http.Error(w, "failed to fetch attendance", http.StatusInternalServerError)
		return
	}
	if records == nil {
		records = []domain.Attendance{}
	}
	json.NewEncoder(w).Encode(records)
}

// MyAttendanceSummary handles GET /api/my-attendance/summary
func (h *AttendanceHandler) MyAttendanceSummary(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	summaries, err := h.service.GetStudentSummary(r.Context(), userID)
	if err != nil {
		log.Printf("[AttendanceHandler.MyAttendanceSummary] error: %v", err)
		http.Error(w, "failed to fetch summary", http.StatusInternalServerError)
		return
	}
	if summaries == nil {
		summaries = []domain.AttendanceSummary{}
	}
	json.NewEncoder(w).Encode(summaries)
}
