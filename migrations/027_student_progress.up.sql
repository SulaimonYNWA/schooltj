-- Add topic_completions table
CREATE TABLE IF NOT EXISTS topic_completions (
    student_user_id VARCHAR(36) NOT NULL,
    topic_id VARCHAR(36) NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_user_id, topic_id),
    FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES course_curriculum_topics(id) ON DELETE CASCADE
);

-- Add course_certificates table
CREATE TABLE IF NOT EXISTS course_certificates (
    id VARCHAR(36) PRIMARY KEY,
    student_user_id VARCHAR(36) NOT NULL,
    course_id VARCHAR(36) NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    certificate_url VARCHAR(512) NOT NULL,
    FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY student_course_certificate (student_user_id, course_id)
);
