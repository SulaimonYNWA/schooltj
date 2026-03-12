package handler

import (
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	"github.com/schooltj/internal/service"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Allow all origins for now (adjust in production)
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// Client is a middleman between the websocket connection and the hub.
type Client struct {
	hub    *WSHub
	userID string
	conn   *websocket.Conn
	send   chan []byte
}

// WSHub manages all active WebSocket connections.
type WSHub struct {
	mu      sync.RWMutex
	clients map[string]map[*Client]bool
}

var globalHub = &WSHub{
	clients: make(map[string]map[*Client]bool),
}

// BroadcastToUser sends a raw JSON payload to all open connections for a user.
func BroadcastToUser(userID, payload string) {
	globalHub.mu.RLock()
	defer globalHub.mu.RUnlock()

	if clients, ok := globalHub.clients[userID]; ok {
		for client := range clients {
			select {
			case client.send <- []byte(payload):
			default:
				close(client.send)
				delete(globalHub.clients[userID], client)
			}
		}
	}
}

// writePump pumps messages from the hub to the websocket connection.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued chat messages to the current websocket message.
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// readPump pumps messages from the websocket connection to the hub.
func (c *Client) readPump() {
	defer func() {
		c.hub.mu.Lock()
		if clients, ok := c.hub.clients[c.userID]; ok {
			delete(clients, c)
			if len(clients) == 0 {
				delete(c.hub.clients, c.userID)
			}
			log.Printf("[WSHub] user %s disconnected (remaining cons: %d)", c.userID, len(c.hub.clients[c.userID]))
		}
		c.hub.mu.Unlock()
		c.conn.Close()
	}()
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[WSHub] read error: %v", err)
			}
			break
		}
		// We rely mostly on server push, so incoming messages (if any) are ignored or handled here
	}
}

// WSHandler handles the WebSocket upgrade for real-time messaging.
type WSHandler struct {
	messageService *service.MessageService
	jwtSecret      string
}

func NewWSHandler(ms *service.MessageService, jwtSecret string) *WSHandler {
	return &WSHandler{messageService: ms, jwtSecret: jwtSecret}
}

// Stream handles GET /api/ws  — upgraded to WebSockets
// The client passes the JWT as ?token=<jwt>.
func (h *WSHandler) Stream(w http.ResponseWriter, r *http.Request) {
	// Authenticate via query param
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
		userID, _ = r.Context().Value(UserContextKey).(string)
	}
	if userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[WSHandler.Stream] upgrade error: %v", err)
		return
	}

	client := &Client{
		hub:    globalHub,
		userID: userID,
		conn:   conn,
		send:   make(chan []byte, 256),
	}

	// Register
	globalHub.mu.Lock()
	if globalHub.clients[userID] == nil {
		globalHub.clients[userID] = make(map[*Client]bool)
	}
	globalHub.clients[userID][client] = true
	globalHub.mu.Unlock()

	log.Printf("[WSHub] user %s connected (total connections: %d)", userID, len(globalHub.clients[userID]))

	// Allow collection of memory referenced by the caller by doing all work in new goroutines.
	go client.writePump()
	go client.readPump()
}
