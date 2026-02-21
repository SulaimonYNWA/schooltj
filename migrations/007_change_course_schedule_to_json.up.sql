-- We can't easily ALTER COLUMN to JSON if data exists and is not valid JSON.
-- Since the column is currently TEXT and might contain plain text strings "Mon/Wed...",
-- we might want to drop and recreate or just modify. 
-- Assuming earlier data is negligible or acceptable to clear for this refactor.
-- Or we can just use JSON type, MySQL might complain if content is not JSON.
-- Safest is to Update existing to NULL, then modify.

UPDATE courses SET schedule = NULL;
ALTER TABLE courses MODIFY COLUMN schedule JSON;
