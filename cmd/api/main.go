package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/schooltj/internal/handler"
	"github.com/schooltj/internal/repository"
	"github.com/schooltj/internal/service"
)

func main() {
	// Setup logging to file and stdout
	logFile, err := os.OpenFile("server.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Fatalf("error opening log file: %v", err)
	}
	defer logFile.Close()
	mw := io.MultiWriter(os.Stdout, logFile)
	log.SetOutput(mw)

	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASSWORD")
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbName := os.Getenv("DB_NAME")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true", dbUser, dbPass, dbHost, dbPort, dbName)

	// Fallback for local dev if envs not set (or use .env loading)
	if dbHost == "" {
		dsn = "user:password@tcp(localhost:3307)/schoolcrm?parseTime=true"
	}

	repo, err := repository.NewRepository(dsn)
	if err != nil {
		log.Fatal("Could not connect to database:", err)
	}
	defer repo.DB.Close()

	// Dependency Injection
	userRepo := repository.NewUserRepository(repo.DB)
	schoolRepo := repository.NewSchoolRepository(repo.DB)
	authService := service.NewAuthService(userRepo, schoolRepo, "your-secret-key") // TODO: Move secret to env
	authHandler := handler.NewAuthHandler(authService)
	courseRepo := repository.NewCourseRepository(repo.DB)
	courseService := service.NewCourseService(courseRepo, schoolRepo, userRepo)
	schoolService := service.NewSchoolService(schoolRepo, authService, courseService)
	schoolHandler := handler.NewSchoolHandler(schoolService)
	courseHandler := handler.NewCourseHandler(courseService)
	ratingRepo := repository.NewRatingRepository(repo.DB)
	ratingService := service.NewRatingService(ratingRepo)
	ratingHandler := handler.NewRatingHandler(ratingService)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://*", "http://*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})

	r.Post("/register", authHandler.Register)
	r.Post("/login", authHandler.Login)

	r.Group(func(r chi.Router) {
		r.Use(handler.AuthMiddleware(authService))
		r.Get("/me", authHandler.GetProfile)
		r.Put("/me", authHandler.UpdateProfile)
		r.Get("/api/schools/teachers", schoolHandler.ListTeachers)
		r.Post("/api/schools/teachers", schoolHandler.AddTeacher)

		// Course routes
		r.Get("/api/courses", courseHandler.List)
		r.Post("/api/courses", courseHandler.Create)

		// Rating routes
		r.Post("/api/ratings", ratingHandler.SubmitRating)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}
