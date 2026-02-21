package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/service"
)

type PaymentHandler struct {
	service *service.PaymentService
}

func NewPaymentHandler(s *service.PaymentService) *PaymentHandler {
	return &PaymentHandler{service: s}
}

// RecordPayment handles POST /api/payments
func (h *PaymentHandler) RecordPayment(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	role, okRole := r.Context().Value(RoleContextKey).(domain.Role)

	if !ok || !okRole {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var input service.RecordPaymentInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	payment, err := h.service.RecordPayment(r.Context(), userID, role, input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(payment)
}

// ListPayments handles GET /api/payments?course_id=
func (h *PaymentHandler) ListPayments(w http.ResponseWriter, r *http.Request) {
	_, ok := r.Context().Value(UserContextKey).(string)
	role, okRole := r.Context().Value(RoleContextKey).(domain.Role)

	if !ok || !okRole {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	courseID := r.URL.Query().Get("course_id")
	payments, err := h.service.ListPayments(r.Context(), role, courseID)
	if err != nil {
		log.Printf("[PaymentHandler.ListPayments] error: %v", err)
		http.Error(w, "failed to fetch payments", http.StatusInternalServerError)
		return
	}
	if payments == nil {
		payments = []domain.Payment{}
	}
	json.NewEncoder(w).Encode(payments)
}

// MyPayments handles GET /api/my-payments
func (h *PaymentHandler) MyPayments(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	payments, err := h.service.MyPayments(r.Context(), userID)
	if err != nil {
		log.Printf("[PaymentHandler.MyPayments] error: %v", err)
		http.Error(w, "failed to fetch payments", http.StatusInternalServerError)
		return
	}
	if payments == nil {
		payments = []domain.Payment{}
	}
	json.NewEncoder(w).Encode(payments)
}
