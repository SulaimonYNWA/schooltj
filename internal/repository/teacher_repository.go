package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/schooltj/internal/domain"
)

type TeacherRepository struct {
	DB *sql.DB
}

func NewTeacherRepository(db *sql.DB) *TeacherRepository {
	return &TeacherRepository{DB: db}
}

// ListTeachers fetches teachers with pagination and optional search by name.
// Sorts by rating_avg DESC by default.
func (r *TeacherRepository) ListTeachers(ctx context.Context, limit, offset int, search string) ([]domain.User, error) {
	query := `
		SELECT 
			u.id, 
			u.email, 
			u.name, 
			u.role, 
			u.avatar_url, 
			u.created_at,
			COALESCE(AVG(rt.score), 0) as rating_avg,
			COUNT(rt.id) as rating_count,
			s.name as school_name
		FROM users u
		LEFT JOIN ratings rt ON rt.to_user_id = u.id -- general user rating
		LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
		LEFT JOIN schools s ON tp.school_id = s.id
		WHERE u.role = 'teacher'
	`
	var args []interface{}

	if search != "" {
		query += ` AND u.name ILIKE ?`
		args = append(args, "%"+search+"%")
		// Using SQLite compatible ILIKE replacement if needed, but since we use PostgreSQL, ILIKE is fine.
		// Actually schooltj uses SQLite locally or Postgres? Let's use standard LIKE for SQLite / standard
		query = strings.Replace(query, "ILIKE", "LIKE", 1) // Fallback to LIKE, PostgreSQL ILIKE might fail in SQLite
	}

	query += `
		GROUP BY u.id
		ORDER BY rating_avg DESC, u.created_at DESC
		LIMIT ? OFFSET ?
	`
	args = append(args, limit, offset)

	rows, err := r.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query teachers failed: %w", err)
	}
	defer rows.Close()

	var teachers []domain.User
	for rows.Next() {
		var u domain.User
		var avatarURL sql.NullString
		var ratingAvg sql.NullFloat64
		var ratingCount sql.NullInt64
		var schoolName sql.NullString

		err := rows.Scan(
			&u.ID,
			&u.Email,
			&u.Name,
			&u.Role,
			&avatarURL,
			&u.CreatedAt,
			&ratingAvg,
			&ratingCount,
			&schoolName,
		)
		if err != nil {
			return nil, fmt.Errorf("scan teacher failed: %w", err)
		}

		if avatarURL.Valid {
			u.AvatarURL = &avatarURL.String
		}
		if ratingAvg.Valid {
			u.RatingAvg = ratingAvg.Float64
		}
		if ratingCount.Valid {
			u.RatingCount = int(ratingCount.Int64)
		}
		if schoolName.Valid {
			u.SchoolName = &schoolName.String
		}
		teachers = append(teachers, u)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return teachers, nil
}
