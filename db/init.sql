CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category_id INT,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_text TEXT,
    quiz_id INT,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
);

CREATE TABLE IF NOT EXISTS options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    option_text TEXT,
    is_correct BOOLEAN DEFAULT FALSE,
    question_id INT,
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

INSERT INTO categories (name) VALUES ('Horoskop'), ('Quiz'), ('Głosowanie');

INSERT INTO quizzes (title, category_id) VALUES ('Quiz o zwierzetach', 2);

INSERT INTO questions (question_text, quiz_id) VALUES 
  ('Jakie zwierze miauczy?', 1),
  ('Ktore zwierze ma trabe?', 1);

INSERT INTO options (option_text, question_id, is_correct) VALUES 
  ('Kot', 1, TRUE), 
  ('Pies', 1, FALSE), 
  ('Krowa', 1, FALSE),
  ('Slon', 2, TRUE), 
  ('Kon', 2, FALSE), 
  ('Swinia', 2, FALSE);
