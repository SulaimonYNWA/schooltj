package handler

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/schooltj/internal/domain"
)

type CalendarHandler struct {
	db *sql.DB
}

func NewCalendarHandler(db *sql.DB) *CalendarHandler {
	return &CalendarHandler{db: db}
}

// scheduleData is used to parse the JSON schedule column.
type scheduleData struct {
	Days      []string `json:"days"`
	StartTime string   `json:"start_time"`
	EndTime   string   `json:"end_time"`
	StartDate string   `json:"start_date"`
	EndDate   string   `json:"end_date"`
}

// ExportICal handles GET /api/calendar/ical
// Returns an iCalendar (.ics) file with the user's active course schedule.
func (h *CalendarHandler) ExportICal(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserContextKey).(string)
	role, _ := r.Context().Value(RoleContextKey).(domain.Role)
	if !ok || userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	type courseRow struct {
		ID       string
		Title    string
		Schedule string // JSON: {"days":["Mon","Wed"],"start_time":"09:00","end_time":"10:30","start_date":"2026-01-01","end_date":"2026-06-01"}
	}

	var rows []courseRow

	if role == domain.RoleStudent {
		dbRows, err := h.db.Query(`
			SELECT c.id, c.title, COALESCE(c.schedule, '{}')
			FROM enrollments e
			JOIN courses c ON c.id = e.course_id
			WHERE e.student_user_id = ? AND e.status = 'active'
		`, userID)
		if err == nil {
			defer dbRows.Close()
			for dbRows.Next() {
				var row courseRow
				dbRows.Scan(&row.ID, &row.Title, &row.Schedule)
				rows = append(rows, row)
			}
		}
	} else {
		dbRows, err := h.db.Query(`
			SELECT id, title, COALESCE(schedule, '{}')
			FROM courses
			WHERE teacher_id = ?
		`, userID)
		if err == nil {
			defer dbRows.Close()
			for dbRows.Next() {
				var row courseRow
				dbRows.Scan(&row.ID, &row.Title, &row.Schedule)
				rows = append(rows, row)
			}
		}
	}

	// Build iCal
	now := time.Now().UTC().Format("20060102T150405Z")
	var sb strings.Builder
	sb.WriteString("BEGIN:VCALENDAR\r\n")
	sb.WriteString("VERSION:2.0\r\n")
	sb.WriteString("PRODID:-//SchoolTJ//SchoolTJ//EN\r\n")
	sb.WriteString("CALSCALE:GREGORIAN\r\n")
	sb.WriteString("METHOD:PUBLISH\r\n")
	sb.WriteString("X-WR-CALNAME:My SchoolTJ Schedule\r\n")

	dayToWeekday := map[string]string{
		"Mon": "MO", "Tue": "TU", "Wed": "WE",
		"Thu": "TH", "Fri": "FR", "Sat": "SA", "Sun": "SU",
	}

	for _, c := range rows {
		// Parse the JSON schedule
		var sched scheduleData
		if err := json.Unmarshal([]byte(c.Schedule), &sched); err != nil {
			continue
		}

		if sched.StartTime == "" || len(sched.Days) == 0 {
			continue
		}

		// Determine DTSTART date (use start_date or fallback)
		startDate := "20250101"
		endDate := "20251231"
		if sched.StartDate != "" {
			startDate = strings.ReplaceAll(sched.StartDate, "-", "")
		}
		if sched.EndDate != "" {
			endDate = strings.ReplaceAll(sched.EndDate, "-", "")
		}

		startDT := startDate + "T" + strings.ReplaceAll(sched.StartTime, ":", "") + "00"
		endDT := startDate + "T" + strings.ReplaceAll(sched.EndTime, ":", "") + "00"

		// RRULE weekdays
		var wdays []string
		for _, d := range sched.Days {
			if wd, ok := dayToWeekday[d]; ok {
				wdays = append(wdays, wd)
			}
		}

		sb.WriteString("BEGIN:VEVENT\r\n")
		sb.WriteString(fmt.Sprintf("UID:%s@schooltj\r\n", c.ID))
		sb.WriteString(fmt.Sprintf("DTSTAMP:%s\r\n", now))
		sb.WriteString(fmt.Sprintf("DTSTART:%s\r\n", startDT))
		sb.WriteString(fmt.Sprintf("DTEND:%s\r\n", endDT))
		sb.WriteString(fmt.Sprintf("SUMMARY:%s\r\n", escapeIcal(c.Title)))
		if len(wdays) > 0 {
			sb.WriteString(fmt.Sprintf("RRULE:FREQ=WEEKLY;BYDAY=%s;UNTIL=%sT235959Z\r\n",
				strings.Join(wdays, ","), endDate))
		}
		sb.WriteString("END:VEVENT\r\n")
	}

	sb.WriteString("END:VCALENDAR\r\n")

	w.Header().Set("Content-Type", "text/calendar; charset=UTF-8")
	w.Header().Set("Content-Disposition", `attachment; filename="schooltj_schedule.ics"`)
	w.Write([]byte(sb.String()))
}

// extractDays parses a JSON string like ["Mon","Wed","Fri"] without full json package.
func extractDays(jsonArr string) []string {
	// Strip brackets and quotes, split by comma
	s := strings.Trim(jsonArr, "[] ")
	if s == "" {
		return nil
	}
	parts := strings.Split(s, ",")
	var days []string
	for _, p := range parts {
		d := strings.Trim(p, `" `)
		if d != "" {
			days = append(days, d)
		}
	}
	return days
}

// escapeIcal escapes special characters in iCal property values.
func escapeIcal(s string) string {
	s = strings.ReplaceAll(s, "\\", "\\\\")
	s = strings.ReplaceAll(s, ";", "\\;")
	s = strings.ReplaceAll(s, ",", "\\,")
	s = strings.ReplaceAll(s, "\n", "\\n")
	return s
}
