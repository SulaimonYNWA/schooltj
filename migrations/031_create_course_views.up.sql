CREATE TABLE IF NOT EXISTS course_views (
    student_id VARCHAR(36) NOT NULL,
    course_id VARCHAR(36) NOT NULL,
    view_count INT NOT NULL DEFAULT 1,
    last_viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
