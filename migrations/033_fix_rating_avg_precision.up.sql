-- Migration to fix rating_avg precision to allow 10.00
ALTER TABLE users MODIFY COLUMN rating_avg DECIMAL(4,2) DEFAULT 0.00;
ALTER TABLE schools MODIFY COLUMN rating_avg DECIMAL(4,2) DEFAULT 0.00;
ALTER TABLE courses MODIFY COLUMN rating_avg DECIMAL(4,2) DEFAULT 0.00;
