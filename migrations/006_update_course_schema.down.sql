ALTER TABLE courses DROP COLUMN schedule;
-- Reverting ENUM is tricky if data exists, but we will try to reset to original
-- Warning: This might fail if there are 'invited' or 'rejected' rows.
-- ideally we should delete them first or map them to something else.
DELETE FROM enrollments WHERE status IN ('invited', 'rejected');
ALTER TABLE enrollments MODIFY COLUMN status ENUM('active', 'completed', 'dropped') DEFAULT 'active';
