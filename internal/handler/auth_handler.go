package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/service"
)

type AuthHandler struct {
	service *service.AuthService
}

func NewAuthHandler(s *service.AuthService) *AuthHandler {
	return &AuthHandler{service: s}
}

type registerRequest struct {
	Email    string      `json:"email"`
	Password string      `json:"password"`
	Role     domain.Role `json:"role"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type updateProfileRequest struct {
	Email string `json:"email"`
	Name  string `json:"name"`
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.Role == "" {
		req.Role = domain.RoleStudent // default
	}

	user, err := h.service.Register(r.Context(), req.Email, req.Password, req.Role)
	if err != nil {
		if err == service.ErrEmailAlreadyExists {
			http.Error(w, err.Error(), http.StatusConflict)
			return
		}
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	token, err := h.service.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		if err == service.ErrInvalidCredentials {
			http.Error(w, "invalid credentials", http.StatusUnauthorized)
			return
		}
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"token": token})
}

func (h *AuthHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	user, err := h.service.GetUserByID(r.Context(), userID)
	if err != nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(user)
}

func (h *AuthHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req updateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	user, err := h.service.UpdateUser(r.Context(), userID, req.Name, req.Email)
	if err != nil {
		log.Printf("UpdateProfile error: %v", err)
		http.Error(w, "failed to update profile", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(user)
}
