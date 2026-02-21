ALTER TABLE students DROP FOREIGN KEY students_ibfk_2; -- Adjust constraint name if needed, usually sequential
ALTER TABLE students DROP FOREIGN KEY students_ibfk_3;
ALTER TABLE students DROP COLUMN school_id;
ALTER TABLE students DROP COLUMN teacher_id;
