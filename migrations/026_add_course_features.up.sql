-- Add categories table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add tags table
CREATE TABLE IF NOT EXISTS tags (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- Join table for course tags
CREATE TABLE IF NOT EXISTS course_tags (
    course_id VARCHAR(36) REFERENCES courses(id) ON DELETE CASCADE,
    tag_id VARCHAR(36) REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, tag_id)
);

-- Update courses table
ALTER TABLE courses ADD COLUMN category_id VARCHAR(36) REFERENCES categories(id);
ALTER TABLE courses ADD COLUMN difficulty VARCHAR(20) DEFAULT 'beginner';
