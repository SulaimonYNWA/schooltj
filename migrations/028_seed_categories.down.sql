-- Remove category assignments from courses
UPDATE courses SET category_id = NULL;

-- Remove seeded categories
DELETE FROM categories WHERE id IN ('cat-math', 'cat-science', 'cat-languages', 'cat-programming', 'cat-humanities', 'cat-arts', 'cat-business', 'cat-test-prep', 'cat-data');
