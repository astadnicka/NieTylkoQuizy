# -*- coding: utf-8 -*-

from flask import Blueprint, jsonify, request
from extensions import mysql
from flask_cors import cross_origin
import jwt
import os

quizzes_bp = Blueprint('quizzes', __name__)

# Funkcja pomocnicza do sprawdzania roli admina
def is_admin_user():
    """Sprawdza czy użytkownik ma rolę admina na podstawie tokenu JWT"""
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        try:
            # Dekoduj token bez weryfikacji (tylko do odczytu informacji)
            decoded = jwt.decode(token, options={"verify_signature": False})
            # Sprawdź czy użytkownik ma rolę admin
            if 'realm_access' in decoded and 'roles' in decoded['realm_access']:
                return 'admin' in decoded['realm_access']['roles']
        except Exception as e:
            print(f"Błąd dekodowania tokenu: {e}")
    return False

# Endpoint do pobierania quizów (GET)
@quizzes_bp.route('/', methods=['GET'])
def get_quizzes():
    cursor = mysql.connection.cursor()
    cursor.execute("SET NAMES utf8mb4 COLLATE utf8mb4_polish_ci;")

    limit = request.args.get('limit', default=None, type=int)
    admin_user = is_admin_user()

    if limit:
        cursor.execute("""
            SELECT q.id, q.title, c.name AS category, q.author_username, q.created_by
            FROM quizzes q
            JOIN categories c ON q.category_id = c.id
            ORDER BY q.id DESC
            LIMIT %s
        """, (limit,))
    else:
        cursor.execute("""
            SELECT q.id, q.title, c.name AS category, q.author_username, q.created_by
            FROM quizzes q
            JOIN categories c ON q.category_id = c.id
            ORDER BY q.id DESC
        """)

    rows = cursor.fetchall()
    
    # Tworzenie różnych odpowiedzi w zależności od roli
    quizzes = []
    for row in rows:
        quiz_data = {
            'id': row[0], 
            'title': row[1], 
            'category': row[2],
            'author_username': row[3]
        }
        
        # Dodaj created_by tylko dla admina
        if admin_user:
            quiz_data['created_by'] = row[4]
            
        quizzes.append(quiz_data)
    
    cursor.close()
    return jsonify(quizzes)


@quizzes_bp.route('/<int:quiz_id>')
def get_quiz_by_id(quiz_id):
    cur = mysql.connection.cursor()
    cur.execute("SET NAMES utf8mb4 COLLATE utf8mb4_polish_ci;")
    admin_user = is_admin_user()

    # Pobierz quiz z nazwą kategorii
    cur.execute("""
        SELECT q.id, q.title, c.name AS category_name, q.author_username, q.created_by
        FROM quizzes q
        JOIN categories c ON q.category_id = c.id
        WHERE q.id = %s
    """, (quiz_id,))
    quiz_row = cur.fetchone()
    if not quiz_row:
        return jsonify({'error': 'Quiz not found'}), 404

    # Tworzenie obiektu quizu
    quiz = {
        'id': quiz_row[0],
        'title': quiz_row[1],
        'category': quiz_row[2],
        'author_username': quiz_row[3],
        'questions': []
    }
    
    # Dodaj created_by tylko dla admina
    if admin_user:
        quiz['created_by'] = quiz_row[4]

    # Pobierz pytania
    cur.execute("SELECT id, question_text FROM questions WHERE quiz_id = %s", (quiz_id,))
    questions = cur.fetchall()

    for q in questions:
        question_id = q[0]
        question = {
            'id': question_id,
            'text': q[1],
            'options': []
        }

        # Pobierz opcje (z is_correct zawsze, żeby nie zepsuć działania quizu)
        cur.execute("""
            SELECT id, option_text, is_correct
            FROM options
            WHERE question_id = %s
        """, (question_id,))
        options = cur.fetchall()

        question['options'] = [
            {'id': opt[0], 'text': opt[1], 'is_correct': bool(opt[2])}
            for opt in options
        ]

        quiz['questions'].append(question)

    cur.close()
    return jsonify(quiz)


# Endpoint do tworzenia quizów (POST) - bez zmian
@quizzes_bp.route('/', methods=['POST', 'OPTIONS'])
@cross_origin()
def create_quiz():
    # Jawna obsługa żądania OPTIONS
    if request.method == 'OPTIONS':
        return '', 200

    try:
        # Pobierz dane z żądania
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Brak danych'}), 400

        # Sprawdź wymagane pola
        if 'title' not in data or 'category_id' not in data or 'questions' not in data:
            return jsonify({'error': 'Brakujące wymagane pola'}), 400

        # Pobierz dane użytkownika z tokenu JWT
        auth_header = request.headers.get('Authorization')
        user_id = None
        username = None

        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            try:
                # Dekoduj token bez weryfikacji (tylko do odczytu informacji)
                decoded = jwt.decode(token, options={"verify_signature": False})
                user_id = decoded.get('sub')
                username = decoded.get('preferred_username')
            except Exception as e:
                print(f"Błąd dekodowania tokenu: {e}")

        # Rozpocznij transakcję
        cursor = mysql.connection.cursor()
        cursor.execute("SET NAMES utf8mb4 COLLATE utf8mb4_polish_ci;")

        # Wstaw quiz
        cursor.execute(
            "INSERT INTO quizzes (title, category_id, created_by, author_username) VALUES (%s, %s, %s, %s)",
            (data['title'], data['category_id'], user_id, username)
        )

        # Pobierz ID nowo utworzonego quizu
        quiz_id = cursor.lastrowid

        # Wstaw pytania i opcje
        for question in data['questions']:
            cursor.execute(
                "INSERT INTO questions (question_text, quiz_id) VALUES (%s, %s)",
                (question['question_text'], quiz_id)
            )

            question_id = cursor.lastrowid

            # Wstaw opcje jeśli istnieją
            if 'options' in question:
                for option in question['options']:
                    is_correct = option.get('is_correct', False)
                    cursor.execute(
                        "INSERT INTO options (option_text, is_correct, question_id) VALUES (%s, %s, %s)",
                        (option['option_text'], is_correct, question_id)
                    )

        # Zatwierdź transakcję
        mysql.connection.commit()
        cursor.close()

        return jsonify({
            'success': True,
            'message': 'Quiz został utworzony pomyślnie',
            'quiz_id': quiz_id
        }), 201

    except Exception as e:
        # W przypadku błędu, wycofaj transakcję
        mysql.connection.rollback()
        return jsonify({'error': str(e)}), 500
