-- Revert to VARCHAR(36) for all columns
ALTER TABLE topic_completions DROP FOREIGN KEY topic_completions_ibfk_1;
ALTER TABLE topic_completions DROP FOREIGN KEY topic_completions_ibfk_2;
ALTER TABLE topic_completions MODIFY COLUMN student_user_id VARCHAR(36) NOT NULL;
ALTER TABLE topic_completions MODIFY COLUMN topic_id VARCHAR(36) NOT NULL;
ALTER TABLE topic_completions ADD CONSTRAINT topic_completions_ibfk_1 FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE topic_completions ADD CONSTRAINT topic_completions_ibfk_2 FOREIGN KEY (topic_id) REFERENCES course_curriculum_topics(id) ON DELETE CASCADE;

ALTER TABLE course_certificates DROP FOREIGN KEY course_certificates_ibfk_1;
ALTER TABLE course_certificates DROP FOREIGN KEY course_certificates_ibfk_2;
ALTER TABLE course_certificates MODIFY COLUMN student_user_id VARCHAR(36) NOT NULL;
ALTER TABLE course_certificates MODIFY COLUMN course_id VARCHAR(36) NOT NULL;
ALTER TABLE course_certificates ADD CONSTRAINT course_certificates_ibfk_1 FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE course_certificates ADD CONSTRAINT course_certificates_ibfk_2 FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
