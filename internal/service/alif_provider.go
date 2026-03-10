package service

import (
	"context"
	"fmt"

	"github.com/schooltj/internal/domain"
)

// AlifProvider implements Alif Pay (Alif Mobi) integration.
type AlifProvider struct {
	MerchantID string
	Secret     string
}

func NewAlifProvider(merchantID, secret string) *AlifProvider {
	return &AlifProvider{
		MerchantID: merchantID,
		Secret:     secret,
	}
}

func (p *AlifProvider) Name() string {
	return domain.PaymentMethodAlif
}

func (p *AlifProvider) InitiatePayment(ctx context.Context, pay *domain.Payment) (string, string, error) {
	// In a real implementation, this would send a request to Alif's payment API
	// e.g. POST https://api.alifpay.tj/v1/checkout
	// with MerchantID and Amount.

	// For now, we simulate a provider transaction ID and a checkout URL.
	providerID := fmt.Sprintf("ALF-%s", pay.ID)
	mockRedirectURL := fmt.Sprintf("https://alifpay.tj/pay/%s?amount=%.2f", providerID, pay.Amount)

	return mockRedirectURL, providerID, nil
}

func (p *AlifProvider) HandleCallback(ctx context.Context, payload interface{}) (string, string, error) {
	// Typically Alif sends a JSON/Form POST with 'transaction_id', 'status', and 'signature'.
	// This would involve signature verification.

	// Mock logic:
	return "ALF-MOCK-ID", domain.PaymentStatusSuccess, nil
}

func (p *AlifProvider) GetStatus(ctx context.Context, providerID string) (string, error) {
	// Query Alif API for status: GET https://api.alifpay.tj/v1/status/{providerID}
	return domain.PaymentStatusSuccess, nil
}
