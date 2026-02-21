ALTER TABLE courses ADD COLUMN schedule TEXT;
ALTER TABLE enrollments MODIFY COLUMN status ENUM('active', 'completed', 'dropped', 'invited', 'rejected') DEFAULT 'invited';
