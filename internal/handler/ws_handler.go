package handler

import (
	"log"
	"net/http"
	"sync"

	"github.com/golang-jwt/jwt/v5"
	"github.com/schooltj/internal/service"
)

// WSHub manages all active WebSocket connections.
type WSHub struct {
	mu      sync.RWMutex
	clients map[string]map[http.ResponseWriter]http.Flusher // userID -> set of SSE writers (reused for WS simulation)
}

var globalHub = &WSHub{
	clients: make(map[string]map[http.ResponseWriter]http.Flusher),
}

// BroadcastToUser sends a raw JSON payload to all open connections for a user.
func BroadcastToUser(userID, payload string) {
	globalHub.mu.RLock()
	defer globalHub.mu.RUnlock()
	for w, f := range globalHub.clients[userID] {
		_, err := w.Write([]byte("data: " + payload + "\n\n"))
		if err == nil {
			f.Flush()
		}
	}
}

// WSHandler handles the WebSocket-like SSE upgrade for real-time messaging.
type WSHandler struct {
	messageService *service.MessageService
	jwtSecret      string
}

func NewWSHandler(ms *service.MessageService, jwtSecret string) *WSHandler {
	return &WSHandler{messageService: ms, jwtSecret: jwtSecret}
}

// Stream handles GET /api/ws  — upgraded to SSE for live message push.
// The client passes the JWT as ?token=<jwt>.
func (h *WSHandler) Stream(w http.ResponseWriter, r *http.Request) {
	// Authenticate via query param (WebSocket can't set headers easily)
	tokenStr := r.URL.Query().Get("token")
	userID := ""
	if tokenStr != "" {
		tok, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			return []byte(h.jwtSecret), nil
		}, jwt.WithValidMethods([]string{"HS256"}))
		if err == nil && tok.Valid {
			if claims, ok := tok.Claims.(jwt.MapClaims); ok {
				userID, _ = claims["sub"].(string)
			}
		}
	}
	if userID == "" {
		// Fall back to context user (when called server-side / in tests)
		userID, _ = r.Context().Value(UserContextKey).(string)
	}
	if userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	// Register
	globalHub.mu.Lock()
	if globalHub.clients[userID] == nil {
		globalHub.clients[userID] = make(map[http.ResponseWriter]http.Flusher)
	}
	globalHub.clients[userID][w] = flusher
	globalHub.mu.Unlock()

	log.Printf("[WSHub] user %s connected (total connections: %d)", userID, len(globalHub.clients[userID]))

	// Send initial ping
	w.Write([]byte(": connected\n\n"))
	flusher.Flush()

	// Wait for disconnect
	<-r.Context().Done()

	// Deregister
	globalHub.mu.Lock()
	delete(globalHub.clients[userID], w)
	if len(globalHub.clients[userID]) == 0 {
		delete(globalHub.clients, userID)
	}
	globalHub.mu.Unlock()
	log.Printf("[WSHub] user %s disconnected", userID)
}
