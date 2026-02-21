package handler

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/schooltj/internal/domain"
)

type DashboardHandler struct {
	db *sql.DB
}

func NewDashboardHandler(db *sql.DB) *DashboardHandler {
	return &DashboardHandler{db: db}
}

type DashboardStats struct {
	TotalStudents    int     `json:"total_students"`
	TotalCourses     int     `json:"total_courses"`
	TotalTeachers    int     `json:"total_teachers"`
	TotalRevenue     float64 `json:"total_revenue"`
	ActiveEnrolments int     `json:"active_enrolments"`
	AvgAttendance    float64 `json:"avg_attendance"`
	RecentPayments   int     `json:"recent_payments"`
	PendingRequests  int     `json:"pending_requests"`
}

type RecentActivity struct {
	Type      string `json:"type"`
	Message   string `json:"message"`
	Timestamp string `json:"timestamp"`
}

// GetStats handles GET /api/dashboard/stats
func (h *DashboardHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	_, ok := r.Context().Value(UserContextKey).(string)
	role, okRole := r.Context().Value(RoleContextKey).(domain.Role)

	if !ok || !okRole {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var stats DashboardStats

	if role == domain.RoleSchoolAdmin || role == domain.RoleTeacher {
		h.db.QueryRow("SELECT COUNT(*) FROM students").Scan(&stats.TotalStudents)
		h.db.QueryRow("SELECT COUNT(*) FROM courses").Scan(&stats.TotalCourses)
		h.db.QueryRow("SELECT COUNT(*) FROM teacher_profiles").Scan(&stats.TotalTeachers)
		h.db.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM payments").Scan(&stats.TotalRevenue)
		h.db.QueryRow("SELECT COUNT(*) FROM enrollments WHERE status = 'active'").Scan(&stats.ActiveEnrolments)
		h.db.QueryRow(`
			SELECT COALESCE(
				ROUND(SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 1),
			0) FROM attendance
		`).Scan(&stats.AvgAttendance)
		h.db.QueryRow("SELECT COUNT(*) FROM payments WHERE paid_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)").Scan(&stats.RecentPayments)
		h.db.QueryRow("SELECT COUNT(*) FROM enrollments WHERE status = 'pending'").Scan(&stats.PendingRequests)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// GetActivity handles GET /api/dashboard/activity
func (h *DashboardHandler) GetActivity(w http.ResponseWriter, r *http.Request) {
	_, ok := r.Context().Value(UserContextKey).(string)
	_, okRole := r.Context().Value(RoleContextKey).(domain.Role)

	if !ok || !okRole {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var activities []RecentActivity

	// Recent enrollments
	rows, err := h.db.Query(`
		SELECT COALESCE(u.name, u.email), c.title, e.enrolled_at
		FROM enrollments e
		JOIN users u ON e.student_user_id = u.id
		JOIN courses c ON e.course_id = c.id
		WHERE e.status = 'active'
		ORDER BY e.enrolled_at DESC
		LIMIT 5
	`)
	if err != nil {
		log.Printf("[DashboardHandler.GetActivity] enrollment query error: %v", err)
	} else {
		defer rows.Close()
		for rows.Next() {
			var name, course, ts string
			rows.Scan(&name, &course, &ts)
			activities = append(activities, RecentActivity{
				Type:      "enrollment",
				Message:   name + " enrolled in " + course,
				Timestamp: ts,
			})
		}
	}

	// Recent payments
	rows2, err := h.db.Query(`
		SELECT COALESCE(u.name, u.email), c.title, p.amount, p.paid_at
		FROM payments p
		JOIN users u ON p.student_user_id = u.id
		JOIN courses c ON p.course_id = c.id
		ORDER BY p.paid_at DESC
		LIMIT 5
	`)
	if err != nil {
		log.Printf("[DashboardHandler.GetActivity] payment query error: %v", err)
	} else {
		defer rows2.Close()
		for rows2.Next() {
			var name, course, ts string
			var amount float64
			rows2.Scan(&name, &course, &amount, &ts)
			activities = append(activities, RecentActivity{
				Type:      "payment",
				Message:   fmt.Sprintf("%s paid $%.2f for %s", name, amount, course),
				Timestamp: ts,
			})
		}
	}

	// Recent announcements
	rows3, err := h.db.Query(`
		SELECT COALESCE(u.name, u.email), a.title, a.created_at
		FROM announcements a
		JOIN users u ON a.author_id = u.id
		ORDER BY a.created_at DESC
		LIMIT 3
	`)
	if err == nil {
		defer rows3.Close()
		for rows3.Next() {
			var author, title, ts string
			rows3.Scan(&author, &title, &ts)
			activities = append(activities, RecentActivity{
				Type:      "announcement",
				Message:   author + " posted: " + title,
				Timestamp: ts,
			})
		}
	}

	if activities == nil {
		activities = []RecentActivity{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(activities)
}
