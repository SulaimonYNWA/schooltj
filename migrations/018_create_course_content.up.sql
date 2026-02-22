CREATE TABLE course_curriculum_topics (
    id          CHAR(36) PRIMARY KEY,
    course_id   CHAR(36) NOT NULL,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE course_materials (
    id           CHAR(36) PRIMARY KEY,
    course_id    CHAR(36) NOT NULL,
    file_name    VARCHAR(255) NOT NULL,
    file_path    VARCHAR(512) NOT NULL,
    file_size    BIGINT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    uploaded_by  CHAR(36) NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);
