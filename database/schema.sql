-- ============================================================
-- Online Quiz System — MySQL Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS online_quiz_system
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE online_quiz_system;

-- ------------------------------------------------------------
-- 1. Users
-- ------------------------------------------------------------
CREATE TABLE users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100)  NOT NULL,
  email        VARCHAR(255)  NOT NULL UNIQUE,
  password     VARCHAR(255)  NOT NULL,           -- bcrypt hash
  role         ENUM('student','admin') NOT NULL DEFAULT 'student',
  avatar_url   VARCHAR(500)  DEFAULT NULL,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role  (role)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 2. Quizzes
-- ------------------------------------------------------------
CREATE TABLE quizzes (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  title          VARCHAR(255)  NOT NULL,
  description    TEXT          DEFAULT NULL,
  subject        VARCHAR(100)  NOT NULL DEFAULT 'General',
  exam_type      VARCHAR(100)  NOT NULL DEFAULT 'Practice',
  duration       INT           NOT NULL DEFAULT 600,           -- seconds
  passing_marks  INT           NOT NULL DEFAULT 0,
  total_marks    INT           NOT NULL DEFAULT 0,
  status         ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  created_by     INT           NOT NULL,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_quizzes_status (status)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 3. Questions
-- ------------------------------------------------------------
CREATE TABLE questions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id     INT           NOT NULL,
  text        TEXT          NOT NULL,
  explanation TEXT          DEFAULT NULL,              -- shown after quiz submission
  difficulty  ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
  marks       INT           NOT NULL DEFAULT 1,
  position    INT           NOT NULL DEFAULT 0,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  INDEX idx_questions_quiz (quiz_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 4. Options (multiple-choice answers)
-- ------------------------------------------------------------
CREATE TABLE options (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  question_id   INT           NOT NULL,
  label         CHAR(1)       NOT NULL,            -- A, B, C, D …
  text          TEXT          NOT NULL,
  is_correct    BOOLEAN       NOT NULL DEFAULT FALSE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_options_question (question_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 5. Attempts
-- ------------------------------------------------------------
CREATE TABLE attempts (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT           NOT NULL,
  quiz_id        INT           NOT NULL,
  started_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deadline       TIMESTAMP     NOT NULL,
  submitted_at   TIMESTAMP     NULL DEFAULT NULL,
  score          INT           DEFAULT NULL,
  total_marks    INT           DEFAULT NULL,
  status         ENUM('in_progress','submitted','expired') NOT NULL DEFAULT 'in_progress',
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  INDEX idx_attempts_user  (user_id),
  INDEX idx_attempts_quiz  (quiz_id),
  INDEX idx_attempts_status (status),
  INDEX idx_attempts_user_quiz (user_id, quiz_id, status)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 6. Attempt Answers
-- ------------------------------------------------------------
CREATE TABLE attempt_answers (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  attempt_id     INT           NOT NULL,
  question_id    INT           NOT NULL,
  selected_option_id INT       DEFAULT NULL,
  is_correct     BOOLEAN       DEFAULT NULL,
  is_bookmarked  BOOLEAN       NOT NULL DEFAULT FALSE,
  answered_at    TIMESTAMP     NULL DEFAULT NULL,
  FOREIGN KEY (attempt_id)        REFERENCES attempts(id)  ON DELETE CASCADE,
  FOREIGN KEY (question_id)       REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (selected_option_id) REFERENCES options(id)  ON DELETE SET NULL,
  UNIQUE KEY uk_attempt_question (attempt_id, question_id),
  INDEX idx_aa_attempt (attempt_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 7. Payments
-- ------------------------------------------------------------
CREATE TABLE payments (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT           NOT NULL,
  payment_id       VARCHAR(100)  NOT NULL,              -- gateway or generated ID
  order_id         VARCHAR(100)  DEFAULT NULL,
  amount           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency         VARCHAR(10)   NOT NULL DEFAULT 'INR',
  product_id       VARCHAR(100)  NOT NULL,
  product_name     VARCHAR(255)  NOT NULL,
  status           ENUM('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
  payment_method   VARCHAR(50)   DEFAULT 'card',        -- card, razorpay, upi, etc.
  card_last_four   VARCHAR(4)    DEFAULT NULL,
  card_holder_name VARCHAR(100)  DEFAULT NULL,
  created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_payments_user   (user_id),
  INDEX idx_payments_status (status)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 8. User Subscriptions
-- ------------------------------------------------------------
CREATE TABLE user_subscriptions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT           NOT NULL,
  product_id    VARCHAR(100)  NOT NULL,
  product_name  VARCHAR(255)  NOT NULL,
  plan_type     ENUM('free','pro','enterprise','offer') NOT NULL DEFAULT 'free',
  status        ENUM('active','expired','cancelled')    NOT NULL DEFAULT 'active',
  payment_id    INT           DEFAULT NULL,              -- FK to payments.id
  activated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at    TIMESTAMP     NULL DEFAULT NULL,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
  INDEX idx_subs_user   (user_id),
  INDEX idx_subs_status (status),
  INDEX idx_subs_expiry (expires_at)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 9. Seed Data  —  Demo admin + student + sample quiz
-- ------------------------------------------------------------

-- Passwords: admin123 / student123  (bcrypt hashed)
INSERT INTO users (name, email, password, role) VALUES
  ('Admin User',   'admin@quiz.com',   '$2b$10$dxXPRy0ujfRsBWLRWV/Me.cPT8CJ9qWabuOvh1bvOn.QQ1EMjj9Ka', 'admin'),
  ('Student Name',  'student@quiz.com', '$2b$10$675Ks3.I3DhjGudaYeK2nOZkljYkwz/FG20Mh.1pSWCj.t/iRmne2', 'student');

INSERT INTO quizzes (title, description, subject, exam_type, duration, passing_marks, total_marks, status, created_by) VALUES
  ('Physics Fundamentals', 'Test your knowledge of basic physics concepts.', 'Physics', 'Model Test', 300, 2, 4, 'published', 1),
  ('Bangla Literature', 'Questions on Bangla grammar and literature.', 'Bangla', 'Model Test', 600, 3, 4, 'published', 1);

-- Quiz 1 questions
INSERT INTO questions (quiz_id, text, marks, position) VALUES
  (1, 'Which of the following shows current relationship between?', 1, 1),
  (1, 'What is the SI unit of force?', 1, 2),
  (1, 'Newton''s first law is also known as?', 1, 3),
  (1, 'What is the acceleration due to gravity on Earth?', 1, 4);

-- Options for Quiz 1
INSERT INTO options (question_id, label, text, is_correct) VALUES
  (1, 'A', 'Inertia is directly proportional to mass', 1),
  (1, 'B', 'Inertia is inversely proportional to mass', 0),
  (1, 'C', 'No effect on each other', 0),
  (1, 'D', 'None of the above', 0),

  (2, 'A', 'Joule', 0),
  (2, 'B', 'Newton', 1),
  (2, 'C', 'Pascal', 0),
  (2, 'D', 'Watt', 0),

  (3, 'A', 'Law of Acceleration', 0),
  (3, 'B', 'Law of Reaction', 0),
  (3, 'C', 'Law of Inertia', 1),
  (3, 'D', 'Law of Gravitation', 0),

  (4, 'A', '9.8 m/s²', 1),
  (4, 'B', '10.2 m/s²', 0),
  (4, 'C', '8.9 m/s²', 0),
  (4, 'D', '11.0 m/s²', 0);

-- Quiz 2 questions
INSERT INTO questions (quiz_id, text, marks, position) VALUES
  (2, 'বাংলা ভাষার উদ্ভব কোন ভাষা থেকে?', 1, 1),
  (2, 'Which is the national language of Bangladesh?', 1, 2),
  (2, 'রবীন্দ্রনাথ ঠাকুর কত সালে নোবেল পুরস্কার পান?', 1, 3),
  (2, 'বাংলা বর্ণমালায় মোট কতটি বর্ণ আছে?', 1, 4);

INSERT INTO options (question_id, label, text, is_correct) VALUES
  (5, 'A', 'সংস্কৃত', 0),
  (5, 'B', 'প্রাকৃত', 1),
  (5, 'C', 'পালি', 0),
  (5, 'D', 'হিন্দি', 0),

  (6, 'A', 'Hindi', 0),
  (6, 'B', 'Bangla', 1),
  (6, 'C', 'Urdu', 0),
  (6, 'D', 'English', 0),

  (7, 'A', '1911', 0),
  (7, 'B', '1913', 1),
  (7, 'C', '1915', 0),
  (7, 'D', '1920', 0),

  (8, 'A', '40', 0),
  (8, 'B', '50', 1),
  (8, 'C', '45', 0),
  (8, 'D', '55', 0);
