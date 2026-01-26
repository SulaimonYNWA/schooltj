package service

import (
	"context"
	"errors"

	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/repository"
)

type RatingService struct {
	repo *repository.RatingRepository
}

func NewRatingService(repo *repository.RatingRepository) *RatingService {
	return &RatingService{repo: repo}
}

func (s *RatingService) SubmitRating(ctx context.Context, fromUserID string, score int, comment string, toUserID *string, toSchoolID *string) (*domain.Rating, error) {
	if score < 1 || score > 10 {
		return nil, errors.New("score must be between 1 and 10")
	}

	if (toUserID == nil && toSchoolID == nil) || (toUserID != nil && toSchoolID != nil) {
		return nil, errors.New("must specify exactly one target (user or school)")
	}

	// Check collaboration
	collaborates, err := s.repo.CheckCollaboration(ctx, fromUserID, toUserID, toSchoolID)
	if err != nil {
		return nil, err
	}
	if !collaborates {
		return nil, errors.New("not authorized to rate: you must collaborate together in a course first")
	}

	rating := &domain.Rating{
		FromUserID: fromUserID,
		ToUserID:   toUserID,
		ToSchoolID: toSchoolID,
		Score:      score,
		Comment:    comment,
	}

	if err := s.repo.CreateRating(ctx, rating); err != nil {
		return nil, err
	}

	return rating, nil
}
