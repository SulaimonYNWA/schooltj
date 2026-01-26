package handler

import (
	"context"
	"net/http"
	"strings"

	"github.com/schooltj/internal/domain"
	"github.com/schooltj/internal/service"
)

type contextKey string

const (
	UserContextKey contextKey = "user"
	RoleContextKey contextKey = "role"
)

func AuthMiddleware(authService *service.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "authorization header required", http.StatusUnauthorized)
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				http.Error(w, "invalid authorization header format", http.StatusUnauthorized)
				return
			}

			tokenString := parts[1]
			claims, err := authService.VerifyToken(tokenString)
			if err != nil {
				http.Error(w, "invalid token", http.StatusUnauthorized)
				return
			}

			// Add basic user info to context
			userID, okID := claims["sub"].(string)
			roleStr, okRole := claims["role"].(string)
			if !okID || !okRole {
				http.Error(w, "invalid token claims", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), UserContextKey, userID)
			ctx = context.WithValue(ctx, RoleContextKey, domain.Role(roleStr))
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
