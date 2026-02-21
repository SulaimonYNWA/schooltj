CREATE TABLE IF NOT EXISTS payments (
    id CHAR(36) PRIMARY KEY,
    student_user_id CHAR(36) NOT NULL,
    course_id CHAR(36) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    method ENUM('cash','card','transfer','other') NOT NULL DEFAULT 'cash',
    note TEXT,
    recorded_by CHAR(36) NOT NULL,
    paid_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE CASCADE
);
