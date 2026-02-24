-- SchoolTJ Comprehensive Seed Data
-- All users use password: password123
-- Hash: $2a$10$atuxSUmd5surZoo9dV/slOCz1dHmVzXa3PrkuGhm5XHvh7G26oO1q

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE submissions;
TRUNCATE TABLE assignments;
TRUNCATE TABLE messages;
TRUNCATE TABLE notifications;
TRUNCATE TABLE grades;
TRUNCATE TABLE attendance;
TRUNCATE TABLE payments;
TRUNCATE TABLE announcements;
TRUNCATE TABLE ratings;
TRUNCATE TABLE enrollments;
TRUNCATE TABLE courses;
TRUNCATE TABLE students;
TRUNCATE TABLE teacher_profiles;
TRUNCATE TABLE schools;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- USERS (12 total)
-- ============================================================
INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at) VALUES
-- System admin
('u-admin-001', 'admin@school.tj', 'System Admin', '$2a$10$atuxSUmd5surZoo9dV/slOCz1dHmVzXa3PrkuGhm5XHvh7G26oO1q', 'admin', NOW(), NOW()),
-- School admins
('u-sadmin-001', 'director@oxford.tj', 'Rustam Karimov', '$2a$10$atuxSUmd5surZoo9dV/slOCz1dHmVzXa3PrkuGhm5XHvh7G26oO1q', 'school_admin', NOW(), NOW()),
('u-sadmin-002', 'director@eurasia.tj', 'Malika Nazarova', '$2a$10$atuxSUmd5surZoo9dV/slOCz1dHmVzXa3PrkuGhm5XHvh7G26oO1q', 'school_admin', NOW(), NOW()),
-- Teachers
('u-teach-001', 'james.harris@oxford.tj', 'James Harris', '$2a$10$atuxSUmd5surZoo9dV/slOCz1dHmVzXa3PrkuGhm5XHvh7G26oO1q', 'teacher', NOW(), NOW()),
('u-teach-002', 'nodira.saidova@oxford.tj', 'Nodira Saidova', '$2a$10$atuxSUmd5surZoo9dV/slOCz1dHmVzXa3PrkuGhm5XHvh7G26oO1q', 'teacher', NOW(), NOW()),
('u-teach-003', 'farhod.rahimov@eurasia.tj', 'Farhod Rahimov', '$2a$10$atuxSUmd5surZoo9dV/slOCz1dHmVzXa3PrkuGhm5XHvh7G26oO1q', 'teacher', NOW(), NOW()),
('u-teach-004', 'freelance.teacher@gmail.com', 'Anvar Toshmatov', '$2a$10$atuxSUmd5surZoo9dV/slOCz1dHmVzXa3PrkuGhm5XHvh7G26oO1q', 'teacher', NOW(), NOW()),
-- Students
('u-stud-001', 'azamat@gmail.com', 'Azamat Sharipov', '$2a$10$atuxSUmd5surZoo9dV/slOCz1dHmVzXa3PrkuGhm5XHvh7G26oO1q', 'student', NOW(), NOW()),
('u-stud-002', 'dilnoza@gmail.com', 'Dilnoza Umarova', '$2a$10$atuxSUmd5surZoo9dV/slOCz1dHmVzXa3PrkuGhm5XHvh7G26oO1q', 'student', NOW(), NOW()),
('u-stud-003', 'timur@gmail.com', 'Timur Kamolov', '$2a$10$atuxSUmd5surZoo9dV/slOCz1dHmVzXa3PrkuGhm5XHvh7G26oO1q', 'student', NOW(), NOW()),
('u-stud-004', 'sitora@gmail.com', 'Sitora Mirzoeva', '$2a$10$atuxSUmd5surZoo9dV/slOCz1dHmVzXa3PrkuGhm5XHvh7G26oO1q', 'student', NOW(), NOW()),
('u-stud-005', 'jasur@gmail.com', 'Jasur Abdullaev', '$2a$10$atuxSUmd5surZoo9dV/slOCz1dHmVzXa3PrkuGhm5XHvh7G26oO1q', 'student', NOW(), NOW());

-- ============================================================
-- SCHOOLS (3)
-- ============================================================
INSERT INTO schools (id, admin_user_id, name, tax_id, phone, address, city, is_verified, rating_avg, rating_count, created_at, updated_at) VALUES
('s-oxford-001', 'u-sadmin-001', 'Oxford Language Center', '123456789', '+992-37-227-1234', '15 Rudaki Ave', 'Dushanbe', TRUE, 4.5, 12, NOW(), NOW()),
('s-eurasia-001', 'u-sadmin-002', 'Eurasia STEM Academy', '987654321', '+992-37-224-5678', '42 Ismoili Somoni St', 'Dushanbe', TRUE, 4.2, 8, NOW(), NOW()),
('s-arts-001', 'u-sadmin-001', 'Creative Arts Studio', '555666777', '+992-37-221-9012', '8 Mirzo Tursunzade', 'Khujand', FALSE, 0, 0, NOW(), NOW());

-- ============================================================
-- TEACHER PROFILES
-- ============================================================
INSERT INTO teacher_profiles (user_id, school_id, bio, subjects, hourly_rate, currency, created_at, updated_at) VALUES
('u-teach-001', 's-oxford-001', 'Native English speaker with 10 years of teaching experience. Specializes in IELTS and TOEFL preparation.', '["English", "IELTS", "TOEFL"]', 200.00, 'TJS', NOW(), NOW()),
('u-teach-002', 's-oxford-001', 'Mathematics and Physics teacher. PhD in Applied Mathematics from Moscow State University.', '["Mathematics", "Physics", "Calculus"]', 180.00, 'TJS', NOW(), NOW()),
('u-teach-003', 's-eurasia-001', 'Computer Science instructor specializing in Python, web development, and data structures.', '["Programming", "Python", "Web Development"]', 220.00, 'TJS', NOW(), NOW()),
('u-teach-004', NULL, 'Freelance Biology and Chemistry tutor. Available for private and group sessions.', '["Biology", "Chemistry"]', 150.00, 'TJS', NOW(), NOW());

-- ============================================================
-- STUDENTS
-- ============================================================
INSERT INTO students (user_id, parent_name, grade_level, school_id, teacher_id, created_at, updated_at) VALUES
('u-stud-001', 'Sharipov Karim', '11th Grade', 's-oxford-001', 'u-teach-001', NOW(), NOW()),
('u-stud-002', 'Umarova Zilola', '10th Grade', 's-oxford-001', 'u-teach-002', NOW(), NOW()),
('u-stud-003', 'Kamolov Rustam', '12th Grade', 's-eurasia-001', 'u-teach-003', NOW(), NOW()),
('u-stud-004', 'Mirzoeva Nigina', '10th Grade', 's-eurasia-001', 'u-teach-003', NOW(), NOW()),
('u-stud-005', 'Abdullaev Bahrom', '11th Grade', NULL, 'u-teach-004', NOW(), NOW());

-- ============================================================
-- COURSES (8) — connected to schools and teachers
-- ============================================================
INSERT INTO courses (id, title, description, school_id, teacher_id, price, schedule, created_at, updated_at) VALUES
('c-eng-001', 'Advanced English', 'C1 level grammar, speaking, and writing. IELTS preparation included.', 's-oxford-001', 'u-teach-001', 450.00,
 '{"days":["Mon","Wed","Fri"],"start_time":"09:00","end_time":"10:30","start_date":"2026-02-01","end_date":"2026-06-01"}', NOW(), NOW()),

('c-eng-002', 'IELTS Preparation', 'Intensive IELTS exam prep course targeting band 7+.', 's-oxford-001', 'u-teach-001', 600.00,
 '{"days":["Tue","Thu"],"start_time":"14:00","end_time":"16:00","start_date":"2026-03-01","end_date":"2026-05-15"}', NOW(), NOW()),

('c-math-001', 'Calculus AB', 'University prep mathematics covering limits, derivatives, and integrals.', 's-oxford-001', 'u-teach-002', 500.00,
 '{"days":["Tue","Thu"],"start_time":"10:00","end_time":"11:30","start_date":"2026-02-01","end_date":"2026-06-01"}', NOW(), NOW()),

('c-phys-001', 'Physics Fundamentals', 'Mechanics, thermodynamics, and wave theory for 11th-12th graders.', 's-oxford-001', 'u-teach-002', 480.00,
 '{"days":["Mon","Fri"],"start_time":"13:00","end_time":"14:30","start_date":"2026-02-01","end_date":"2026-06-01"}', NOW(), NOW()),

('c-prog-001', 'Intro to Programming', 'Python fundamentals: variables, loops, functions, and OOP basics.', 's-eurasia-001', 'u-teach-003', 550.00,
 '{"days":["Mon","Wed"],"start_time":"15:00","end_time":"17:00","start_date":"2026-02-01","end_date":"2026-06-01"}', NOW(), NOW()),

('c-web-001', 'Web Development', 'Full-stack web development with HTML, CSS, JavaScript, and React.', 's-eurasia-001', 'u-teach-003', 650.00,
 '{"days":["Tue","Thu","Sat"],"start_time":"10:00","end_time":"12:00","start_date":"2026-03-01","end_date":"2026-07-01"}', NOW(), NOW()),

('c-bio-001', 'Biology for University', 'Cell biology, genetics, ecology — covering all entrance exam topics.', NULL, 'u-teach-004', 350.00,
 '{"days":["Wed","Sat"],"start_time":"11:00","end_time":"12:30","start_date":"2026-02-15","end_date":"2026-06-15"}', NOW(), NOW()),

('c-hist-001', 'History of Tajikistan', 'Ancient Samanid dynasty to modern independence. Cultural heritage focus.', 's-eurasia-001', 'u-teach-003', 300.00,
 '{"days":["Fri"],"start_time":"14:00","end_time":"16:00","start_date":"2026-02-01","end_date":"2026-06-01"}', NOW(), NOW());

-- ============================================================
-- ENROLLMENTS (18) — connect students to courses
-- ============================================================
INSERT INTO enrollments (id, student_user_id, course_id, enrolled_at, status) VALUES
-- Azamat (Oxford student) → 3 courses
('e-001', 'u-stud-001', 'c-eng-001', DATE_SUB(NOW(), INTERVAL 14 DAY), 'active'),
('e-002', 'u-stud-001', 'c-math-001', DATE_SUB(NOW(), INTERVAL 14 DAY), 'active'),
('e-003', 'u-stud-001', 'c-phys-001', DATE_SUB(NOW(), INTERVAL 7 DAY), 'active'),
-- Dilnoza (Oxford student) → 3 courses
('e-004', 'u-stud-002', 'c-eng-001', DATE_SUB(NOW(), INTERVAL 14 DAY), 'active'),
('e-005', 'u-stud-002', 'c-math-001', DATE_SUB(NOW(), INTERVAL 14 DAY), 'active'),
('e-006', 'u-stud-002', 'c-eng-002', DATE_SUB(NOW(), INTERVAL 5 DAY), 'active'),
-- Timur (Eurasia student) → 3 courses
('e-007', 'u-stud-003', 'c-prog-001', DATE_SUB(NOW(), INTERVAL 14 DAY), 'active'),
('e-008', 'u-stud-003', 'c-web-001', DATE_SUB(NOW(), INTERVAL 10 DAY), 'active'),
('e-009', 'u-stud-003', 'c-hist-001', DATE_SUB(NOW(), INTERVAL 14 DAY), 'active'),
-- Sitora (Eurasia student) → 3 courses
('e-010', 'u-stud-004', 'c-prog-001', DATE_SUB(NOW(), INTERVAL 14 DAY), 'active'),
('e-011', 'u-stud-004', 'c-web-001', DATE_SUB(NOW(), INTERVAL 10 DAY), 'active'),
('e-012', 'u-stud-004', 'c-hist-001', DATE_SUB(NOW(), INTERVAL 14 DAY), 'active'),
-- Jasur (freelance student) → 2 courses
('e-013', 'u-stud-005', 'c-bio-001', DATE_SUB(NOW(), INTERVAL 14 DAY), 'active'),
('e-014', 'u-stud-005', 'c-eng-001', DATE_SUB(NOW(), INTERVAL 7 DAY), 'pending'),
-- Cross-school: Azamat also takes programming
('e-015', 'u-stud-001', 'c-prog-001', DATE_SUB(NOW(), INTERVAL 3 DAY), 'active'),
-- Cross-school: Timur also takes biology
('e-016', 'u-stud-003', 'c-bio-001', DATE_SUB(NOW(), INTERVAL 7 DAY), 'active'),
-- Dropped enrollment
('e-017', 'u-stud-004', 'c-bio-001', DATE_SUB(NOW(), INTERVAL 21 DAY), 'dropped'),
-- Completed enrollment
('e-018', 'u-stud-005', 'c-hist-001', DATE_SUB(NOW(), INTERVAL 60 DAY), 'completed');

-- ============================================================
-- GRADES (24)
-- ============================================================
INSERT INTO grades (id, student_user_id, course_id, title, score, letter_grade, comment, graded_by, graded_at, created_at) VALUES
-- Advanced English grades
('g-001', 'u-stud-001', 'c-eng-001', 'Midterm Exam', 88, 'B+', 'Strong speaking skills, needs work on writing', 'u-teach-001', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
('g-002', 'u-stud-001', 'c-eng-001', 'Essay Assignment', 92, 'A-', 'Excellent argumentative essay', 'u-teach-001', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
('g-003', 'u-stud-002', 'c-eng-001', 'Midterm Exam', 95, 'A', 'Outstanding performance across all sections', 'u-teach-001', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
('g-004', 'u-stud-002', 'c-eng-001', 'Essay Assignment', 90, 'A-', 'Well-structured, minor grammar issues', 'u-teach-001', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
-- Calculus grades
('g-005', 'u-stud-001', 'c-math-001', 'Quiz 1: Limits', 78, 'C+', 'Review L\'Hopital\'s rule', 'u-teach-002', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
('g-006', 'u-stud-001', 'c-math-001', 'Midterm Exam', 85, 'B', 'Good improvement from quiz', 'u-teach-002', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
('g-007', 'u-stud-002', 'c-math-001', 'Quiz 1: Limits', 91, 'A-', 'Excellent understanding of limits', 'u-teach-002', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
('g-008', 'u-stud-002', 'c-math-001', 'Midterm Exam', 94, 'A', 'Top of the class', 'u-teach-002', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
-- Physics grades
('g-009', 'u-stud-001', 'c-phys-001', 'Lab Report 1', 82, 'B-', 'Good lab work, improve conclusions', 'u-teach-002', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
-- Programming grades
('g-010', 'u-stud-003', 'c-prog-001', 'Project 1: Calculator', 96, 'A', 'Clean code, well-documented', 'u-teach-003', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
('g-011', 'u-stud-003', 'c-prog-001', 'Midterm: Python Basics', 89, 'B+', 'Good understanding of OOP', 'u-teach-003', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
('g-012', 'u-stud-004', 'c-prog-001', 'Project 1: Calculator', 88, 'B+', 'Works correctly, add more comments', 'u-teach-003', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
('g-013', 'u-stud-004', 'c-prog-001', 'Midterm: Python Basics', 92, 'A-', 'Strong grasp of data structures', 'u-teach-003', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
('g-014', 'u-stud-001', 'c-prog-001', 'Project 1: Calculator', 90, 'A-', 'Excellent UI design for CLI app', 'u-teach-003', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY)),
-- Web Dev grades
('g-015', 'u-stud-003', 'c-web-001', 'Portfolio Website', 94, 'A', 'Beautiful responsive design', 'u-teach-003', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
('g-016', 'u-stud-004', 'c-web-001', 'Portfolio Website', 87, 'B+', 'Good layout, improve mobile view', 'u-teach-003', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
-- Biology grades
('g-017', 'u-stud-005', 'c-bio-001', 'Cell Biology Quiz', 76, 'C', 'Study mitosis process more carefully', 'u-teach-004', DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY)),
('g-018', 'u-stud-005', 'c-bio-001', 'Genetics Exam', 83, 'B', 'Good improvement, keep studying', 'u-teach-004', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
('g-019', 'u-stud-003', 'c-bio-001', 'Cell Biology Quiz', 91, 'A-', 'Very thorough answers', 'u-teach-004', DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY)),
-- History grades
('g-020', 'u-stud-003', 'c-hist-001', 'Samanid Dynasty Essay', 87, 'B+', 'Good historical analysis', 'u-teach-003', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY)),
('g-021', 'u-stud-004', 'c-hist-001', 'Samanid Dynasty Essay', 93, 'A', 'Exceptional research and writing', 'u-teach-003', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY)),
-- IELTS grades
('g-022', 'u-stud-002', 'c-eng-002', 'Practice Test 1', 85, 'B', 'Band 6.5 equivalent, target is 7+', 'u-teach-001', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
('g-023', 'u-stud-002', 'c-eng-002', 'Practice Test 2', 90, 'A-', 'Band 7.0 — great improvement!', 'u-teach-001', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
('g-024', 'u-stud-001', 'c-eng-001', 'Vocabulary Quiz', 79, 'C+', 'Study phrasal verbs more', 'u-teach-001', DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY));

-- ============================================================
-- ATTENDANCE (36)
-- ============================================================
INSERT INTO attendance (id, enrollment_id, course_id, student_user_id, date, status, note, marked_by, created_at) VALUES
-- Adv English — Azamat (Mon/Wed/Fri)
('a-001', 'e-001', 'c-eng-001', 'u-stud-001', '2026-02-16', 'present', '', 'u-teach-001', NOW()),
('a-002', 'e-001', 'c-eng-001', 'u-stud-001', '2026-02-18', 'present', '', 'u-teach-001', NOW()),
('a-003', 'e-001', 'c-eng-001', 'u-stud-001', '2026-02-20', 'late', 'Arrived 15 min late', 'u-teach-001', NOW()),
('a-004', 'e-001', 'c-eng-001', 'u-stud-001', '2026-02-14', 'present', '', 'u-teach-001', NOW()),
('a-005', 'e-001', 'c-eng-001', 'u-stud-001', '2026-02-12', 'absent', 'Sick', 'u-teach-001', NOW()),
('a-006', 'e-001', 'c-eng-001', 'u-stud-001', '2026-02-10', 'present', '', 'u-teach-001', NOW()),
-- Adv English — Dilnoza
('a-007', 'e-004', 'c-eng-001', 'u-stud-002', '2026-02-16', 'present', '', 'u-teach-001', NOW()),
('a-008', 'e-004', 'c-eng-001', 'u-stud-002', '2026-02-18', 'present', '', 'u-teach-001', NOW()),
('a-009', 'e-004', 'c-eng-001', 'u-stud-002', '2026-02-20', 'present', '', 'u-teach-001', NOW()),
('a-010', 'e-004', 'c-eng-001', 'u-stud-002', '2026-02-14', 'present', '', 'u-teach-001', NOW()),
('a-011', 'e-004', 'c-eng-001', 'u-stud-002', '2026-02-12', 'present', '', 'u-teach-001', NOW()),
-- Calculus — Azamat (Tue/Thu)
('a-012', 'e-002', 'c-math-001', 'u-stud-001', '2026-02-18', 'present', '', 'u-teach-002', NOW()),
('a-013', 'e-002', 'c-math-001', 'u-stud-001', '2026-02-20', 'present', '', 'u-teach-002', NOW()),
('a-014', 'e-002', 'c-math-001', 'u-stud-001', '2026-02-13', 'present', '', 'u-teach-002', NOW()),
('a-015', 'e-002', 'c-math-001', 'u-stud-001', '2026-02-11', 'late', '', 'u-teach-002', NOW()),
-- Calculus — Dilnoza
('a-016', 'e-005', 'c-math-001', 'u-stud-002', '2026-02-18', 'present', '', 'u-teach-002', NOW()),
('a-017', 'e-005', 'c-math-001', 'u-stud-002', '2026-02-20', 'present', '', 'u-teach-002', NOW()),
('a-018', 'e-005', 'c-math-001', 'u-stud-002', '2026-02-13', 'absent', 'Family event', 'u-teach-002', NOW()),
-- Programming — Timur (Mon/Wed)
('a-019', 'e-007', 'c-prog-001', 'u-stud-003', '2026-02-17', 'present', '', 'u-teach-003', NOW()),
('a-020', 'e-007', 'c-prog-001', 'u-stud-003', '2026-02-19', 'present', '', 'u-teach-003', NOW()),
('a-021', 'e-007', 'c-prog-001', 'u-stud-003', '2026-02-12', 'present', '', 'u-teach-003', NOW()),
('a-022', 'e-007', 'c-prog-001', 'u-stud-003', '2026-02-10', 'present', '', 'u-teach-003', NOW()),
-- Programming — Sitora
('a-023', 'e-010', 'c-prog-001', 'u-stud-004', '2026-02-17', 'present', '', 'u-teach-003', NOW()),
('a-024', 'e-010', 'c-prog-001', 'u-stud-004', '2026-02-19', 'late', 'Traffic', 'u-teach-003', NOW()),
('a-025', 'e-010', 'c-prog-001', 'u-stud-004', '2026-02-12', 'present', '', 'u-teach-003', NOW()),
-- Programming — Azamat
('a-026', 'e-015', 'c-prog-001', 'u-stud-001', '2026-02-19', 'present', '', 'u-teach-003', NOW()),
-- Biology — Jasur (Wed/Sat)
('a-027', 'e-013', 'c-bio-001', 'u-stud-005', '2026-02-19', 'present', '', 'u-teach-004', NOW()),
('a-028', 'e-013', 'c-bio-001', 'u-stud-005', '2026-02-15', 'present', '', 'u-teach-004', NOW()),
('a-029', 'e-013', 'c-bio-001', 'u-stud-005', '2026-02-12', 'absent', '', 'u-teach-004', NOW()),
-- Biology — Timur
('a-030', 'e-016', 'c-bio-001', 'u-stud-003', '2026-02-19', 'present', '', 'u-teach-004', NOW()),
('a-031', 'e-016', 'c-bio-001', 'u-stud-003', '2026-02-15', 'present', '', 'u-teach-004', NOW()),
-- Web Dev — Timur
('a-032', 'e-008', 'c-web-001', 'u-stud-003', '2026-02-18', 'present', '', 'u-teach-003', NOW()),
('a-033', 'e-008', 'c-web-001', 'u-stud-003', '2026-02-20', 'present', '', 'u-teach-003', NOW()),
-- Web Dev — Sitora
('a-034', 'e-011', 'c-web-001', 'u-stud-004', '2026-02-18', 'present', '', 'u-teach-003', NOW()),
('a-035', 'e-011', 'c-web-001', 'u-stud-004', '2026-02-20', 'absent', 'Sick', 'u-teach-003', NOW()),
-- Physics — Azamat
('a-036', 'e-003', 'c-phys-001', 'u-stud-001', '2026-02-17', 'present', '', 'u-teach-002', NOW());

-- ============================================================
-- PAYMENTS (12)
-- ============================================================
INSERT INTO payments (id, student_user_id, course_id, amount, method, note, recorded_by, paid_at, created_at) VALUES
('p-001', 'u-stud-001', 'c-eng-001', 450.00, 'cash', 'Full course fee', 'u-sadmin-001', DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY)),
('p-002', 'u-stud-001', 'c-math-001', 250.00, 'transfer', 'First installment', 'u-sadmin-001', DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY)),
('p-003', 'u-stud-001', 'c-math-001', 250.00, 'transfer', 'Second installment', 'u-sadmin-001', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
('p-004', 'u-stud-002', 'c-eng-001', 450.00, 'cash', 'Full course fee', 'u-sadmin-001', DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY)),
('p-005', 'u-stud-002', 'c-math-001', 500.00, 'transfer', 'Full payment', 'u-sadmin-001', DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY)),
('p-006', 'u-stud-002', 'c-eng-002', 600.00, 'cash', 'IELTS prep full fee', 'u-sadmin-001', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
('p-007', 'u-stud-003', 'c-prog-001', 550.00, 'transfer', 'Programming course', 'u-sadmin-002', DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY)),
('p-008', 'u-stud-003', 'c-web-001', 325.00, 'cash', 'First half payment', 'u-sadmin-002', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
('p-009', 'u-stud-004', 'c-prog-001', 550.00, 'cash', 'Full payment', 'u-sadmin-002', DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY)),
('p-010', 'u-stud-004', 'c-web-001', 650.00, 'transfer', 'Full payment', 'u-sadmin-002', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
('p-011', 'u-stud-005', 'c-bio-001', 350.00, 'cash', 'Biology course', 'u-teach-004', DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY)),
('p-012', 'u-stud-001', 'c-prog-001', 550.00, 'transfer', 'Programming course fee', 'u-sadmin-002', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY));

-- ============================================================
-- ANNOUNCEMENTS (6)
-- ============================================================
INSERT INTO announcements (id, course_id, author_id, title, content, is_pinned, created_at) VALUES
('ann-001', NULL, 'u-sadmin-001', 'Welcome to Spring Semester 2026!', 'Dear students and teachers,\n\nWelcome back! Classes begin on February 1st. Please check your timetables and make sure you have all required materials.\n\nBest regards,\nOxford Language Center', TRUE, DATE_SUB(NOW(), INTERVAL 21 DAY)),
('ann-002', 'c-eng-001', 'u-teach-001', 'IELTS Mock Test Next Week', 'We will have a full practice IELTS test next Wednesday. Please bring headphones for the listening section. Review chapters 5-8.', FALSE, DATE_SUB(NOW(), INTERVAL 3 DAY)),
('ann-003', 'c-prog-001', 'u-teach-003', 'Hackathon This Saturday!', 'Join our mini-hackathon this Saturday from 10 AM to 4 PM. Form teams of 2-3. Pizza and drinks provided! Theme: build a useful tool for students.', FALSE, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('ann-004', NULL, 'u-sadmin-002', 'Eurasia STEM Academy Open Day', 'We are hosting an Open Day on March 15th. Invite your friends! Demos of our programming, robotics, and web development labs.', TRUE, DATE_SUB(NOW(), INTERVAL 7 DAY)),
('ann-005', 'c-math-001', 'u-teach-002', 'Extra Office Hours', 'I will hold extra office hours on Thursday 3-5 PM for anyone who needs help with integration by parts before the exam.', FALSE, DATE_SUB(NOW(), INTERVAL 1 DAY)),
('ann-006', 'c-bio-001', 'u-teach-004', 'Textbook Update', 'Please download the new chapter on Genetics from the shared folder. The old PDF had errors in section 4.2.', FALSE, DATE_SUB(NOW(), INTERVAL 4 DAY));

-- ============================================================
-- ASSIGNMENTS (8) + SUBMISSIONS (10)
-- ============================================================
INSERT INTO assignments (id, course_id, title, description, due_date, max_score, created_by, created_at, updated_at) VALUES
('hw-001', 'c-eng-001', 'Argumentative Essay', 'Write a 500-word essay arguing for or against online education. Use at least 3 sources.', '2026-02-25', 100, 'u-teach-001', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
('hw-002', 'c-eng-001', 'Vocabulary Worksheet', 'Complete the phrasal verbs worksheet (pages 45-48). Submit a photo of your work.', '2026-02-22', 50, 'u-teach-001', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
('hw-003', 'c-math-001', 'Integration Problem Set', 'Solve problems 1-20 from Chapter 6. Show all work.', '2026-02-24', 100, 'u-teach-002', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
('hw-004', 'c-prog-001', 'Build a To-Do App', 'Create a command-line to-do application in Python with add, delete, and list features. Use file storage.', '2026-02-28', 100, 'u-teach-003', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
('hw-005', 'c-web-001', 'Personal Portfolio', 'Build a responsive personal portfolio website using HTML, CSS, and JavaScript. Must include: about, projects, and contact sections.', '2026-03-01', 100, 'u-teach-003', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
('hw-006', 'c-bio-001', 'Genetics Lab Report', 'Write a lab report on the Mendelian genetics experiment from class. Include hypothesis, methods, results, and conclusion.', '2026-02-26', 100, 'u-teach-004', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY)),
('hw-007', 'c-phys-001', 'Mechanics Problem Set', 'Solve the 15 problems on Newton\'s laws from the handout. Due Friday.', '2026-02-28', 100, 'u-teach-002', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
('hw-008', 'c-hist-001', 'Timeline Project', 'Create a detailed timeline of the Samanid dynasty (819-999 CE) with at least 15 key events and illustrations.', '2026-03-05', 100, 'u-teach-003', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY));

INSERT INTO submissions (id, assignment_id, student_user_id, content, link, score, feedback, submitted_at, graded_at) VALUES
('sub-001', 'hw-001', 'u-stud-001', 'Online education has transformed the way we learn...', '', 88, 'Strong thesis, but needs more supporting evidence in paragraph 3.', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
('sub-002', 'hw-001', 'u-stud-002', 'The debate over online education continues to grow...', '', 95, 'Excellent structure and compelling arguments. Well-researched.', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
('sub-003', 'hw-002', 'u-stud-001', 'Completed worksheet attached', '', NULL, '', DATE_SUB(NOW(), INTERVAL 1 DAY), NULL),
('sub-004', 'hw-003', 'u-stud-001', 'Solutions for problems 1-20 attached. Used substitution for #14.', '', 82, 'Error in problem 15. Review integration by parts.', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
('sub-005', 'hw-003', 'u-stud-002', 'All 20 problems solved. Extra credit attempted.', '', NULL, '', DATE_SUB(NOW(), INTERVAL 1 DAY), NULL),
('sub-006', 'hw-004', 'u-stud-003', 'GitHub repo: https://github.com/timur/todo-app', 'https://github.com/timur/todo-app', 96, 'Excellent code quality! Clean architecture.', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
('sub-007', 'hw-004', 'u-stud-004', 'My to-do app implementation with file persistence', '', 88, 'Works well, add error handling for edge cases.', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
('sub-008', 'hw-004', 'u-stud-001', 'To-do CLI with colorful output and priorities', '', NULL, '', DATE_SUB(NOW(), INTERVAL 2 DAY), NULL),
('sub-009', 'hw-006', 'u-stud-005', 'Lab report on pea plant crosses', '', 78, 'Good methodology section, but conclusion needs more depth.', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
('sub-010', 'hw-006', 'u-stud-003', 'Mendelian genetics experiment analysis including chi-square test', '', 94, 'Impressive statistical analysis. One of the best reports.', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

-- ============================================================
-- NOTIFICATIONS (12)
-- ============================================================
INSERT INTO notifications (id, user_id, type, title, message, link, is_read, created_at) VALUES
('n-001', 'u-stud-001', 'grade', 'New Grade: Advanced English', 'You received 88/100 on Midterm Exam', '/grades', FALSE, DATE_SUB(NOW(), INTERVAL 5 DAY)),
('n-002', 'u-stud-001', 'grade', 'New Grade: Calculus', 'You received 85/100 on Midterm Exam', '/grades', FALSE, DATE_SUB(NOW(), INTERVAL 3 DAY)),
('n-003', 'u-stud-001', 'assignment', 'New Assignment: Argumentative Essay', 'Due Feb 25 — Advanced English', '/homework', TRUE, DATE_SUB(NOW(), INTERVAL 7 DAY)),
('n-004', 'u-stud-001', 'announcement', 'Hackathon This Saturday!', 'Check out the Programming course announcement', '/announcements', FALSE, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('n-005', 'u-stud-002', 'grade', 'New Grade: IELTS Prep', 'You received 90/100 on Practice Test 2 — Band 7.0!', '/grades', FALSE, DATE_SUB(NOW(), INTERVAL 1 DAY)),
('n-006', 'u-stud-002', 'assignment', 'New Assignment: Vocabulary Worksheet', 'Due Feb 22 — Advanced English', '/homework', TRUE, DATE_SUB(NOW(), INTERVAL 4 DAY)),
('n-007', 'u-stud-003', 'grade', 'New Grade: Web Development', 'You received 94/100 on Portfolio Website', '/grades', FALSE, DATE_SUB(NOW(), INTERVAL 4 DAY)),
('n-008', 'u-stud-003', 'assignment', 'New Assignment: Build a To-Do App', 'Due Feb 28 — Intro to Programming', '/homework', TRUE, DATE_SUB(NOW(), INTERVAL 10 DAY)),
('n-009', 'u-stud-004', 'grade', 'New Grade: History', 'You received 93/100 on Samanid Dynasty Essay — Excellent!', '/grades', FALSE, DATE_SUB(NOW(), INTERVAL 6 DAY)),
('n-010', 'u-stud-005', 'grade', 'New Grade: Biology', 'You received 83/100 on Genetics Exam', '/grades', FALSE, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('n-011', 'u-teach-001', 'system', 'Welcome to SchoolTJ!', 'Your teacher account has been set up. Check your courses and start adding content.', '/', TRUE, DATE_SUB(NOW(), INTERVAL 21 DAY)),
('n-012', 'u-teach-003', 'system', 'New Student Enrolled', 'Azamat Sharipov has enrolled in Intro to Programming', '/students', FALSE, DATE_SUB(NOW(), INTERVAL 3 DAY));

-- ============================================================
-- MESSAGES (14) — realistic teacher-student conversations
-- ============================================================
INSERT INTO messages (id, from_user_id, to_user_id, content, is_read, created_at) VALUES
-- Conversation: James (teacher) ↔ Azamat (student)
('m-001', 'u-teach-001', 'u-stud-001', 'Hi Azamat! I noticed you were late today. Everything okay?', TRUE, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('m-002', 'u-stud-001', 'u-teach-001', 'Sorry Mr. Harris, traffic was bad. It won''t happen again.', TRUE, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 10 MINUTE),
('m-003', 'u-teach-001', 'u-stud-001', 'No worries! Also, great job on your essay. Your writing has improved a lot this semester.', TRUE, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 25 MINUTE),
('m-004', 'u-stud-001', 'u-teach-001', 'Thank you! I''ve been reading more English newspapers like you suggested.', TRUE, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 30 MINUTE),
('m-005', 'u-teach-001', 'u-stud-001', 'That''s great to hear! Keep it up. Don''t forget the vocabulary worksheet is due tomorrow.', FALSE, DATE_SUB(NOW(), INTERVAL 1 DAY)),
-- Conversation: Farhod (teacher) ↔ Timur (student)
('m-006', 'u-stud-003', 'u-teach-003', 'Mr. Rahimov, I submitted my to-do app. Can you check if the GitHub link works?', TRUE, DATE_SUB(NOW(), INTERVAL 5 DAY)),
('m-007', 'u-teach-003', 'u-stud-003', 'Just checked — the link works fine. I''ll grade it by tomorrow. I already see you added extra features!', TRUE, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 45 MINUTE),
('m-008', 'u-stud-003', 'u-teach-003', 'Yes, I added priority levels and color-coded output. Thanks for the quick response!', TRUE, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 50 MINUTE),
('m-009', 'u-teach-003', 'u-stud-003', 'Just graded it — 96/100! Outstanding work. I''d love for you to present it at the hackathon this Saturday.', FALSE, DATE_SUB(NOW(), INTERVAL 3 DAY)),
-- Conversation: Anvar (freelance teacher) ↔ Jasur (student)
('m-010', 'u-stud-005', 'u-teach-004', 'Hi, I missed class on Wednesday. Can you share what we covered?', TRUE, DATE_SUB(NOW(), INTERVAL 7 DAY)),
('m-011', 'u-teach-004', 'u-stud-005', 'We covered DNA replication and transcription. I''ll send you the notes. Make sure to review chapter 7 before next class.', TRUE, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 2 HOUR),
('m-012', 'u-stud-005', 'u-teach-004', 'Got it, thank you! Will the lab report topic change because of this?', TRUE, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 3 HOUR),
('m-013', 'u-teach-004', 'u-stud-005', 'No, the genetics lab report stays the same. Just make sure to include the new material we discussed in your analysis.', TRUE, DATE_SUB(NOW(), INTERVAL 6 DAY)),
('m-014', 'u-stud-005', 'u-teach-004', 'I submitted my lab report. Looking forward to your feedback!', FALSE, DATE_SUB(NOW(), INTERVAL 3 DAY));

-- ============================================================
-- RATINGS (8)
-- ============================================================
INSERT INTO ratings (id, from_user_id, to_user_id, to_school_id, score, comment, created_at) VALUES
('r-001', 'u-stud-001', 'u-teach-001', NULL, 5, 'Best English teacher! Really helped me improve my IELTS score.', DATE_SUB(NOW(), INTERVAL 10 DAY)),
('r-002', 'u-stud-002', 'u-teach-001', NULL, 5, 'Amazing teaching methods. Very patient and knowledgeable.', DATE_SUB(NOW(), INTERVAL 8 DAY)),
('r-003', 'u-stud-001', 'u-teach-002', NULL, 4, 'Great at explaining complex math concepts. Homework can be heavy.', DATE_SUB(NOW(), INTERVAL 7 DAY)),
('r-004', 'u-stud-003', 'u-teach-003', NULL, 5, 'Farhod is an incredible programming teacher. Very inspiring!', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('r-005', 'u-stud-004', 'u-teach-003', NULL, 4, 'Great teacher, classes are very practical and hands-on.', DATE_SUB(NOW(), INTERVAL 4 DAY)),
('r-006', 'u-stud-001', NULL, 's-oxford-001', 5, 'Oxford Language Center has been excellent. Great facilities and teachers.', DATE_SUB(NOW(), INTERVAL 6 DAY)),
('r-007', 'u-stud-003', NULL, 's-eurasia-001', 4, 'Good STEM programs, especially programming courses.', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('r-008', 'u-stud-005', 'u-teach-004', NULL, 4, 'Helpful tutor, explains things clearly. Flexible scheduling.', DATE_SUB(NOW(), INTERVAL 2 DAY));
