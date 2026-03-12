-- Migration to add course ratings support
ALTER TABLE ratings ADD COLUMN to_course_id CHAR(36) NULL;
ALTER TABLE ratings ADD CONSTRAINT fk_ratings_course FOREIGN KEY (to_course_id) REFERENCES courses(id) ON DELETE CASCADE;

-- Update the check constraint to allow course ratings
-- In MySQL, we need to drop and add it back
ALTER TABLE ratings DROP CHECK target_check;
ALTER TABLE ratings ADD CONSTRAINT target_check CHECK (
    (to_user_id IS NOT NULL AND to_school_id IS NULL AND to_course_id IS NULL) OR 
    (to_user_id IS NULL AND to_school_id IS NOT NULL AND to_course_id IS NULL) OR
    (to_user_id IS NULL AND to_school_id IS NULL AND to_course_id IS NOT NULL)
);

-- Add aggregate fields to courses
ALTER TABLE courses ADD COLUMN rating_avg DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE courses ADD COLUMN rating_count INT DEFAULT 0;
