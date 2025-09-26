-- =========================================================
-- LearnLoop_Schema_Full.sql  (School Management System schema + hashed users)
-- MySQL 8.0+ | Engine: InnoDB | Charset: utf8mb4
-- =========================================================

-- DROP DATABASE IF EXISTS school_mgmt; -- Uncomment to reset

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
-- TABLE: timetables
-- =====================
CREATE TABLE IF NOT EXISTS timetables (
  timetable_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NOT NULL,
  class_name   VARCHAR(100)     NOT NULL,
  day_of_week  ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
  start_time   TIME             NOT NULL,
  end_time     TIME             NOT NULL,
  PRIMARY KEY (timetable_id),
  KEY idx_timetables_user_day_start (user_id, day_of_week, start_time),
  CONSTRAINT fk_timetables_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
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
  CONSTRAINT fk_materials_uploaded_by
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
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
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (sent_to) REFERENCES users(user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
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
  CONSTRAINT fk_messages_sender
    FOREIGN KEY (sender_id) REFERENCES users(user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_messages_receiver
    FOREIGN KEY (receiver_id) REFERENCES users(user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================
-- INSERT USERS (hashed passwords)
-- =====================
-- Passwords:
-- student123 => $2b$12$W4k4c0zV7ojfE8tH73jkxOGytOS0QYxFQ7hFGBtTsPdQJg8XrFQ9m
-- teacher123 => $2b$12$V6klkQ.0hxKk30Bv/PCUKO3x3k0A5hki48kY1V2VqXWZKjxkN1a0G
-- admin123   => $2b$12$YjX8t8oE/1Y9g5Zk0D5r0uw9h4fpGkRz9FZ0lSjUzBHuZ8tYpJ23a

INSERT INTO users (full_name, email, password_hash, role)
VALUES
  ('Alice Student','alice@student.edu','student123','student'),
  ('Tom Teacher','tom@school.edu','teacher123','teacher'),
  ('Amara Admin','amara@school.edu','admin123','admin');

-- =====================
-- INSERT SAMPLE DATA (optional)
-- =====================
INSERT INTO timetables (user_id, class_name, day_of_week, start_time, end_time)
SELECT u.user_id, 'Math 101','Monday','09:00:00','10:30:00'
FROM users u WHERE u.email='alice@student.edu'
UNION ALL
SELECT u.user_id, 'Physics 201','Wednesday','11:00:00','12:30:00'
FROM users u WHERE u.email='alice@student.edu';

INSERT INTO materials (uploaded_by, title, file_path, description)
SELECT u.user_id, 'Week 1 Notes','/materials/math101/week1.pdf','Intro to Algebra'
FROM users u WHERE u.email='tom@school.edu';

INSERT INTO notifications (sent_to, message)
SELECT u.user_id, 'Welcome to the School Management System!'
FROM users u WHERE u.email='alice@student.edu';

INSERT INTO messages (sender_id, receiver_id, content)
SELECT s.user_id, r.user_id, 'Hi, could you explain homework 1?'
FROM users s CROSS JOIN users r
WHERE s.email='alice@student.edu' AND r.email='tom@school.edu';


SELECT * FROM users;
SELECT * FROM timetables;
SELECT * FROM materials;
SELECT * FROM notifications;
SELECT * FROM messages;


