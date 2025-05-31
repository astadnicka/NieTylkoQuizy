-- Ustawienie domyślnego kodowania dla bazy (jeśli tworzysz ją ręcznie):
CREATE DATABASE IF NOT EXISTS twoja_baza
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_polish_ci;

-- Przykład z kategoriami:
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_polish_ci NOT NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_polish_ci;

-- Tak samo dla reszty:
CREATE TABLE IF NOT EXISTS quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_polish_ci NOT NULL,
    category_id INT,
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
  ('Która komenda tworzy kontener?', 2),
  ('Do czego służy plik Dockerfile?', 2),
  ('Jak uruchomić kontener w tle?', 2),
  ('Co robi `docker-compose up`?', 2),
  ('Jak sprawdzić aktywne kontenery?', 2),
  ('Co to jest wolumen (volume)?', 2);

-- Opcje
INSERT INTO options (option_text, question_id, is_correct) VALUES
  ('Platforma do konteneryzacji aplikacji', 3, TRUE),
  ('System operacyjny', 3, FALSE),
  ('Edytor tekstu', 3, FALSE),

  ('Zrzut stanu kontenera', 4, FALSE),
  ('Szablon do tworzenia kontenerów', 4, TRUE),
  ('Obiekt w bazie danych', 4, FALSE),

  ('docker build', 5, FALSE),
  ('docker run', 5, TRUE),
  ('docker start', 5, FALSE),

  ('Do opisu sieci', 6, FALSE),
  ('Do konfigurowania kontenerów w YAML', 6, FALSE),
  ('Do definiowania jak zbudować obraz', 6, TRUE),

  ('docker run -d', 7, TRUE),
  ('docker start -b', 7, FALSE),
  ('docker boot', 7, FALSE),

  ('Uruchamia kontenery na podstawie pliku docker-compose.yml', 8, TRUE),
  ('Tworzy nowy obraz', 8, FALSE),
  ('Restartuje Dockera', 8, FALSE),

  ('docker list', 9, FALSE),
  ('docker ps', 9, TRUE),
  ('docker logs', 9, FALSE),

  ('Trwały obszar danych współdzielony z kontenerem', 10, TRUE),
  ('Typ obrazu Dockera', 10, FALSE),
  ('Proces działający w tle', 10, FALSE);


-- Quiz horoskopowy
INSERT INTO quizzes (title, category_id) VALUES ('Twój horoskop dzienny', 1); -- quiz_id = 3

-- Pytania i opcje horoskopowe
INSERT INTO questions (question_text, quiz_id) VALUES
  ('Baran: Dziś energia Cię nie opuści. Czas na działanie!', 3),
  ('Byk: Stabilność jest dziś Twoim sprzymierzeńcem.', 3),
  ('Bliźnięta: Komunikacja będzie kluczowa.', 3),
  ('Rak: Postaw dziś na bliskich i emocje.', 3),
  ('Lew: Czas błyszczeć! Pokaż swoją siłę.', 3),
  ('Panna: Uporządkuj przestrzeń wokół siebie.', 3),
  ('Waga: Szukaj balansu w relacjach.', 3),
  ('Skorpion: Tajemnice dziś wychodzą na jaw.', 3),
  ('Strzelec: Czas na przygodę i odkrywanie.', 3),
  ('Koziorozec: Ambicja dziś Ci sprzyja.', 3),
  ('Wodnik: Zaskocz wszystkich kreatywnością.', 3),
  ('Ryby: Intuicja poprowadzi Cię właściwie.', 3);

-- Opcje (jedna „dummy” opcja per znak – tylko do wyświetlenia)
INSERT INTO options (option_text, question_id, is_correct) VALUES
  ('Zobacz swoją wróżbę!', 11, TRUE),
  ('Zobacz swoją wróżbę!', 12, TRUE),
  ('Zobacz swoją wróżbę!', 13, TRUE),
  ('Zobacz swoją wróżbę!', 14, TRUE),
  ('Zobacz swoją wróżbę!', 15, TRUE),
  ('Zobacz swoją wróżbę!', 16, TRUE),
  ('Zobacz swoją wróżbę!', 17, TRUE),
  ('Zobacz swoją wróżbę!', 18, TRUE),
  ('Zobacz swoją wróżbę!', 19, TRUE),
  ('Zobacz swoją wróżbę!', 20, TRUE),
  ('Zobacz swoją wróżbę!', 21, TRUE),
  ('Zobacz swoją wróżbę!', 22, TRUE);



-- Głosowanie
INSERT INTO quizzes (title, category_id) VALUES ('Co byś wolał?', 3); -- quiz_id = 4

-- Pytanie
INSERT INTO questions (question_text, quiz_id) VALUES
  ('Co byś wolał na uczelni?', 4),
  ('W której sytuacji wolisz być?', 4),
  ('Jak spędzić idealny dzień?', 4),
  ('Jaką stosujesz rutynę?', 4);

-- Opcje (pytanie_id = 23, 24, 25)
INSERT INTO options (option_text, question_id) VALUES
  ('Zdalne zajęcia cały semestr', 23),
  ('Fizycznie, ale tylko 2 dni w tygodniu', 23),

  ('Nie mieć projektó, ale same egzaminy', 24),
  ('Nie mieć egzaminów, ale dużo projektów', 24),

  ('Spać do 12 i grać w gry', 25),
  ('Wycieczka ze znajomymi i piwo na plaży', 25),

  ('Wstawać rano, iść spać wcześnie (poranny ptaszek) ', 26),
  ('Spać do późna, zostawać po nocy (nocny marek)', 26);
