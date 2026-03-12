package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/schooltj/internal/repository"
	"github.com/schooltj/internal/service"
)

type RatingHandler struct {
	service    *service.RatingService
	ratingRepo *repository.RatingRepository
}

func NewRatingHandler(s *service.RatingService, rr *repository.RatingRepository) *RatingHandler {
	return &RatingHandler{service: s, ratingRepo: rr}
}

type submitRatingRequest struct {
	ToUserID   *string `json:"to_user_id,omitempty"`
	ToSchoolID *string `json:"to_school_id,omitempty"`
	ToCourseID *string `json:"to_course_id,omitempty"`
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

	rating, err := h.service.SubmitRating(r.Context(), fromUserID, req.Score, req.Comment, req.ToUserID, req.ToSchoolID, req.ToCourseID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(rating)
}

func (h *RatingHandler) ListUserRatings(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "id")
	if userID == "" {
		http.Error(w, "user id required", http.StatusBadRequest)
		return
	}

	ratings, err := h.ratingRepo.ListRatingsForUser(r.Context(), userID)
	if err != nil {
		http.Error(w, "failed to fetch ratings", http.StatusInternalServerError)
		return
	}
	if ratings == nil {
		ratings = []repository.RatingWithReviewer{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ratings)
}

func (h *RatingHandler) ListSchoolRatings(w http.ResponseWriter, r *http.Request) {
	schoolID := chi.URLParam(r, "id")
	if schoolID == "" {
		http.Error(w, "school id required", http.StatusBadRequest)
		return
	}

	ratings, err := h.ratingRepo.ListRatingsForSchool(r.Context(), schoolID)
	if err != nil {
		http.Error(w, "failed to fetch ratings", http.StatusInternalServerError)
		return
	}
	if ratings == nil {
		ratings = []repository.RatingWithReviewer{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ratings)
}

func (h *RatingHandler) ListCourseRatings(w http.ResponseWriter, r *http.Request) {
	courseID := chi.URLParam(r, "id")
	if courseID == "" {
		http.Error(w, "course id required", http.StatusBadRequest)
		return
	}

	ratings, err := h.ratingRepo.ListRatingsForCourse(r.Context(), courseID)
	if err != nil {
		http.Error(w, "failed to fetch ratings", http.StatusInternalServerError)
		return
	}
	if ratings == nil {
		ratings = []repository.RatingWithReviewer{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ratings)
}
