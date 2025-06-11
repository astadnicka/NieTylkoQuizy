CREATE DATABASE IF NOT EXISTS quizdb CHARACTER SET utf8mb4 COLLATE utf8mb4_polish_ci;
CREATE DATABASE IF NOT EXISTS keycloak CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'keycloak'@'%' IDENTIFIED BY 'keycloak';
CREATE USER IF NOT EXISTS 'quizuser'@'%' IDENTIFIED BY 'quizpassword';

GRANT ALL PRIVILEGES ON keycloak.* TO 'keycloak'@'%';
GRANT ALL PRIVILEGES ON quizdb.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON quizdb.* TO 'quizuser'@'%';
FLUSH PRIVILEGES;

USE quizdb;



CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_polish_ci NOT NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_polish_ci;

CREATE TABLE IF NOT EXISTS quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_polish_ci NOT NULL,
    category_id INT,
    author_id VARCHAR(255),
    author_username VARCHAR(255),
    FOREIGN KEY (category_id) REFERENCES categories(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_polish_ci;

CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_text TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_polish_ci,
    quiz_id INT,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_polish_ci;

CREATE TABLE IF NOT EXISTS options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    option_text TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_polish_ci,
    is_correct BOOLEAN DEFAULT FALSE,
    question_id INT,
    FOREIGN KEY (question_id) REFERENCES questions(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_polish_ci;


INSERT INTO categories (name) VALUES ('Horoscope'), ('Quiz'), ('Poll');

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

-- Nowy quiz
INSERT INTO quizzes (title, category_id) VALUES ('Docker i konteneryzacja', 2); -- quiz_id = 2

-- Pytania
INSERT INTO questions (question_text, quiz_id) VALUES
  ('Czym jest Docker?', 2),
  ('Co to jest obraz (image) Dockera?', 2),
  ('Ktora komenda tworzy kontener?', 2),
  ('Do czego sluzy plik Dockerfile?', 2),
  ('Jak uruchomic kontener w tle?', 2),
  ('Co robi `docker-compose up`?', 2),
  ('Jak sprawdzic aktywne kontenery?', 2),
  ('Co to jest wolumen (volume)?', 2);

-- Opcje
INSERT INTO options (option_text, question_id, is_correct) VALUES
  ('Platforma do konteneryzacji aplikacji', 3, TRUE),
  ('System operacyjny', 3, FALSE),
  ('Edytor tekstu', 3, FALSE),

  ('Zrzut stanu kontenera', 4, FALSE),
  ('Szablon do tworzenia kontenerow', 4, TRUE),
  ('Obiekt w bazie danych', 4, FALSE),

  ('docker build', 5, FALSE),
  ('docker run', 5, TRUE),
  ('docker start', 5, FALSE),

  ('Do opisu sieci', 6, FALSE),
  ('Do konfigurowania kontenerow w YAML', 6, FALSE),
  ('Do definiowania jak zbudowac obraz', 6, TRUE),

  ('docker run -d', 7, TRUE),
  ('docker start -b', 7, FALSE),
  ('docker boot', 7, FALSE),

  ('Uruchamia kontenery na podstawie pliku docker-compose.yml', 8, TRUE),
  ('Tworzy nowy obraz', 8, FALSE),
  ('Restartuje Dockera', 8, FALSE),

  ('docker list', 9, FALSE),
  ('docker ps', 9, TRUE),
  ('docker logs', 9, FALSE),

  ('Trwaly obszar danych wspoldzielony z kontenerem', 10, TRUE),
  ('Typ obrazu Dockera', 10, FALSE),
  ('Proces dzialajacy w tle', 10, FALSE);


INSERT INTO quizzes (title, category_id) VALUES ('Twoj horoskop dzienny', 1); -- quiz_id = 3

INSERT INTO questions (question_text, quiz_id) VALUES
  ('Baran: Dzis energia Cie nie opusci. Czas na dzialanie!', 3),
  ('Byk: Stabilnosc jest dzis Twoim sprzymierzeńcem.', 3),
  ('Bliznieta: Komunikacja bedzie kluczowa.', 3),
  ('Rak: Postaw dzis na bliskich i emocje.', 3),
  ('Lew: Czas blyszczec! Pokaz swoja sile.', 3),
  ('Panna: Uporzadkuj przestrzen wokol siebie.', 3),
  ('Waga: Szukaj balansu w relacjach.', 3),
  ('Skorpion: Tajemnice dzis wychodza na jaw.', 3),
  ('Strzelec: Czas na przygode i odkrywanie.', 3),
  ('Koziorozec: Ambicja dzis Ci sprzyja.', 3),
  ('Wodnik: Zaskocz wszystkich kreatywnoscia.', 3),
  ('Ryby: Intuicja poprowadzi Cie wlasciwie.', 3);

INSERT INTO options (option_text, question_id, is_correct) VALUES
  ('Zobacz swoja wrozbe!', 11, TRUE),
  ('Zobacz swoja wrozbe!', 12, TRUE),
  ('Zobacz swoja wrozbe!', 13, TRUE),
  ('Zobacz swoja wrozbe!', 14, TRUE),
  ('Zobacz swoja wrozbe!', 15, TRUE),
  ('Zobacz swoja wrozbe!', 16, TRUE),
  ('Zobacz swoja wrozbe!', 17, TRUE),
  ('Zobacz swoja wrozbe!', 18, TRUE),
  ('Zobacz swoja wrozbe!', 19, TRUE),
  ('Zobacz swoja wrozbe!', 20, TRUE),
  ('Zobacz swoja wrozbe!', 21, TRUE),
  ('Zobacz swoja wrozbe!', 22, TRUE);



INSERT INTO quizzes (title, category_id) VALUES ('Co bys wolal?', 3); -- quiz_id = 4

INSERT INTO questions (question_text, quiz_id) VALUES
  ('Co bys wolal na uczelni?', 4),
  ('W ktorej sytuacji wolisz byc?', 4),
  ('Jak spedzic idealny dzien?', 4),
  ('Jaka stosujesz rutyne?', 4);

INSERT INTO options (option_text, question_id) VALUES
  ('Zdalne zajecia caly semestr', 23),
  ('Fizycznie, ale tylko 2 dni w tygodniu', 23),

  ('Nie miec projektow, ale same egzaminy', 24),
  ('Nie miec egzaminow, ale duzo projektow', 24),

  ('Spac do 12 i grac w gry', 25),
  ('Wycieczka ze znajomymi i piwo na plazy', 25),

  ('Wstawac rano, isc spac wczesnie (poranny ptaszek) ', 26),
  ('Spac do pozna, zostawac po nocy (nocny marek)', 26);

ALTER TABLE quizzes
ADD COLUMN created_by VARCHAR(255);  
