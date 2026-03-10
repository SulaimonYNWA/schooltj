ALTER TABLE payments DROP COLUMN external_id;
ALTER TABLE payments DROP COLUMN status;
ALTER TABLE payments MODIFY method ENUM('cash', 'card', 'transfer', 'other') NOT NULL DEFAULT 'cash';
