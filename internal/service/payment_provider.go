package service

import (
	"context"

	"github.com/schooltj/internal/domain"
)

// PaymentProvider defines the interface for external payment gateways.
type PaymentProvider interface {
	// Name returns the provider identifier (e.g., "alif", "humo").
	Name() string

	// InitiatePayment starts a payment transaction and returns a redirect URL (if applicable)
	// and a unique transaction ID from the provider.
	InitiatePayment(ctx context.Context, p *domain.Payment) (redirectURL string, providerID string, err error)

	// Callback handles the provider's notification (webhook).
	// It returns the provider's transaction ID and the new status.
	// Note: The specific payload handling might need a more flexible approach depending on the provider.
	HandleCallback(ctx context.Context, payload interface{}) (providerID string, status string, err error)

	// GetStatus checks the current status of a payment by its provider ID.
	GetStatus(ctx context.Context, providerID string) (status string, err error)
}
