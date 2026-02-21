ALTER TABLE enrollments MODIFY COLUMN status ENUM('active', 'completed', 'dropped') DEFAULT 'active';
