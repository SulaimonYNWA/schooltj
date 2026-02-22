package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/service"
)

type NotificationHandler struct {
	service *service.NotificationService
}

func NewNotificationHandler(s *service.NotificationService) *NotificationHandler {
	return &NotificationHandler{service: s}
}

// List handles GET /api/notifications
func (h *NotificationHandler) List(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(UserContextKey).(string)
	notifications, err := h.service.ListByUser(r.Context(), userID)
	if err != nil {
		log.Printf("[NotificationHandler.List] error: %v", err)
		http.Error(w, "failed to fetch notifications", http.StatusInternalServerError)
		return
	}
	if notifications == nil {
		notifications = []domain.Notification{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(notifications)
}

// UnreadCount handles GET /api/notifications/unread-count
func (h *NotificationHandler) UnreadCount(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(UserContextKey).(string)
	count, err := h.service.UnreadCount(r.Context(), userID)
	if err != nil {
		log.Printf("[NotificationHandler.UnreadCount] error: %v", err)
		http.Error(w, "failed to get count", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int{"count": count})
}

// MarkAllRead handles POST /api/notifications/mark-all-read
func (h *NotificationHandler) MarkAllRead(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(UserContextKey).(string)
	if err := h.service.MarkAllRead(r.Context(), userID); err != nil {
		log.Printf("[NotificationHandler.MarkAllRead] error: %v", err)
		http.Error(w, "failed to mark all read", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// MarkRead handles POST /api/notifications/{id}/read
func (h *NotificationHandler) MarkRead(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(UserContextKey).(string)
	id := chi.URLParam(r, "id")
	if err := h.service.MarkRead(r.Context(), id, userID); err != nil {
		log.Printf("[NotificationHandler.MarkRead] error: %v", err)
		http.Error(w, "failed to mark read", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}
