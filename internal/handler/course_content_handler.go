package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/service"
)

type CourseContentHandler struct {
	service *service.CourseContentService
}

func NewCourseContentHandler(s *service.CourseContentService) *CourseContentHandler {
	return &CourseContentHandler{service: s}
}

// ── Curriculum Topics ──

type addTopicRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	SortOrder   int    `json:"sort_order"`
}

func (h *CourseContentHandler) AddTopic(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	courseID := chi.URLParam(r, "id")

	var req addTopicRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Title == "" {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	topic := &domain.CurriculumTopic{
		CourseID:    courseID,
		Title:       req.Title,
		Description: req.Description,
		SortOrder:   req.SortOrder,
	}

	if err := h.service.AddTopic(r.Context(), userID, topic); err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(topic)
}

func (h *CourseContentHandler) ListTopics(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	role, okRole := r.Context().Value(RoleContextKey).(domain.Role)
	if !ok || !okRole {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	courseID := chi.URLParam(r, "id")

	topics, err := h.service.ListTopics(r.Context(), userID, role, courseID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	json.NewEncoder(w).Encode(topics)
}

type updateTopicRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	SortOrder   int    `json:"sort_order"`
}

func (h *CourseContentHandler) UpdateTopic(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	topicID := chi.URLParam(r, "topicId")

	var req updateTopicRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	topic := &domain.CurriculumTopic{
		ID:          topicID,
		Title:       req.Title,
		Description: req.Description,
		SortOrder:   req.SortOrder,
	}

	if err := h.service.UpdateTopic(r.Context(), userID, topic); err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "topic updated"})
}

func (h *CourseContentHandler) DeleteTopic(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	topicID := chi.URLParam(r, "topicId")

	if err := h.service.DeleteTopic(r.Context(), userID, topicID); err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "topic deleted"})
}

// ── Course Materials ──

func (h *CourseContentHandler) UploadMaterial(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	courseID := chi.URLParam(r, "id")

	// 32 MB max
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		http.Error(w, "file too large or invalid form", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "missing file field", http.StatusBadRequest)
		return
	}
	defer file.Close()

	material, err := h.service.UploadMaterial(r.Context(), userID, courseID, header, file)
	if err != nil {
		log.Printf("[CourseContentHandler.UploadMaterial] error: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(material)
}

func (h *CourseContentHandler) ListMaterials(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	role, okRole := r.Context().Value(RoleContextKey).(domain.Role)
	if !ok || !okRole {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	courseID := chi.URLParam(r, "id")

	materials, err := h.service.ListMaterials(r.Context(), userID, role, courseID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	json.NewEncoder(w).Encode(materials)
}

func (h *CourseContentHandler) DownloadMaterial(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	role, okRole := r.Context().Value(RoleContextKey).(domain.Role)
	if !ok || !okRole {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	materialID := chi.URLParam(r, "id")

	m, err := h.service.GetMaterial(r.Context(), userID, role, materialID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	w.Header().Set("Content-Disposition", "attachment; filename=\""+m.FileName+"\"")
	w.Header().Set("Content-Type", m.ContentType)
	http.ServeFile(w, r, m.FilePath)
}

func (h *CourseContentHandler) DeleteMaterial(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	materialID := chi.URLParam(r, "id")

	if err := h.service.DeleteMaterial(r.Context(), userID, materialID); err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "material deleted"})
}
