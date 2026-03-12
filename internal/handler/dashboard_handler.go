package handler

import (
	"database/sql"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

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
	AvgGrade         float64 `json:"avg_grade"`
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
	userID, ok := r.Context().Value(UserContextKey).(string)
	role, okRole := r.Context().Value(RoleContextKey).(domain.Role)

	if !ok || !okRole {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var stats DashboardStats

	switch role {
	case domain.RoleSchoolAdmin:
		// Scope to the admin's school
		var schoolID string
		h.db.QueryRow("SELECT id FROM schools WHERE admin_user_id = ?", userID).Scan(&schoolID)
		if schoolID != "" {
			h.db.QueryRow("SELECT COUNT(DISTINCT e.student_user_id) FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE c.school_id = ? AND e.status = 'active'", schoolID).Scan(&stats.TotalStudents)
			h.db.QueryRow("SELECT COUNT(*) FROM courses WHERE school_id = ?", schoolID).Scan(&stats.TotalCourses)
			h.db.QueryRow("SELECT COALESCE(AVG(g.score), 0) FROM grades g JOIN courses c ON g.course_id = c.id WHERE c.school_id = ?", schoolID).Scan(&stats.AvgGrade)
			h.db.QueryRow("SELECT COALESCE(SUM(p.amount), 0) FROM payments p JOIN courses c ON p.course_id = c.id WHERE c.school_id = ?", schoolID).Scan(&stats.TotalRevenue)
			h.db.QueryRow("SELECT COUNT(*) FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE c.school_id = ? AND e.status = 'active'", schoolID).Scan(&stats.ActiveEnrolments)
			h.db.QueryRow(`
				SELECT COALESCE(
					ROUND(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 1),
				0) FROM attendance a JOIN enrollments e ON a.enrollment_id = e.id JOIN courses c ON e.course_id = c.id WHERE c.school_id = ?
			`, schoolID).Scan(&stats.AvgAttendance)
			h.db.QueryRow("SELECT COUNT(*) FROM payments p JOIN courses c ON p.course_id = c.id WHERE c.school_id = ? AND p.paid_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)", schoolID).Scan(&stats.RecentPayments)
			h.db.QueryRow("SELECT COUNT(*) FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE c.school_id = ? AND e.status = 'pending'", schoolID).Scan(&stats.PendingRequests)
		}

	case domain.RoleTeacher:
		// Scope to the teacher's own courses
		h.db.QueryRow("SELECT COUNT(DISTINCT e.student_user_id) FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE c.teacher_id = ? AND e.status = 'active'", userID).Scan(&stats.TotalStudents)
		h.db.QueryRow("SELECT COUNT(*) FROM courses WHERE teacher_id = ?", userID).Scan(&stats.TotalCourses)
		h.db.QueryRow("SELECT COALESCE(AVG(g.score), 0) FROM grades g JOIN courses c ON g.course_id = c.id WHERE c.teacher_id = ?", userID).Scan(&stats.AvgGrade)
		h.db.QueryRow("SELECT COALESCE(SUM(p.amount), 0) FROM payments p JOIN courses c ON p.course_id = c.id WHERE c.teacher_id = ?", userID).Scan(&stats.TotalRevenue)
		h.db.QueryRow("SELECT COUNT(*) FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE c.teacher_id = ? AND e.status = 'active'", userID).Scan(&stats.ActiveEnrolments)
		h.db.QueryRow(`
			SELECT COALESCE(
				ROUND(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 1),
			0) FROM attendance a JOIN enrollments e ON a.enrollment_id = e.id JOIN courses c ON e.course_id = c.id WHERE c.teacher_id = ?
		`, userID).Scan(&stats.AvgAttendance)
		h.db.QueryRow("SELECT COUNT(*) FROM payments p JOIN courses c ON p.course_id = c.id WHERE c.teacher_id = ? AND p.paid_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)", userID).Scan(&stats.RecentPayments)
		h.db.QueryRow("SELECT COUNT(*) FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE c.teacher_id = ? AND e.status = 'pending'", userID).Scan(&stats.PendingRequests)

	case domain.RoleAdmin:
		// Global Scope
		h.db.QueryRow("SELECT COUNT(DISTINCT student_user_id) FROM enrollments WHERE status = 'active'").Scan(&stats.TotalStudents)
		h.db.QueryRow("SELECT COUNT(*) FROM courses").Scan(&stats.TotalCourses)
		h.db.QueryRow("SELECT COALESCE(AVG(score), 0) FROM grades").Scan(&stats.AvgGrade)
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
	userID, ok := r.Context().Value(UserContextKey).(string)
	role, okRole := r.Context().Value(RoleContextKey).(domain.Role)

	if !ok || !okRole {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var activities []RecentActivity

	// Build scope filter based on role
	var courseFilter string
	var args []interface{}

	switch role {
	case domain.RoleTeacher:
		courseFilter = "c.teacher_id = ?"
		args = append(args, userID)
	case domain.RoleSchoolAdmin:
		var schoolID string
		h.db.QueryRow("SELECT id FROM schools WHERE admin_user_id = ?", userID).Scan(&schoolID)
		if schoolID == "" {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode([]RecentActivity{})
			return
		}
		courseFilter = "c.school_id = ?"
		args = append(args, schoolID)
	case domain.RoleAdmin:
		courseFilter = "1=1"
	default:
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]RecentActivity{})
		return
	}

	// Recent enrollments scoped to user's courses (or global)
	rows, err := h.db.Query(`
		SELECT COALESCE(u.name, u.email), c.title, e.enrolled_at
		FROM enrollments e
		JOIN users u ON e.student_user_id = u.id
		JOIN courses c ON e.course_id = c.id
		WHERE e.status = 'active' AND `+courseFilter+`
		ORDER BY e.enrolled_at DESC
		LIMIT 5
	`, args...)
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

	// Recent payments scoped to user's courses (or global)
	rows2, err := h.db.Query(`
		SELECT COALESCE(u.name, u.email), c.title, p.amount, p.paid_at
		FROM payments p
		JOIN users u ON p.student_user_id = u.id
		JOIN courses c ON p.course_id = c.id
		WHERE `+courseFilter+`
		ORDER BY p.paid_at DESC
		LIMIT 5
	`, args...)
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
				Message:   fmt.Sprintf("%s paid TJS %.2f for %s", name, amount, course),
				Timestamp: ts,
			})
		}
	}

	// Recent announcements (keep global for now, or scope by course)
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

// ── Analytics endpoints ──────────────────────────────────────────────────────

type MonthlyPoint struct {
	Month string  `json:"month"` // "2025-01"
	Value float64 `json:"value"`
}

type CourseBreakdownItem struct {
	CourseTitle string  `json:"course_title"`
	Enrollments int     `json:"enrollments"`
	Revenue     float64 `json:"revenue"`
}

// GetEnrollmentTrend handles GET /api/analytics/enrollment-trend
func (h *DashboardHandler) GetEnrollmentTrend(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	role, okRole := r.Context().Value(RoleContextKey).(domain.Role)

	if !ok || !okRole {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	joinClause := ""
	whereClause := "WHERE e.enrolled_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)"
	var args []interface{}

	if role == domain.RoleSchoolAdmin {
		var schoolID string
		h.db.QueryRow("SELECT id FROM schools WHERE admin_user_id = ?", userID).Scan(&schoolID)
		joinClause = "JOIN courses c ON e.course_id = c.id"
		whereClause += " AND c.school_id = ?"
		args = append(args, schoolID)
	} else if role == domain.RoleTeacher {
		joinClause = "JOIN courses c ON e.course_id = c.id"
		whereClause += " AND c.teacher_id = ?"
		args = append(args, userID)
	}

	query := fmt.Sprintf(`
		SELECT DATE_FORMAT(e.enrolled_at, '%%Y-%%m') AS month, COUNT(*) AS cnt
		FROM enrollments e
		%s
		%s
		GROUP BY month
		ORDER BY month ASC
	`, joinClause, whereClause)

	rows, err := h.db.Query(query, args...)
	if err != nil {
		http.Error(w, "query error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	result := fillMonthlyGaps(rows, 12)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// GetRevenueTrend handles GET /api/analytics/revenue-trend
func (h *DashboardHandler) GetRevenueTrend(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	role, okRole := r.Context().Value(RoleContextKey).(domain.Role)

	if !ok || !okRole {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	joinClause := ""
	whereClause := "WHERE p.paid_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)"
	var args []interface{}

	if role == domain.RoleSchoolAdmin {
		var schoolID string
		h.db.QueryRow("SELECT id FROM schools WHERE admin_user_id = ?", userID).Scan(&schoolID)
		joinClause = "JOIN courses c ON p.course_id = c.id"
		whereClause += " AND c.school_id = ?"
		args = append(args, schoolID)
	} else if role == domain.RoleTeacher {
		joinClause = "JOIN courses c ON p.course_id = c.id"
		whereClause += " AND c.teacher_id = ?"
		args = append(args, userID)
	}

	query := fmt.Sprintf(`
		SELECT DATE_FORMAT(p.paid_at, '%%Y-%%m') AS month, COALESCE(SUM(p.amount), 0) AS total
		FROM payments p
		%s
		%s
		GROUP BY month
		ORDER BY month ASC
	`, joinClause, whereClause)

	rows, err := h.db.Query(query, args...)
	if err != nil {
		http.Error(w, "query error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	result := fillMonthlyGaps(rows, 12)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// GetAttendanceTrend handles GET /api/analytics/attendance-trend
func (h *DashboardHandler) GetAttendanceTrend(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	role, okRole := r.Context().Value(RoleContextKey).(domain.Role)

	if !ok || !okRole {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	joinClause := ""
	whereClause := "WHERE a.date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)"
	var args []interface{}

	if role == domain.RoleSchoolAdmin {
		var schoolID string
		h.db.QueryRow("SELECT id FROM schools WHERE admin_user_id = ?", userID).Scan(&schoolID)
		joinClause = "JOIN courses c ON a.course_id = c.id"
		whereClause += " AND c.school_id = ?"
		args = append(args, schoolID)
	} else if role == domain.RoleTeacher {
		joinClause = "JOIN courses c ON a.course_id = c.id"
		whereClause += " AND c.teacher_id = ?"
		args = append(args, userID)
	}

	query := fmt.Sprintf(`
		SELECT DATE_FORMAT(a.date, '%%Y-%%m') AS month,
		       ROUND(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 1) AS pct
		FROM attendance a
		%s
		%s
		GROUP BY month
		ORDER BY month ASC
	`, joinClause, whereClause)

	rows, err := h.db.Query(query, args...)
	if err != nil {
		http.Error(w, "query error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	result := fillMonthlyGaps(rows, 12)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// GetCourseBreakdown handles GET /api/analytics/course-breakdown
func (h *DashboardHandler) GetCourseBreakdown(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	role, okRole := r.Context().Value(RoleContextKey).(domain.Role)

	if !ok || !okRole {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	whereClause := "WHERE 1=1"
	var args []interface{}

	if role == domain.RoleSchoolAdmin {
		var schoolID string
		h.db.QueryRow("SELECT id FROM schools WHERE admin_user_id = ?", userID).Scan(&schoolID)
		whereClause += " AND c.school_id = ?"
		args = append(args, schoolID)
	} else if role == domain.RoleTeacher {
		whereClause += " AND c.teacher_id = ?"
		args = append(args, userID)
	}

	query := fmt.Sprintf(`
		SELECT c.title,
		       COUNT(DISTINCT e.id) AS enrollments,
		       COALESCE(SUM(p.amount), 0) AS revenue
		FROM courses c
		LEFT JOIN enrollments e ON e.course_id = c.id AND e.status = 'active'
		LEFT JOIN payments p ON p.course_id = c.id
		%s
		GROUP BY c.id, c.title
		ORDER BY enrollments DESC
		LIMIT 10
	`, whereClause)

	rows, err := h.db.Query(query, args...)
	if err != nil {
		http.Error(w, "query error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	var items []CourseBreakdownItem
	for rows.Next() {
		var item CourseBreakdownItem
		rows.Scan(&item.CourseTitle, &item.Enrollments, &item.Revenue)
		items = append(items, item)
	}
	if items == nil {
		items = []CourseBreakdownItem{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}

// ExportCSV handles GET /api/analytics/export
func (h *DashboardHandler) ExportCSV(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	role, okRole := r.Context().Value(RoleContextKey).(domain.Role)

	if !ok || !okRole {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", `attachment; filename="analytics_export.csv"`)

	cw := csv.NewWriter(w)
	defer cw.Flush()

	filterJoin := ""
	filterWhere := ""
	var args []interface{}

	if role == domain.RoleSchoolAdmin {
		var schoolID string
		h.db.QueryRow("SELECT id FROM schools WHERE admin_user_id = ?", userID).Scan(&schoolID)
		filterJoin = " JOIN courses c ON c.id = entity.course_id "
		filterWhere = " AND c.school_id = ?"
		args = append(args, schoolID)
	} else if role == domain.RoleTeacher {
		filterJoin = " JOIN courses c ON c.id = entity.course_id "
		filterWhere = " AND c.teacher_id = ?"
		args = append(args, userID)
	}

	// Section 1: Summary stats
	cw.Write([]string{"Section", "Metric", "Value"})
	var students, courses, teachers int
	var revenue float64

	if role == domain.RoleAdmin {
		h.db.QueryRow("SELECT COUNT(DISTINCT student_user_id) FROM enrollments").Scan(&students)
		h.db.QueryRow("SELECT COUNT(*) FROM courses").Scan(&courses)
		h.db.QueryRow("SELECT COUNT(*) FROM teacher_profiles").Scan(&teachers)
		h.db.QueryRow("SELECT COALESCE(SUM(amount),0) FROM payments").Scan(&revenue)
	} else {
		studentQ := fmt.Sprintf("SELECT COUNT(DISTINCT entity.student_user_id) FROM enrollments entity %s WHERE 1=1 %s", filterJoin, filterWhere)
		h.db.QueryRow(studentQ, args...).Scan(&students)
		courseQ := fmt.Sprintf("SELECT COUNT(*) FROM courses c WHERE 1=1 AND c.school_id = ?")
		if role == domain.RoleTeacher {
			courseQ = fmt.Sprintf("SELECT COUNT(*) FROM courses c WHERE 1=1 AND c.teacher_id = ?")
			teachers = 1
		} else {
			teacherQ := fmt.Sprintf("SELECT COUNT(*) FROM users WHERE role = 'teacher' AND school_id = ?")
			h.db.QueryRow(teacherQ, args...).Scan(&teachers)
		}
		h.db.QueryRow(courseQ, args...).Scan(&courses)
		revQ := fmt.Sprintf("SELECT COALESCE(SUM(entity.amount),0) FROM payments entity %s WHERE 1=1 %s", filterJoin, filterWhere)
		h.db.QueryRow(revQ, args...).Scan(&revenue)
	}

	cw.Write([]string{"Summary", "Total Students", fmt.Sprintf("%d", students)})
	cw.Write([]string{"Summary", "Total Courses", fmt.Sprintf("%d", courses)})
	cw.Write([]string{"Summary", "Total Teachers", fmt.Sprintf("%d", teachers)})
	cw.Write([]string{"Summary", "Total Revenue (TJS)", fmt.Sprintf("%.2f", revenue)})
	cw.Write([]string{})

	// Section 2: Monthly enrollment trend
	cw.Write([]string{"Enrollment Trend", "Month", "New Enrollments"})
	eQuery := fmt.Sprintf(`
		SELECT DATE_FORMAT(entity.enrolled_at, '%%Y-%%m'), COUNT(*)
		FROM enrollments entity %s
		WHERE entity.enrolled_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH) %s
		GROUP BY 1 ORDER BY 1`, filterJoin, filterWhere)
	eRows, _ := h.db.Query(eQuery, args...)
	if eRows != nil {
		defer eRows.Close()
		for eRows.Next() {
			var m string
			var v int
			eRows.Scan(&m, &v)
			cw.Write([]string{"Enrollment Trend", m, fmt.Sprintf("%d", v)})
		}
	}
	cw.Write([]string{})

	// Section 3: Monthly revenue
	cw.Write([]string{"Revenue Trend", "Month", "Revenue (TJS)"})
	pQuery := fmt.Sprintf(`
		SELECT DATE_FORMAT(entity.paid_at, '%%Y-%%m'), COALESCE(SUM(entity.amount),0)
		FROM payments entity %s
		WHERE entity.paid_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH) %s
		GROUP BY 1 ORDER BY 1`, filterJoin, filterWhere)
	pRows, _ := h.db.Query(pQuery, args...)
	if pRows != nil {
		defer pRows.Close()
		for pRows.Next() {
			var m string
			var v float64
			pRows.Scan(&m, &v)
			cw.Write([]string{"Revenue Trend", m, fmt.Sprintf("%.2f", v)})
		}
	}
}

// fillMonthlyGaps reads month/value rows and fills missing months with 0.
func fillMonthlyGaps(rows *sql.Rows, numMonths int) []MonthlyPoint {
	raw := map[string]float64{}
	for rows.Next() {
		var month string
		var val float64
		rows.Scan(&month, &val)
		raw[month] = val
	}

	result := make([]MonthlyPoint, 0, numMonths)
	now := time.Now()
	for i := numMonths - 1; i >= 0; i-- {
		t := now.AddDate(0, -i, 0)
		key := t.Format("2006-01")
		result = append(result, MonthlyPoint{Month: key, Value: raw[key]})
	}
	return result
}
