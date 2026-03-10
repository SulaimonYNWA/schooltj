-- Seed categories
INSERT INTO categories (id, name, slug, created_at) VALUES
('cat-math', 'Mathematics', 'mathematics', NOW()),
('cat-science', 'Science', 'science', NOW()),
('cat-languages', 'Languages', 'languages', NOW()),
('cat-programming', 'Programming & IT', 'programming-it', NOW()),
('cat-humanities', 'Humanities', 'humanities', NOW()),
('cat-arts', 'Arts & Music', 'arts-music', NOW()),
('cat-business', 'Business & Economics', 'business-economics', NOW()),
('cat-test-prep', 'Test Preparation', 'test-preparation', NOW()),
('cat-data', 'Data Science', 'data-science', NOW());

-- Assign categories to existing courses based on their content
UPDATE courses SET category_id = 'cat-languages' WHERE id IN ('c-eng-001', 'c-rus-001', 'c-arab-001', 'c-pers-001', 'c-tajik-001');
UPDATE courses SET category_id = 'cat-test-prep' WHERE id = 'c-eng-002';
UPDATE courses SET category_id = 'cat-math' WHERE id = 'c-math-001';
UPDATE courses SET category_id = 'cat-science' WHERE id IN ('c-phys-001', 'c-bio-001', 'c-chem-001');
UPDATE courses SET category_id = 'cat-programming' WHERE id IN ('c-prog-001', 'c-web-001');
UPDATE courses SET category_id = 'cat-data' WHERE id = 'c-data-001';
UPDATE courses SET category_id = 'cat-humanities' WHERE id = 'c-hist-001';
