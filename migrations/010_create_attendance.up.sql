CREATE TABLE IF NOT EXISTS attendance (
    id CHAR(36) PRIMARY KEY,
    enrollment_id CHAR(36) NOT NULL,
    course_id CHAR(36) NOT NULL,
    student_user_id CHAR(36) NOT NULL,
    date DATE NOT NULL,
    status ENUM('present','absent','late','excused') NOT NULL DEFAULT 'present',
    note TEXT,
    marked_by CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_attendance (enrollment_id, date),
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE CASCADE
);
