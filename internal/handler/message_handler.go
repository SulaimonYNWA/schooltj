package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/service"
)

type MessageHandler struct {
	service *service.MessageService
}

func NewMessageHandler(s *service.MessageService) *MessageHandler {
	return &MessageHandler{service: s}
}

// Send handles POST /api/messages
func (h *MessageHandler) Send(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(UserContextKey).(string)

	var m domain.Message
	if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	m.FromUserID = userID

	if err := h.service.Send(r.Context(), &m); err != nil {
		log.Printf("[MessageHandler.Send] error: %v", err)
		http.Error(w, "failed to send message", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(m)
}

// ListConversations handles GET /api/messages/conversations
func (h *MessageHandler) ListConversations(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(UserContextKey).(string)
	conversations, err := h.service.ListConversations(r.Context(), userID)
	if err != nil {
		log.Printf("[MessageHandler.ListConversations] error: %v", err)
		http.Error(w, "failed to fetch conversations", http.StatusInternalServerError)
		return
	}
	if conversations == nil {
		conversations = []domain.Conversation{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(conversations)
}

// GetConversation handles GET /api/messages/{userId}
func (h *MessageHandler) GetConversation(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(UserContextKey).(string)
	otherUserID := chi.URLParam(r, "userId")

	// Mark incoming messages as read
	_ = h.service.MarkConversationRead(r.Context(), otherUserID, userID)

	messages, err := h.service.GetConversation(r.Context(), userID, otherUserID)
	if err != nil {
		log.Printf("[MessageHandler.GetConversation] error: %v", err)
		http.Error(w, "failed to fetch messages", http.StatusInternalServerError)
		return
	}
	if messages == nil {
		messages = []domain.Message{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}

// UnreadCount handles GET /api/messages/unread-count
func (h *MessageHandler) UnreadCount(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(UserContextKey).(string)
	count, err := h.service.UnreadCount(r.Context(), userID)
	if err != nil {
		log.Printf("[MessageHandler.UnreadCount] error: %v", err)
		http.Error(w, "failed to get count", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int{"count": count})
}
