package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/service"
)

type AssignmentHandler struct {
	service *service.AssignmentService
}

func NewAssignmentHandler(s *service.AssignmentService) *AssignmentHandler {
	return &AssignmentHandler{service: s}
}

// Create handles POST /api/courses/{id}/assignments
func (h *AssignmentHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(UserContextKey).(string)
	courseID := chi.URLParam(r, "id")

	var a domain.Assignment
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	a.CourseID = courseID
	a.CreatedBy = userID

	if err := h.service.Create(r.Context(), &a); err != nil {
		log.Printf("[AssignmentHandler.Create] error: %v", err)
		http.Error(w, "failed to create assignment", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(a)
}

// ListByCourse handles GET /api/courses/{id}/assignments
func (h *AssignmentHandler) ListByCourse(w http.ResponseWriter, r *http.Request) {
	courseID := chi.URLParam(r, "id")
	assignments, err := h.service.ListByCourse(r.Context(), courseID)
	if err != nil {
		log.Printf("[AssignmentHandler.ListByCourse] error: %v", err)
		http.Error(w, "failed to fetch assignments", http.StatusInternalServerError)
		return
	}
	if assignments == nil {
		assignments = []domain.Assignment{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(assignments)
}

// MyAssignments handles GET /api/my-assignments
func (h *AssignmentHandler) MyAssignments(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(UserContextKey).(string)
	assignments, err := h.service.ListForStudent(r.Context(), userID)
	if err != nil {
		log.Printf("[AssignmentHandler.MyAssignments] error: %v", err)
		http.Error(w, "failed to fetch assignments", http.StatusInternalServerError)
		return
	}
	if assignments == nil {
		assignments = []domain.Assignment{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(assignments)
}

// Submit handles POST /api/assignments/{id}/submit
func (h *AssignmentHandler) Submit(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(UserContextKey).(string)
	assignmentID := chi.URLParam(r, "id")

	var sub domain.Submission
	if err := json.NewDecoder(r.Body).Decode(&sub); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	sub.AssignmentID = assignmentID
	sub.StudentUserID = userID

	if err := h.service.Submit(r.Context(), &sub); err != nil {
		log.Printf("[AssignmentHandler.Submit] error: %v", err)
		http.Error(w, "failed to submit", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(sub)
}

// ListSubmissions handles GET /api/assignments/{id}/submissions
func (h *AssignmentHandler) ListSubmissions(w http.ResponseWriter, r *http.Request) {
	assignmentID := chi.URLParam(r, "id")
	submissions, err := h.service.ListSubmissions(r.Context(), assignmentID)
	if err != nil {
		log.Printf("[AssignmentHandler.ListSubmissions] error: %v", err)
		http.Error(w, "failed to fetch submissions", http.StatusInternalServerError)
		return
	}
	if submissions == nil {
		submissions = []domain.Submission{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(submissions)
}

type gradeSubmissionRequest struct {
	Score    float64 `json:"score"`
	Feedback string  `json:"feedback"`
}

// GradeSubmission handles POST /api/submissions/{id}/grade
func (h *AssignmentHandler) GradeSubmission(w http.ResponseWriter, r *http.Request) {
	submissionID := chi.URLParam(r, "id")
	var req gradeSubmissionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.service.GradeSubmission(r.Context(), submissionID, req.Score, req.Feedback); err != nil {
		log.Printf("[AssignmentHandler.GradeSubmission] error: %v", err)
		http.Error(w, "failed to grade submission", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "graded"})
}
