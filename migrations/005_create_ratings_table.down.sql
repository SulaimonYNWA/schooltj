ALTER TABLE schools DROP COLUMN rating_count;
ALTER TABLE schools DROP COLUMN rating_avg;
ALTER TABLE users DROP COLUMN rating_count;
ALTER TABLE users DROP COLUMN rating_avg;
DROP TABLE IF EXISTS ratings;
