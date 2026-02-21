package handler

import (
	"context"
	"fmt"
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
				// Debug log
				fmt.Println("AuthMiddleware: Missing authorization header")
				http.Error(w, "authorization header required", http.StatusUnauthorized)
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				fmt.Printf("AuthMiddleware: Invalid header format: %s\n", authHeader)
				http.Error(w, "invalid authorization header format", http.StatusUnauthorized)
				return
			}

			tokenString := parts[1]
			claims, err := authService.VerifyToken(tokenString)
			if err != nil {
				fmt.Printf("AuthMiddleware: Token verification failed: %v\n", err)
				http.Error(w, "invalid token", http.StatusUnauthorized)
				return
			}

			// Add basic user info to context
			userID, okID := claims["sub"].(string)
			roleStr, okRole := claims["role"].(string)
			if !okID || !okRole {
				fmt.Println("AuthMiddleware: Invalid claims")
				http.Error(w, "invalid token claims", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), UserContextKey, userID)
			ctx = context.WithValue(ctx, RoleContextKey, domain.Role(roleStr))
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
