-- SchoolTJ Additional Seed Data (v2)
-- Adds: more users, courses with languages, curriculum topics,
-- more enrollments, payments with receipt_url, more ratings, messages

-- ============================================================
-- ADDITIONAL USERS (8 more = 20 total)
-- ============================================================
INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at) VALUES
-- New school admin
('u-sadmin-003', 'director@linguist.tj', 'Zuhra Boboeva', '$2a$10$atuxSUmd5surZoo9dV/slOCz1dHmVzXa3PrkuGhm5XHvh7G26oO1q', 'school_admin', NOW(), NOW()),
-- New teachers
('u-teach-005', 'elena.kim@oxford.tj', 'Elena Kim', '$2a$10$atuxSUmd5surZoo9dV/slOCz1dHmVzXa3PrkuGhm5XHvh7G26oO1q', 'teacher', NOW(), NOW()),
('u-teach-006', 'ahmad.nazarov@linguist.tj', 'Ahmad Nazarov', '$2a$10$atuxSUmd5surZoo9dV/slOCz1dHmVzXa3PrkuGhm5XHvh7G26oO1q', 'teacher', NOW(), NOW()),
-- New students
('u-stud-006', 'farzona@gmail.com', 'Farzona Rahimova', '$2a$10$atuxSUmd5surZoo9dV/slOCz1dHmVzXa3PrkuGhm5XHvh7G26oO1q', 'student', NOW(), NOW()),
('u-stud-007', 'doniyor@gmail.com', 'Doniyor Karimov', '$2a$10$atuxSUmd5surZoo9dV/slOCz1dHmVzXa3PrkuGhm5XHvh7G26oO1q', 'student', NOW(), NOW()),
('u-stud-008', 'madina@gmail.com', 'Madina Yusupova', '$2a$10$atuxSUmd5surZoo9dV/slOCz1dHmVzXa3PrkuGhm5XHvh7G26oO1q', 'student', NOW(), NOW()),
('u-stud-009', 'sardor@gmail.com', 'Sardor Mirzaev', '$2a$10$atuxSUmd5surZoo9dV/slOCz1dHmVzXa3PrkuGhm5XHvh7G26oO1q', 'student', NOW(), NOW()),
('u-stud-010', 'zarina@gmail.com', 'Zarina Tosheva', '$2a$10$atuxSUmd5surZoo9dV/slOCz1dHmVzXa3PrkuGhm5XHvh7G26oO1q', 'student', NOW(), NOW());

-- ============================================================
-- NEW SCHOOL
-- ============================================================
INSERT INTO schools (id, admin_user_id, name, tax_id, phone, address, city, is_verified, rating_avg, rating_count, created_at, updated_at) VALUES
('s-linguist-001', 'u-sadmin-003', 'Linguist Academy', '111222333', '+992-37-225-3456', '22 Sino St', 'Dushanbe', TRUE, 4.7, 5, NOW(), NOW());

-- ============================================================
-- NEW TEACHER PROFILES
-- ============================================================
INSERT INTO teacher_profiles (user_id, school_id, bio, subjects, hourly_rate, currency, created_at, updated_at) VALUES
('u-teach-005', 's-oxford-001', 'Russian language and literature teacher with 8 years experience. Specializes in exam preparation.', '["Russian", "Literature"]', 170.00, 'TJS', NOW(), NOW()),
('u-teach-006', 's-linguist-001', 'Arabic and Persian language instructor. Certified TORFL examiner.', '["Arabic", "Persian", "Tajik"]', 190.00, 'TJS', NOW(), NOW());

-- ============================================================
-- NEW STUDENTS
-- ============================================================
INSERT INTO students (user_id, parent_name, grade_level, school_id, teacher_id, created_at, updated_at) VALUES
('u-stud-006', 'Rahimova Mahbuba', '9th Grade', 's-oxford-001', 'u-teach-005', NOW(), NOW()),
('u-stud-007', 'Karimov Firuz', '11th Grade', 's-eurasia-001', 'u-teach-003', NOW(), NOW()),
('u-stud-008', 'Yusupova Lola', '10th Grade', 's-linguist-001', 'u-teach-006', NOW(), NOW()),
('u-stud-009', 'Mirzaev Oybek', '12th Grade', 's-linguist-001', 'u-teach-006', NOW(), NOW()),
('u-stud-010', 'Tosheva Gulnora', '11th Grade', NULL, 'u-teach-004', NOW(), NOW());

-- ============================================================
-- UPDATE EXISTING COURSES WITH LANGUAGE
-- ============================================================
UPDATE courses SET language = 'English' WHERE id IN ('c-eng-001', 'c-eng-002');
UPDATE courses SET language = 'Russian' WHERE id IN ('c-math-001', 'c-phys-001');
UPDATE courses SET language = 'English' WHERE id IN ('c-prog-001', 'c-web-001');
UPDATE courses SET language = 'Tajik' WHERE id = 'c-bio-001';
UPDATE courses SET language = 'Tajik' WHERE id = 'c-hist-001';

-- ============================================================
-- NEW COURSES (6 more = 14 total)
-- ============================================================
INSERT INTO courses (id, title, description, school_id, teacher_id, price, language, schedule, created_at, updated_at) VALUES
('c-rus-001', 'Russian Literature', 'Classic and modern Russian literature analysis. Pushkin, Tolstoy, and contemporary authors.', 's-oxford-001', 'u-teach-005', 380.00, 'Russian',
 '{"days":["Tue","Thu"],"start_time":"11:00","end_time":"12:30","start_date":"2026-02-01","end_date":"2026-06-01"}', NOW(), NOW()),

('c-arab-001', 'Arabic for Beginners', 'Learn Modern Standard Arabic from scratch. Reading, writing, and basic conversation.', 's-linguist-001', 'u-teach-006', 420.00, 'Arabic',
 '{"days":["Mon","Wed","Fri"],"start_time":"10:00","end_time":"11:30","start_date":"2026-02-15","end_date":"2026-07-01"}', NOW(), NOW()),

('c-pers-001', 'Persian Language', 'Intermediate Persian/Farsi course focusing on reading classical poetry and modern conversation.', 's-linguist-001', 'u-teach-006', 400.00, 'Persian',
 '{"days":["Tue","Sat"],"start_time":"14:00","end_time":"15:30","start_date":"2026-03-01","end_date":"2026-07-01"}', NOW(), NOW()),

('c-data-001', 'Data Science with Python', 'Pandas, NumPy, matplotlib, and intro to machine learning with scikit-learn.', 's-eurasia-001', 'u-teach-003', 700.00, 'English',
 '{"days":["Sat"],"start_time":"10:00","end_time":"13:00","start_date":"2026-03-01","end_date":"2026-08-01"}', NOW(), NOW()),

('c-chem-001', 'Organic Chemistry', 'Hydrocarbons, functional groups, reaction mechanisms. University entrance prep.', NULL, 'u-teach-004', 400.00, 'Russian',
 '{"days":["Mon","Thu"],"start_time":"16:00","end_time":"17:30","start_date":"2026-02-01","end_date":"2026-06-01"}', NOW(), NOW()),

('c-tajik-001', 'Tajik Language & Culture', 'Grammar, poetry of Rudaki and Firdawsi, and modern Tajik media.', 's-linguist-001', 'u-teach-006', 300.00, 'Tajik',
 '{"days":["Wed","Fri"],"start_time":"16:00","end_time":"17:30","start_date":"2026-02-01","end_date":"2026-06-01"}', NOW(), NOW());

-- ============================================================
-- NEW ENROLLMENTS (16 more)
-- ============================================================
INSERT INTO enrollments (id, student_user_id, course_id, enrolled_at, status) VALUES
('e-019', 'u-stud-006', 'c-eng-001', DATE_SUB(NOW(), INTERVAL 12 DAY), 'active'),
('e-020', 'u-stud-006', 'c-rus-001', DATE_SUB(NOW(), INTERVAL 10 DAY), 'active'),
('e-021', 'u-stud-007', 'c-prog-001', DATE_SUB(NOW(), INTERVAL 8 DAY), 'active'),
('e-022', 'u-stud-007', 'c-data-001', DATE_SUB(NOW(), INTERVAL 5 DAY), 'active'),
('e-023', 'u-stud-008', 'c-arab-001', DATE_SUB(NOW(), INTERVAL 10 DAY), 'active'),
('e-024', 'u-stud-008', 'c-pers-001', DATE_SUB(NOW(), INTERVAL 7 DAY), 'active'),
('e-025', 'u-stud-008', 'c-tajik-001', DATE_SUB(NOW(), INTERVAL 10 DAY), 'active'),
('e-026', 'u-stud-009', 'c-arab-001', DATE_SUB(NOW(), INTERVAL 10 DAY), 'active'),
('e-027', 'u-stud-009', 'c-tajik-001', DATE_SUB(NOW(), INTERVAL 10 DAY), 'active'),
('e-028', 'u-stud-010', 'c-bio-001', DATE_SUB(NOW(), INTERVAL 10 DAY), 'active'),
('e-029', 'u-stud-010', 'c-chem-001', DATE_SUB(NOW(), INTERVAL 8 DAY), 'active'),
('e-030', 'u-stud-006', 'c-math-001', DATE_SUB(NOW(), INTERVAL 6 DAY), 'pending'),
('e-031', 'u-stud-007', 'c-web-001', DATE_SUB(NOW(), INTERVAL 4 DAY), 'invited'),
('e-032', 'u-stud-001', 'c-data-001', DATE_SUB(NOW(), INTERVAL 3 DAY), 'active'),
('e-033', 'u-stud-002', 'c-rus-001', DATE_SUB(NOW(), INTERVAL 5 DAY), 'active'),
('e-034', 'u-stud-004', 'c-chem-001', DATE_SUB(NOW(), INTERVAL 6 DAY), 'active');

-- ============================================================
-- CURRICULUM TOPICS (32 topics across courses)
-- ============================================================
INSERT INTO course_curriculum_topics (id, course_id, title, description, sort_order, visible, created_at) VALUES
-- Advanced English topics
('t-001', 'c-eng-001', 'Grammar Foundations', 'Advanced tenses, conditionals, and passive voice review', 1, TRUE, NOW()),
('t-002', 'c-eng-001', 'Academic Writing', 'Essay structure, thesis statements, and argumentation', 2, TRUE, NOW()),
('t-003', 'c-eng-001', 'Speaking & Pronunciation', 'Fluency drills, accent reduction, and public speaking', 3, TRUE, NOW()),
('t-004', 'c-eng-001', 'Listening Comprehension', 'Lectures, podcasts, and note-taking strategies', 4, TRUE, NOW()),
('t-005', 'c-eng-001', 'Final Exam Preparation', 'Mock tests and review sessions', 5, FALSE, NOW()),
-- IELTS topics
('t-006', 'c-eng-002', 'IELTS Reading Strategies', 'Skimming, scanning, and keyword matching', 1, TRUE, NOW()),
('t-007', 'c-eng-002', 'IELTS Writing Task 1', 'Describing graphs, charts, and processes', 2, TRUE, NOW()),
('t-008', 'c-eng-002', 'IELTS Writing Task 2', 'Opinion essays, discussion essays, and problem-solution', 3, TRUE, NOW()),
('t-009', 'c-eng-002', 'IELTS Speaking Parts 1-3', 'Cue cards, follow-up questions, and vocabulary range', 4, TRUE, NOW()),
-- Calculus topics
('t-010', 'c-math-001', 'Limits and Continuity', 'Epsilon-delta definition, squeeze theorem, L''Hopital''s rule', 1, TRUE, NOW()),
('t-011', 'c-math-001', 'Derivatives', 'Power rule, chain rule, implicit differentiation', 2, TRUE, NOW()),
('t-012', 'c-math-001', 'Applications of Derivatives', 'Optimization, related rates, curve sketching', 3, TRUE, NOW()),
('t-013', 'c-math-001', 'Integration', 'Riemann sums, fundamental theorem, techniques of integration', 4, TRUE, NOW()),
-- Programming topics
('t-014', 'c-prog-001', 'Python Basics', 'Variables, data types, operators, input/output', 1, TRUE, NOW()),
('t-015', 'c-prog-001', 'Control Flow', 'if/else, loops, break/continue, error handling', 2, TRUE, NOW()),
('t-016', 'c-prog-001', 'Functions & Modules', 'Defining functions, parameters, return values, importing', 3, TRUE, NOW()),
('t-017', 'c-prog-001', 'Object-Oriented Programming', 'Classes, inheritance, encapsulation, polymorphism', 4, TRUE, NOW()),
('t-018', 'c-prog-001', 'File I/O & Data Persistence', 'Reading/writing files, JSON, CSV handling', 5, TRUE, NOW()),
('t-019', 'c-prog-001', 'Final Project', 'Build a complete application using everything learned', 6, FALSE, NOW()),
-- Web Dev topics
('t-020', 'c-web-001', 'HTML & Semantic Markup', 'Document structure, tags, forms, accessibility', 1, TRUE, NOW()),
('t-021', 'c-web-001', 'CSS & Responsive Design', 'Flexbox, Grid, media queries, animations', 2, TRUE, NOW()),
('t-022', 'c-web-001', 'JavaScript Fundamentals', 'DOM manipulation, events, fetch API, async/await', 3, TRUE, NOW()),
('t-023', 'c-web-001', 'React Basics', 'Components, state, props, hooks, routing', 4, TRUE, NOW()),
('t-024', 'c-web-001', 'Full-Stack Project', 'Build and deploy a complete web application', 5, FALSE, NOW()),
-- Biology topics
('t-025', 'c-bio-001', 'Cell Biology', 'Cell structure, organelles, membrane transport', 1, TRUE, NOW()),
('t-026', 'c-bio-001', 'Genetics', 'Mendelian genetics, DNA replication, gene expression', 2, TRUE, NOW()),
('t-027', 'c-bio-001', 'Evolution', 'Natural selection, speciation, phylogenetics', 3, TRUE, NOW()),
('t-028', 'c-bio-001', 'Ecology', 'Populations, communities, ecosystems, biodiversity', 4, TRUE, NOW()),
-- Arabic topics
('t-029', 'c-arab-001', 'Arabic Alphabet & Phonetics', 'Letters, harakat, connecting forms, pronunciation', 1, TRUE, NOW()),
('t-030', 'c-arab-001', 'Basic Grammar', 'Nouns, pronouns, basic verb conjugation', 2, TRUE, NOW()),
('t-031', 'c-arab-001', 'Daily Conversations', 'Greetings, shopping, travel, and restaurant phrases', 3, TRUE, NOW()),
('t-032', 'c-arab-001', 'Reading Practice', 'Short stories and news articles with vocabulary building', 4, TRUE, NOW());

-- ============================================================
-- MORE PAYMENTS (8 more, including receipt_url)
-- ============================================================
INSERT INTO payments (id, student_user_id, course_id, amount, method, note, receipt_url, recorded_by, paid_at, created_at) VALUES
('p-013', 'u-stud-006', 'c-eng-001', 450.00, 'transfer', 'Full payment', 'https://i.imgur.com/receipt001.jpg', 'u-sadmin-001', DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY)),
('p-014', 'u-stud-006', 'c-rus-001', 380.00, 'card', 'Card payment', 'https://i.imgur.com/receipt002.jpg', 'u-sadmin-001', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
('p-015', 'u-stud-007', 'c-prog-001', 550.00, 'transfer', 'Bank transfer', 'https://i.imgur.com/receipt003.jpg', 'u-sadmin-002', DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY)),
('p-016', 'u-stud-008', 'c-arab-001', 420.00, 'cash', 'Paid in cash', NULL, 'u-sadmin-003', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
('p-017', 'u-stud-008', 'c-pers-001', 400.00, 'transfer', 'Bank transfer', 'https://i.imgur.com/receipt004.jpg', 'u-sadmin-003', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
('p-018', 'u-stud-009', 'c-arab-001', 420.00, 'cash', 'Cash', NULL, 'u-sadmin-003', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
('p-019', 'u-stud-010', 'c-bio-001', 350.00, 'card', 'Visa card', 'https://i.imgur.com/receipt005.jpg', 'u-teach-004', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
('p-020', 'u-stud-010', 'c-chem-001', 400.00, 'transfer', 'Mobile transfer', 'https://i.imgur.com/receipt006.jpg', 'u-teach-004', DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY));

-- ============================================================
-- MORE GRADES (12 more)
-- ============================================================
INSERT INTO grades (id, student_user_id, course_id, title, score, letter_grade, comment, graded_by, graded_at, created_at) VALUES
('g-025', 'u-stud-006', 'c-eng-001', 'Midterm Exam', 82, 'B', 'Good effort, practice speaking more', 'u-teach-001', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
('g-026', 'u-stud-006', 'c-rus-001', 'Poetry Analysis', 91, 'A-', 'Beautiful interpretation of Pushkin', 'u-teach-005', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
('g-027', 'u-stud-007', 'c-prog-001', 'Project 1: Calculator', 93, 'A', 'Added GUI — impressive initiative', 'u-teach-003', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
('g-028', 'u-stud-008', 'c-arab-001', 'Alphabet Quiz', 97, 'A+', 'Perfect pronunciation and writing', 'u-teach-006', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY)),
('g-029', 'u-stud-008', 'c-arab-001', 'Grammar Quiz', 88, 'B+', 'Minor errors in verb conjugation', 'u-teach-006', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
('g-030', 'u-stud-009', 'c-arab-001', 'Alphabet Quiz', 85, 'B', 'Need to work on connecting forms', 'u-teach-006', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY)),
('g-031', 'u-stud-010', 'c-bio-001', 'Cell Biology Quiz', 89, 'B+', 'Great understanding of organelles', 'u-teach-004', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
('g-032', 'u-stud-010', 'c-chem-001', 'Hydrocarbons Quiz', 78, 'C+', 'Review alkene reactions', 'u-teach-004', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
('g-033', 'u-stud-001', 'c-data-001', 'Pandas Exercise', 95, 'A', 'Excellent data manipulation skills', 'u-teach-003', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
('g-034', 'u-stud-002', 'c-rus-001', 'Tolstoy Essay', 87, 'B+', 'Good analysis, deepen thematic exploration', 'u-teach-005', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
('g-035', 'u-stud-004', 'c-chem-001', 'Hydrocarbons Quiz', 92, 'A-', 'Excellent grasp of nomenclature', 'u-teach-004', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
('g-036', 'u-stud-007', 'c-prog-001', 'Midterm: Python Basics', 86, 'B', 'Good but review list comprehensions', 'u-teach-003', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY));

-- ============================================================
-- MORE ATTENDANCE (18 more)
-- ============================================================
INSERT INTO attendance (id, enrollment_id, course_id, student_user_id, date, status, note, marked_by, created_at) VALUES
('a-037', 'e-019', 'c-eng-001', 'u-stud-006', '2026-02-18', 'present', '', 'u-teach-001', NOW()),
('a-038', 'e-019', 'c-eng-001', 'u-stud-006', '2026-02-20', 'present', '', 'u-teach-001', NOW()),
('a-039', 'e-019', 'c-eng-001', 'u-stud-006', '2026-02-16', 'late', 'Bus delay', 'u-teach-001', NOW()),
('a-040', 'e-020', 'c-rus-001', 'u-stud-006', '2026-02-18', 'present', '', 'u-teach-005', NOW()),
('a-041', 'e-020', 'c-rus-001', 'u-stud-006', '2026-02-20', 'present', '', 'u-teach-005', NOW()),
('a-042', 'e-021', 'c-prog-001', 'u-stud-007', '2026-02-17', 'present', '', 'u-teach-003', NOW()),
('a-043', 'e-021', 'c-prog-001', 'u-stud-007', '2026-02-19', 'present', '', 'u-teach-003', NOW()),
('a-044', 'e-023', 'c-arab-001', 'u-stud-008', '2026-02-17', 'present', '', 'u-teach-006', NOW()),
('a-045', 'e-023', 'c-arab-001', 'u-stud-008', '2026-02-19', 'present', '', 'u-teach-006', NOW()),
('a-046', 'e-023', 'c-arab-001', 'u-stud-008', '2026-02-14', 'present', '', 'u-teach-006', NOW()),
('a-047', 'e-026', 'c-arab-001', 'u-stud-009', '2026-02-17', 'present', '', 'u-teach-006', NOW()),
('a-048', 'e-026', 'c-arab-001', 'u-stud-009', '2026-02-19', 'absent', 'Family matter', 'u-teach-006', NOW()),
('a-049', 'e-028', 'c-bio-001', 'u-stud-010', '2026-02-19', 'present', '', 'u-teach-004', NOW()),
('a-050', 'e-028', 'c-bio-001', 'u-stud-010', '2026-02-15', 'present', '', 'u-teach-004', NOW()),
('a-051', 'e-029', 'c-chem-001', 'u-stud-010', '2026-02-17', 'present', '', 'u-teach-004', NOW()),
('a-052', 'e-029', 'c-chem-001', 'u-stud-010', '2026-02-20', 'late', '', 'u-teach-004', NOW()),
('a-053', 'e-033', 'c-rus-001', 'u-stud-002', '2026-02-20', 'present', '', 'u-teach-005', NOW()),
('a-054', 'e-034', 'c-chem-001', 'u-stud-004', '2026-02-20', 'present', '', 'u-teach-004', NOW());

-- ============================================================
-- MORE RATINGS (8 more)
-- ============================================================
INSERT INTO ratings (id, from_user_id, to_user_id, to_school_id, score, comment, created_at) VALUES
('r-009', 'u-stud-006', 'u-teach-001', NULL, 4, 'Good teacher, sometimes fast-paced for new students.', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('r-010', 'u-stud-006', 'u-teach-005', NULL, 5, 'Elena makes Russian literature come alive!', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('r-011', 'u-stud-008', 'u-teach-006', NULL, 5, 'Best Arabic teacher in Dushanbe. Very patient.', DATE_SUB(NOW(), INTERVAL 4 DAY)),
('r-012', 'u-stud-009', 'u-teach-006', NULL, 4, 'Good teacher, classes are well-structured.', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('r-013', 'u-stud-007', 'u-teach-003', NULL, 5, 'Farhod makes coding fun and practical!', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('r-014', 'u-stud-010', 'u-teach-004', NULL, 4, 'Explains science clearly. Good for university prep.', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('r-015', 'u-stud-008', NULL, 's-linguist-001', 5, 'Amazing language school! Clean facility and great teachers.', DATE_SUB(NOW(), INTERVAL 4 DAY)),
('r-016', 'u-stud-002', NULL, 's-oxford-001', 5, 'The best school in Dushanbe. Highly recommend!', DATE_SUB(NOW(), INTERVAL 2 DAY));

-- ============================================================
-- MORE MESSAGES (10 more)
-- ============================================================
INSERT INTO messages (id, from_user_id, to_user_id, content, is_read, created_at) VALUES
('m-015', 'u-stud-008', 'u-teach-006', 'Assalomu alaykum! Could you recommend a good Arabic dictionary app?', TRUE, DATE_SUB(NOW(), INTERVAL 4 DAY)),
('m-016', 'u-teach-006', 'u-stud-008', 'Wa alaykum assalom! Try "Al-Maany" — it has excellent Arabic-Tajik translations.', TRUE, DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 30 MINUTE),
('m-017', 'u-stud-008', 'u-teach-006', 'Thank you! I''ll download it today.', TRUE, DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 35 MINUTE),
('m-018', 'u-stud-007', 'u-teach-003', 'Hi, I saw the Data Science course. Is it too advanced for me?', TRUE, DATE_SUB(NOW(), INTERVAL 3 DAY)),
('m-019', 'u-teach-003', 'u-stud-007', 'Since you''re doing well in Programming, you should be fine! I recommend finishing the OOP module first.', FALSE, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 1 HOUR),
('m-020', 'u-stud-006', 'u-teach-005', 'Elena Petrovna, which edition of Pushkin''s works should I buy?', TRUE, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('m-021', 'u-teach-005', 'u-stud-006', 'Get the "Complete Prose" collection by Eksmo publishing. Available at Tojikiston bookstore.', FALSE, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 2 HOUR),
('m-022', 'u-sadmin-001', 'u-teach-001', 'James, can you prepare the end-of-month student progress reports by Friday?', TRUE, DATE_SUB(NOW(), INTERVAL 1 DAY)),
('m-023', 'u-teach-001', 'u-sadmin-001', 'Of course, Rustam. I''ll have them ready by Thursday afternoon.', FALSE, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 45 MINUTE),
('m-024', 'u-stud-010', 'u-teach-004', 'Can we schedule an extra biology tutoring session for this weekend?', FALSE, DATE_SUB(NOW(), INTERVAL 12 HOUR));

-- ============================================================
-- MORE NOTIFICATIONS (8 more)
-- ============================================================
INSERT INTO notifications (id, user_id, type, title, message, link, is_read, created_at) VALUES
('n-013', 'u-stud-006', 'grade', 'New Grade: Advanced English', 'You received 82/100 on Midterm Exam', '/grades', FALSE, DATE_SUB(NOW(), INTERVAL 4 DAY)),
('n-014', 'u-stud-006', 'grade', 'New Grade: Russian Literature', 'You received 91/100 on Poetry Analysis', '/grades', FALSE, DATE_SUB(NOW(), INTERVAL 3 DAY)),
('n-015', 'u-stud-007', 'grade', 'New Grade: Intro to Programming', 'You received 93/100 on Project 1', '/grades', FALSE, DATE_SUB(NOW(), INTERVAL 5 DAY)),
('n-016', 'u-stud-008', 'grade', 'New Grade: Arabic for Beginners', 'You received 97/100 on Alphabet Quiz — Outstanding!', '/grades', FALSE, DATE_SUB(NOW(), INTERVAL 6 DAY)),
('n-017', 'u-stud-010', 'assignment', 'New Assignment: Genetics Lab Report', 'Due Feb 26 — Biology for University', '/homework', TRUE, DATE_SUB(NOW(), INTERVAL 6 DAY)),
('n-018', 'u-teach-006', 'system', 'Welcome to SchoolTJ!', 'Your teacher account at Linguist Academy is ready.', '/', TRUE, DATE_SUB(NOW(), INTERVAL 14 DAY)),
('n-019', 'u-teach-005', 'system', 'New Student Enrolled', 'Farzona Rahimova has enrolled in Russian Literature', '/students', FALSE, DATE_SUB(NOW(), INTERVAL 10 DAY)),
('n-020', 'u-sadmin-003', 'system', 'Linguist Academy Active', 'Your school has been verified and is now active.', '/', TRUE, DATE_SUB(NOW(), INTERVAL 14 DAY));

-- ============================================================
-- MORE ANNOUNCEMENTS (4 more)
-- ============================================================
INSERT INTO announcements (id, course_id, author_id, title, content, is_pinned, created_at) VALUES
('ann-007', 'c-arab-001', 'u-teach-006', 'Arabic Calligraphy Workshop', 'Join us for a special calligraphy workshop next Saturday at 10 AM. Learn Naskh and Thuluth scripts. Pen and ink provided!', FALSE, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('ann-008', NULL, 'u-sadmin-003', 'Linguist Academy Now Open!', 'We are excited to announce that Linguist Academy is now accepting enrollments for Arabic, Persian, and Tajik language courses. Visit us at 22 Sino St!', TRUE, DATE_SUB(NOW(), INTERVAL 14 DAY)),
('ann-009', 'c-data-001', 'u-teach-003', 'Laptop Required for Next Class', 'Please bring your laptops with Python and Jupyter Notebook installed for our first hands-on data analysis session.', FALSE, DATE_SUB(NOW(), INTERVAL 1 DAY)),
('ann-010', 'c-rus-001', 'u-teach-005', 'Pushkin Evening', 'We will have a poetry reading evening on March 1st celebrating Pushkin''s legacy. Bring your favorite poem!', FALSE, DATE_SUB(NOW(), INTERVAL 3 DAY));
