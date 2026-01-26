package handler

import (
	"encoding/json"
	"net/http"

	"github.com/schooltj/internal/service"
)

type RatingHandler struct {
	service *service.RatingService
}

func NewRatingHandler(s *service.RatingService) *RatingHandler {
	return &RatingHandler{service: s}
}

type submitRatingRequest struct {
	ToUserID   *string `json:"to_user_id,omitempty"`
	ToSchoolID *string `json:"to_school_id,omitempty"`
	Score      int     `json:"score"`
	Comment    string  `json:"comment"`
}

func (h *RatingHandler) SubmitRating(w http.ResponseWriter, r *http.Request) {
	fromUserID, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req submitRatingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	rating, err := h.service.SubmitRating(r.Context(), fromUserID, req.Score, req.Comment, req.ToUserID, req.ToSchoolID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(rating)
}
