-- Create ratings table
CREATE TABLE ratings (
    id CHAR(36) PRIMARY KEY,
    from_user_id CHAR(36) NOT NULL,
    to_user_id CHAR(36) NULL,
    to_school_id CHAR(36) NULL,
    score TINYINT NOT NULL CHECK (score >= 1 AND score <= 10),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_school_id) REFERENCES schools(id) ON DELETE CASCADE,
    -- Ensure either to_user_id or to_school_id is set, but not both (or as per req)
    -- For now, allow one of them to be set.
    CONSTRAINT target_check CHECK (
        (to_user_id IS NOT NULL AND to_school_id IS NULL) OR 
        (to_user_id IS NULL AND to_school_id IS NOT NULL)
    )
);

-- Add aggregate fields to users
ALTER TABLE users ADD COLUMN rating_avg DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN rating_count INT DEFAULT 0;

-- Add aggregate fields to schools
ALTER TABLE schools ADD COLUMN rating_avg DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE schools ADD COLUMN rating_count INT DEFAULT 0;
