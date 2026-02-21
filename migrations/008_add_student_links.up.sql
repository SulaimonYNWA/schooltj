ALTER TABLE students ADD COLUMN school_id CHAR(36) NULL;
ALTER TABLE students ADD COLUMN teacher_id CHAR(36) NULL;

ALTER TABLE students ADD FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL;
ALTER TABLE students ADD FOREIGN KEY (teacher_id) REFERENCES teacher_profiles(user_id) ON DELETE SET NULL;
