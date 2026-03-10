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
	userID, ok := r.Context().Value(UserContextKey).(string)
	role, okRole := r.Context().Value(RoleContextKey).(domain.Role)

	if !ok || !okRole {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	courseID := r.URL.Query().Get("course_id")
	payments, err := h.service.ListPayments(r.Context(), userID, role, courseID)
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

type InitiatePaymentRequest struct {
	CourseID string  `json:"course_id"`
	Amount   float64 `json:"amount"`
	Provider string  `json:"provider"` // alif, humo, etc.
}

// InitiatePayment handles POST /api/payments/initiate
func (h *PaymentHandler) InitiatePayment(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req InitiatePaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	redirectURL, err := h.service.InitiateExternalPayment(r.Context(), userID, req.CourseID, req.Provider, req.Amount)
	if err != nil {
		log.Printf("[PaymentHandler.InitiatePayment] error: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"redirect_url": redirectURL,
	})
}

// HandleAlifCallback handles POST /api/payments/callback/alif
func (h *PaymentHandler) HandleAlifCallback(w http.ResponseWriter, r *http.Request) {
	// For webhooks, we often can't use the standard auth middleware
	// We might need a separate way to parse payload or just raw body
	var payload interface{}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid payload", http.StatusBadRequest)
		return
	}

	if err := h.service.ProcessWebhook(r.Context(), "alif", payload); err != nil {
		log.Printf("[PaymentHandler.HandleAlifCallback] error: %v", err)
		http.Error(w, "processing failed", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}
