-- Fix existing users with NULL names by setting them to their email address
UPDATE users SET name = email WHERE name IS NULL;

-- Make name column NOT NULL
ALTER TABLE users MODIFY COLUMN name VARCHAR(255) NOT NULL;
