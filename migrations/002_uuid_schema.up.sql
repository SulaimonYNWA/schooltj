-- Drop tables if they exist (to reset schema for UUIDs)
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS teachers; -- Old table
DROP TABLE IF EXISTS schools;
DROP TABLE IF EXISTS users;

-- Recreate tables with UUIDs
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'school_admin', 'teacher', 'student') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE schools (
    id CHAR(36) PRIMARY KEY,
    admin_user_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100) DEFAULT 'Dushanbe',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE teacher_profiles (
    user_id CHAR(36) PRIMARY KEY,
    school_id CHAR(36) NULL, -- Nullable for independent teachers
    bio TEXT,
    subjects JSON, -- MySQL 5.7+ / 8.0 supports JSON
    hourly_rate DECIMAL(10, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'TJS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
);

CREATE TABLE students (
    user_id CHAR(36) PRIMARY KEY,
    parent_name VARCHAR(255),
    grade_level VARCHAR(50), -- e.g. "10th Grade"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Re-create deleted tables with UUID FKs
CREATE TABLE courses (
    id CHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    school_id CHAR(36) NULL,
    teacher_id CHAR(36) NULL,
    price DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teacher_profiles(user_id) ON DELETE SET NULL
);

CREATE TABLE enrollments (
    id CHAR(36) PRIMARY KEY,
    student_user_id CHAR(36) NOT NULL,
    course_id CHAR(36) NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'completed', 'dropped') DEFAULT 'active',
    FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE payments (
    id CHAR(36) PRIMARY KEY,
    student_user_id CHAR(36) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TJS',
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    transaction_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
);
