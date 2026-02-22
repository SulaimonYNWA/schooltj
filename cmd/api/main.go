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
	studentRepo := repository.NewStudentRepository(repo.DB)                                     // Create studentRepo earlier
	authService := service.NewAuthService(userRepo, schoolRepo, studentRepo, "your-secret-key") // TODO: Move secret to env
	authHandler := handler.NewAuthHandler(authService)
	courseRepo := repository.NewCourseRepository(repo.DB)
	courseService := service.NewCourseService(courseRepo, schoolRepo, userRepo, studentRepo) // Inject studentRepo
	schoolService := service.NewSchoolService(schoolRepo, authService, courseService)
	schoolHandler := handler.NewSchoolHandler(schoolService, schoolRepo)
	courseHandler := handler.NewCourseHandler(courseService)
	ratingRepo := repository.NewRatingRepository(repo.DB)
	ratingService := service.NewRatingService(ratingRepo)
	ratingHandler := handler.NewRatingHandler(ratingService)
	studentService := service.NewStudentService(studentRepo)
	studentHandler := handler.NewStudentHandler(studentService)
	attendanceRepo := repository.NewAttendanceRepository(repo.DB)
	attendanceService := service.NewAttendanceService(attendanceRepo)
	attendanceHandler := handler.NewAttendanceHandler(attendanceService)
	paymentRepo := repository.NewPaymentRepository(repo.DB)
	paymentService := service.NewPaymentService(paymentRepo)
	paymentHandler := handler.NewPaymentHandler(paymentService)
	announcementRepo := repository.NewAnnouncementRepository(repo.DB)
	announcementService := service.NewAnnouncementService(announcementRepo)
	announcementHandler := handler.NewAnnouncementHandler(announcementService)
	dashboardHandler := handler.NewDashboardHandler(repo.DB)
	settingsHandler := handler.NewSettingsHandler(authService)
	gradeRepo := repository.NewGradeRepository(repo.DB)
	gradeService := service.NewGradeService(gradeRepo)
	gradeHandler := handler.NewGradeHandler(gradeService)
	notificationRepo := repository.NewNotificationRepository(repo.DB)
	notificationService := service.NewNotificationService(notificationRepo)
	notificationHandler := handler.NewNotificationHandler(notificationService)
	assignmentRepo := repository.NewAssignmentRepository(repo.DB)
	assignmentService := service.NewAssignmentService(assignmentRepo)
	assignmentHandler := handler.NewAssignmentHandler(assignmentService)
	messageRepo := repository.NewMessageRepository(repo.DB)
	messageService := service.NewMessageService(messageRepo)
	messageHandler := handler.NewMessageHandler(messageService)
	courseContentRepo := repository.NewCourseContentRepository(repo.DB)
	courseContentService := service.NewCourseContentService(courseContentRepo, courseRepo)
	courseContentHandler := handler.NewCourseContentHandler(courseContentService)

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
		r.Get("/api/users/search", authHandler.SearchUsers)
		r.Get("/api/schools/teachers", schoolHandler.ListTeachers)
		r.Post("/api/schools/teachers", schoolHandler.AddTeacher)
		r.Get("/api/schools", schoolHandler.ListSchools)
		r.Get("/api/schools/{id}", schoolHandler.GetSchoolDetail)

		// Course routes
		r.Get("/api/courses", courseHandler.List)
		r.Post("/api/courses", courseHandler.Create)
		r.Post("/api/courses/{id}/invite", courseHandler.Invite)
		r.Post("/api/courses/{id}/request-access", courseHandler.RequestAccess)
		r.Post("/api/invitations/{id}/respond", courseHandler.RespondInvitation)
		r.Get("/api/my-enrollments", courseHandler.MyEnrollments)
		r.Get("/api/courses/{id}/enrollments", courseHandler.CourseEnrollments)
		r.Post("/api/enrollments/{id}/approve", courseHandler.ApproveEnrollment)

		// Course content routes (curriculum & materials)
		r.Get("/api/courses/{id}/curriculum", courseContentHandler.ListTopics)
		r.Post("/api/courses/{id}/curriculum", courseContentHandler.AddTopic)
		r.Put("/api/courses/{id}/curriculum/{topicId}", courseContentHandler.UpdateTopic)
		r.Delete("/api/courses/{id}/curriculum/{topicId}", courseContentHandler.DeleteTopic)
		r.Get("/api/courses/{id}/materials", courseContentHandler.ListMaterials)
		r.Post("/api/courses/{id}/materials", courseContentHandler.UploadMaterial)
		r.Get("/api/materials/{id}/download", courseContentHandler.DownloadMaterial)
		r.Delete("/api/materials/{id}", courseContentHandler.DeleteMaterial)

		// Rating routes
		r.Post("/api/ratings", ratingHandler.SubmitRating)

		// Student routes
		r.Get("/api/students", studentHandler.List)
		r.Get("/api/my-students", studentHandler.ListMyStudents)

		// Attendance routes
		r.Post("/api/courses/{id}/attendance", attendanceHandler.MarkAttendance)
		r.Get("/api/courses/{id}/attendance", attendanceHandler.GetSessionAttendance)
		r.Get("/api/courses/{id}/roster", attendanceHandler.GetCourseRoster)
		r.Get("/api/my-attendance", attendanceHandler.MyAttendance)
		r.Get("/api/my-attendance/summary", attendanceHandler.MyAttendanceSummary)

		// Payment routes
		r.Post("/api/payments", paymentHandler.RecordPayment)
		r.Get("/api/payments", paymentHandler.ListPayments)
		r.Get("/api/my-payments", paymentHandler.MyPayments)

		// Announcement routes
		r.Post("/api/announcements", announcementHandler.Create)
		r.Get("/api/announcements", announcementHandler.List)
		r.Delete("/api/announcements/{id}", announcementHandler.Delete)

		// Dashboard routes
		r.Get("/api/dashboard/stats", dashboardHandler.GetStats)
		r.Get("/api/dashboard/activity", dashboardHandler.GetActivity)

		// Settings routes
		r.Post("/api/settings/change-password", settingsHandler.ChangePassword)

		// Grade routes
		r.Post("/api/courses/{id}/grades", gradeHandler.CreateGrade)
		r.Get("/api/courses/{id}/grades", gradeHandler.ListCourseGrades)
		r.Get("/api/my-grades", gradeHandler.MyGrades)

		// Notification routes
		r.Get("/api/notifications", notificationHandler.List)
		r.Get("/api/notifications/unread-count", notificationHandler.UnreadCount)
		r.Post("/api/notifications/mark-all-read", notificationHandler.MarkAllRead)
		r.Post("/api/notifications/{id}/read", notificationHandler.MarkRead)

		// Assignment routes
		r.Post("/api/courses/{id}/assignments", assignmentHandler.Create)
		r.Get("/api/courses/{id}/assignments", assignmentHandler.ListByCourse)
		r.Get("/api/my-assignments", assignmentHandler.MyAssignments)
		r.Post("/api/assignments/{id}/submit", assignmentHandler.Submit)
		r.Get("/api/assignments/{id}/submissions", assignmentHandler.ListSubmissions)
		r.Post("/api/submissions/{id}/grade", assignmentHandler.GradeSubmission)

		// Message routes
		r.Post("/api/messages", messageHandler.Send)
		r.Get("/api/messages/conversations", messageHandler.ListConversations)
		r.Get("/api/messages/unread-count", messageHandler.UnreadCount)
		r.Get("/api/messages/{userId}", messageHandler.GetConversation)
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
