-- Rollback course ratings support
ALTER TABLE courses DROP COLUMN rating_avg;
ALTER TABLE courses DROP COLUMN rating_count;

ALTER TABLE ratings DROP CHECK target_check;
ALTER TABLE ratings ADD CONSTRAINT target_check CHECK (
    (to_user_id IS NOT NULL AND to_school_id IS NULL) OR 
    (to_user_id IS NULL AND to_school_id IS NOT NULL)
);

ALTER TABLE ratings DROP FOREIGN KEY fk_ratings_course;
ALTER TABLE ratings DROP COLUMN to_course_id;
