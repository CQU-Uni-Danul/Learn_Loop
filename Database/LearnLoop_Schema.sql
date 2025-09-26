-- =========================================================
-- LearnLoop_Schema.sql (Updated School Management System)
-- MySQL 8.0+ | Engine: InnoDB | Charset: utf8mb4
-- =========================================================

-- Uncomment next line for full reset
-- DROP DATABASE IF EXISTS school_mgmt;

CREATE DATABASE IF NOT EXISTS school_mgmt
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE school_mgmt;

-- =====================
-- TABLE: users
-- =====================
CREATE TABLE IF NOT EXISTS users (
  user_id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name      VARCHAR(100)     NOT NULL,
  email          VARCHAR(255)     NOT NULL,
  password_hash  VARCHAR(255)     NOT NULL,
  role           ENUM('student','teacher','admin') NOT NULL,
  date_created   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB;

-- =====================
-- TABLE: classes
-- =====================
CREATE TABLE IF NOT EXISTS classes (
  class_id    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  class_name  VARCHAR(50) NOT NULL, -- e.g. "8A"
  PRIMARY KEY (class_id),
  UNIQUE KEY uk_classes_name (class_name)
) ENGINE=InnoDB;

-- =====================
-- TABLE: class_students
-- =====================
CREATE TABLE IF NOT EXISTS class_students (
  class_student_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  class_id   BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (class_student_id),
  UNIQUE KEY uk_class_student (class_id, student_id),
  FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================
-- TABLE: timetables
-- =====================
CREATE TABLE IF NOT EXISTS timetables (
  timetable_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  class_id     BIGINT UNSIGNED NOT NULL,
  teacher_id   BIGINT UNSIGNED NULL,
  subject_name VARCHAR(100)     NOT NULL,
  day_of_week  ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
  start_time   TIME             NOT NULL,
  end_time     TIME             NOT NULL,
  PRIMARY KEY (timetable_id),
  KEY idx_timetables_class_day_start (class_id, day_of_week, start_time),
  FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(user_id) ON DELETE SET NULL,
  CONSTRAINT chk_time_order CHECK (start_time < end_time)
) ENGINE=InnoDB;

-- =====================
-- TABLE: materials
-- =====================
CREATE TABLE IF NOT EXISTS materials (
  material_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uploaded_by BIGINT UNSIGNED NULL,
  title       VARCHAR(200)     NOT NULL,
  file_path   VARCHAR(500)     NOT NULL,
  upload_date DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  description TEXT             NULL,
  PRIMARY KEY (material_id),
  KEY idx_materials_uploader_date (uploaded_by, upload_date),
  FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================
-- TABLE: notifications
-- =====================
CREATE TABLE IF NOT EXISTS notifications (
  notification_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sent_to         BIGINT UNSIGNED NOT NULL,
  message         TEXT            NOT NULL,
  date_sent       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_read         TINYINT(1)      NOT NULL DEFAULT 0,
  PRIMARY KEY (notification_id),
  KEY idx_notifications_user_date (sent_to, date_sent),
  FOREIGN KEY (sent_to) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================
-- TABLE: messages
-- =====================
CREATE TABLE IF NOT EXISTS messages (
  message_id  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sender_id   BIGINT UNSIGNED NOT NULL,
  receiver_id BIGINT UNSIGNED NOT NULL,
  content     TEXT            NOT NULL,
  ts          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (message_id),
  KEY idx_messages_sender_ts (sender_id, ts),
  KEY idx_messages_receiver_ts (receiver_id, ts),
  FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================
-- SAMPLE DATA (with bcrypt hashes)
-- =====================

-- Users
INSERT INTO users (full_name, email, password_hash, role)
VALUES
  -- alice@student.edu / student123
  ('Alice Student','alice@student.edu',
   '$2b$12$AKS2vSxS3Iq5OO96DMzzEuknMMfh0/O/kLbDnPP050PijmJhPqhhu','student'),

  -- bob@student.edu / bob123
  ('Bob Student','bob@student.edu',
   '$2b$12$dXJysC.5wV7oH/o6MJnTOO4t8Vcxgwl7QOzZpAemzXnL0gOHXjRi2','student'),

  -- cathy@student.edu / cathy123
  ('Cathy Student','cathy@student.edu',
   '$2b$12$Ldz2i7KwsmOGpQoGz0BMu.LRSlgYrbfQvbrShQH5rT8a41uCDEqRW','student'),

  -- tom@school.edu / teacher123
  ('Tom Teacher','tom@school.edu',
   '$2b$12$QHjzj2u6Wykv9oQz7tQdZe2H/3aY0Y3wG2ZfBqfZ4oYpGm6h1Y7Wm','teacher'),

  -- amara@school.edu / admin123
  ('Amara Admin','amara@school.edu',
   '$2b$12$FSU4n7jP9Gx7Z.7LhgfLwOqUuQdLz8Yx6X0eHVK/UY3YoKxHhjMze','admin')
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- Classes
INSERT INTO classes (class_name) VALUES ('8A'),('9B'),('10C')
ON DUPLICATE KEY UPDATE class_name = VALUES(class_name);

-- Assign students to classes
INSERT INTO class_students (class_id, student_id)
SELECT c.class_id, u.user_id
FROM classes c, users u
WHERE c.class_name='8A' AND u.email='alice@student.edu'
ON DUPLICATE KEY UPDATE student_id = student_id;

INSERT INTO class_students (class_id, student_id)
SELECT c.class_id, u.user_id
FROM classes c, users u
WHERE c.class_name='9B' AND u.email='bob@student.edu'
ON DUPLICATE KEY UPDATE student_id = student_id;

INSERT INTO class_students (class_id, student_id)
SELECT c.class_id, u.user_id
FROM classes c, users u
WHERE c.class_name='10C' AND u.email='cathy@student.edu'
ON DUPLICATE KEY UPDATE student_id = student_id;

-- Timetable entries
INSERT INTO timetables (class_id, teacher_id, subject_name, day_of_week, start_time, end_time)
SELECT c.class_id, t.user_id, 'Mathematics','Monday','09:00:00','10:00:00'
FROM classes c, users t
WHERE c.class_name='8A' AND t.email='tom@school.edu'
ON DUPLICATE KEY UPDATE subject_name = VALUES(subject_name);

INSERT INTO timetables (class_id, teacher_id, subject_name, day_of_week, start_time, end_time)
SELECT c.class_id, t.user_id, 'Physics','Wednesday','11:00:00','12:00:00'
FROM classes c, users t
WHERE c.class_name='8A' AND t.email='tom@school.edu'
ON DUPLICATE KEY UPDATE subject_name = VALUES(subject_name);

INSERT INTO timetables (class_id, teacher_id, subject_name, day_of_week, start_time, end_time)
SELECT c.class_id, t.user_id, 'English','Thursday','10:00:00','11:00:00'
FROM classes c, users t
WHERE c.class_name='8A' AND t.email='tom@school.edu'
ON DUPLICATE KEY UPDATE subject_name = VALUES(subject_name);

INSERT INTO timetables (class_id, teacher_id, subject_name, day_of_week, start_time, end_time)
SELECT c.class_id, t.user_id, 'Physics','Wednesday','11:00:00','12:30:00'
FROM classes c, users t
WHERE c.class_name='9B' AND t.email='tom@school.edu'
ON DUPLICATE KEY UPDATE subject_name = VALUES(subject_name);

-- Quick check
SELECT * FROM users;
SELECT * FROM classes;
SELECT * FROM class_students;
SELECT * FROM timetables;
SELECT * FROM students;


SELECT distinct tt.day_of_week AS day,
       tt.start_time   AS start,
       tt.end_time     AS end,
       tt.subject_name AS subject,
       u.full_name     AS teacher
FROM class_students cs
JOIN classes c ON cs.class_id = c.class_id
JOIN timetables tt ON tt.class_id = c.class_id
LEFT JOIN users u ON tt.teacher_id = u.user_id
WHERE cs.student_id = 1
ORDER BY FIELD(tt.day_of_week,
               'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'),
         tt.start_time;



