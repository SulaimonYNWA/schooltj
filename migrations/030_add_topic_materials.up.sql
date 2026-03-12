ALTER TABLE course_materials ADD COLUMN topic_id CHAR(36) DEFAULT NULL;
ALTER TABLE course_materials ADD CONSTRAINT fk_material_topic FOREIGN KEY (topic_id) REFERENCES course_curriculum_topics(id) ON DELETE CASCADE;
