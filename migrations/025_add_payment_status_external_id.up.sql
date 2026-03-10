-- Add 'alif' to method and add status/external_id
ALTER TABLE payments MODIFY method ENUM('cash', 'card', 'transfer', 'alif', 'other') NOT NULL DEFAULT 'cash';
ALTER TABLE payments ADD COLUMN status ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'success' AFTER method;
ALTER TABLE payments ADD COLUMN external_id VARCHAR(255) DEFAULT '' AFTER status;
