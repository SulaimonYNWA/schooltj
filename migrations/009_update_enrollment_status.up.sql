ALTER TABLE enrollments MODIFY COLUMN status ENUM('active', 'completed', 'dropped', 'invited', 'pending', 'rejected') DEFAULT 'active';
