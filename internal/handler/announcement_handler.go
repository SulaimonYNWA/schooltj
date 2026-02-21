package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/service"
)

type AnnouncementHandler struct {
	service *service.AnnouncementService
}

func NewAnnouncementHandler(s *service.AnnouncementService) *AnnouncementHandler {
	return &AnnouncementHandler{service: s}
}

type createAnnouncementRequest struct {
	CourseID *string `json:"course_id,omitempty"`
	Title    string  `json:"title"`
	Content  string  `json:"content"`
	IsPinned bool    `json:"is_pinned"`
}

// Create handles POST /api/announcements
func (h *AnnouncementHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	role, okRole := r.Context().Value(RoleContextKey).(domain.Role)

	if !ok || !okRole {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req createAnnouncementRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Title == "" {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	a := &domain.Announcement{
		CourseID: req.CourseID,
		Title:    req.Title,
		Content:  req.Content,
		IsPinned: req.IsPinned,
	}

	err := h.service.Create(r.Context(), userID, role, a)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(a)
}

// List handles GET /api/announcements?course_id=
func (h *AnnouncementHandler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	role, okRole := r.Context().Value(RoleContextKey).(domain.Role)

	if !ok || !okRole {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	courseID := r.URL.Query().Get("course_id")
	if courseID != "" {
		announcements, err := h.service.ListByCourse(r.Context(), courseID)
		if err != nil {
			http.Error(w, "failed to fetch announcements", http.StatusInternalServerError)
			return
		}
		if announcements == nil {
			announcements = []domain.Announcement{}
		}
		json.NewEncoder(w).Encode(announcements)
		return
	}

	announcements, err := h.service.MyFeed(r.Context(), userID, role)
	if err != nil {
		http.Error(w, "failed to fetch announcements", http.StatusInternalServerError)
		return
	}
	if announcements == nil {
		announcements = []domain.Announcement{}
	}
	json.NewEncoder(w).Encode(announcements)
}

// Delete handles DELETE /api/announcements/{id}
func (h *AnnouncementHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	announcementID := chi.URLParam(r, "id")

	if !ok || announcementID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	err := h.service.Delete(r.Context(), announcementID, userID)
	if err != nil {
		http.Error(w, "not found or unauthorized", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "deleted"}`))
}
