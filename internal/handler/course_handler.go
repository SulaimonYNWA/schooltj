package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
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
	Title       string           `json:"title"`
	Description string           `json:"description"`
	Schedule    *domain.Schedule `json:"schedule"`
	Price       float64          `json:"price"`
	TeacherID   *string          `json:"teacher_id,omitempty"` // Required for SchoolAdmin
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

	course, err := h.service.CreateCourse(r.Context(), userID, role, req.Title, req.Description, req.Schedule, req.Price, req.TeacherID)
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
		log.Printf("[CourseHandler.List] error: %v", err)
		http.Error(w, "failed to fetch courses", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(courses)
}

type inviteStudentRequest struct {
	Email string `json:"email"`
}

func (h *CourseHandler) Invite(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	role, okRole := r.Context().Value(RoleContextKey).(domain.Role)
	courseID := chi.URLParam(r, "id")

	if !ok || !okRole || courseID == "" {
		http.Error(w, "unauthorized or invalid course", http.StatusUnauthorized)
		return
	}

	var req inviteStudentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	err := h.service.InviteStudent(r.Context(), userID, role, courseID, req.Email)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "invitation sent"}`))
}

type respondInvitationRequest struct {
	Accept bool `json:"accept"`
}

func (h *CourseHandler) RespondInvitation(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	enrollmentID := chi.URLParam(r, "id")

	if !ok || enrollmentID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req respondInvitationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	err := h.service.RespondToInvitation(r.Context(), userID, enrollmentID, req.Accept)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "response recorded"}`))
}

func (h *CourseHandler) RequestAccess(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	role, okRole := r.Context().Value(RoleContextKey).(domain.Role)
	courseID := chi.URLParam(r, "id")

	if !ok || !okRole || courseID == "" {
		http.Error(w, "unauthorized or invalid course", http.StatusUnauthorized)
		return
	}

	if role != domain.RoleStudent {
		http.Error(w, "only students can request access", http.StatusForbidden)
		return
	}

	err := h.service.RequestEnrollment(r.Context(), userID, courseID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "access requested"}`))
}

func (h *CourseHandler) MyEnrollments(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	enrollments, err := h.service.GetStudentEnrollments(r.Context(), userID)
	if err != nil {
		log.Printf("[CourseHandler.MyEnrollments] error: %v", err)
		http.Error(w, "failed to fetch enrollments", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(enrollments)
}

func (h *CourseHandler) CourseEnrollments(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	role, okRole := r.Context().Value(RoleContextKey).(domain.Role)
	courseID := chi.URLParam(r, "id")

	if !ok || !okRole || courseID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	enrollments, err := h.service.GetCourseEnrollments(r.Context(), userID, role, courseID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	json.NewEncoder(w).Encode(enrollments)
}

type approveEnrollmentRequest struct {
	Approve bool `json:"approve"`
}

func (h *CourseHandler) ApproveEnrollment(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	role, okRole := r.Context().Value(RoleContextKey).(domain.Role)
	enrollmentID := chi.URLParam(r, "id")

	if !ok || !okRole || enrollmentID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req approveEnrollmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	err := h.service.ApproveOrRejectEnrollment(r.Context(), userID, role, enrollmentID, req.Approve)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "enrollment updated"}`))
}
