# -*- coding: utf-8 -*-

from flask import Blueprint, jsonify, request
from extensions import mysql
from flask_cors import cross_origin
import jwt
import os

quizzes_bp = Blueprint('quizzes', __name__)

def is_admin_user():
    """Sprawdza czy użytkownik ma rolę admina na podstawie tokenu JWT"""
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        try:
            decoded = jwt.decode(token, options={"verify_signature": False})
            if 'realm_access' in decoded and 'roles' in decoded['realm_access']:
                return 'admin' in decoded['realm_access']['roles']
        except Exception as e:
            print(f"Błąd dekodowania tokenu: {e}")
    return False

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
    
    quizzes = []
    for row in rows:
        quiz_data = {
            'id': row[0], 
            'title': row[1], 
            'category': row[2],
            'author_username': row[3]
        }
        
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
    
    auth_header = request.headers.get('Authorization')
    user_id = None
    
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        try:
            decoded = jwt.decode(token, options={"verify_signature": False})
            user_id = decoded.get('sub')
        except Exception as e:
            print(f"Błąd dekodowania tokenu: {e}")

    cur.execute("""
        SELECT q.id, q.title, c.name AS category_name, q.author_username, q.created_by
        FROM quizzes q
        JOIN categories c ON q.category_id = c.id
        WHERE q.id = %s
    """, (quiz_id,))
    quiz_row = cur.fetchone()
    if not quiz_row:
        return jsonify({'error': 'Quiz not found'}), 404

    is_author = user_id and quiz_row[4] == user_id

    quiz = {
        'id': quiz_row[0],
        'title': quiz_row[1],
        'category': quiz_row[2],
        'author_username': quiz_row[3],
        'questions': []
    }
    
    if admin_user or is_author:
        quiz['created_by'] = quiz_row[4]

    cur.execute("SELECT id, question_text FROM questions WHERE quiz_id = %s", (quiz_id,))
    questions = cur.fetchall()

    for q in questions:
        question_id = q[0]
        question = {
            'id': question_id,
            'text': q[1],
            'options': []
        }

        cur.execute("""
            SELECT id, option_text, is_correct
            FROM options
            WHERE question_id = %s
        """, (question_id,))
        options = cur.fetchall()

        if admin_user:
            question['options'] = [
                {'id': opt[0], 'text': opt[1], 'is_correct': bool(opt[2])}
                for opt in options
            ]
        else:
            question['options'] = [
                {'id': opt[0], 'text': opt[1]}
                for opt in options
            ]

        quiz['questions'].append(question)

    cur.close()
    return jsonify(quiz)


@quizzes_bp.route('/', methods=['POST', 'OPTIONS'])
@cross_origin()
def create_quiz():
    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Brak danych'}), 400

        if 'title' not in data or 'category_id' not in data or 'questions' not in data:
            return jsonify({'error': 'Brakujące wymagane pola'}), 400

        auth_header = request.headers.get('Authorization')
        user_id = None
        username = None

        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            try:
                decoded = jwt.decode(token, options={"verify_signature": False})
                user_id = decoded.get('sub')
                username = decoded.get('preferred_username')
            except Exception as e:
                print(f"Błąd dekodowania tokenu: {e}")

        cursor = mysql.connection.cursor()
        cursor.execute("SET NAMES utf8mb4 COLLATE utf8mb4_polish_ci;")

        cursor.execute(
            "INSERT INTO quizzes (title, category_id, created_by, author_username) VALUES (%s, %s, %s, %s)",
            (data['title'], data['category_id'], user_id, username)
        )

        quiz_id = cursor.lastrowid

        for question in data['questions']:
            cursor.execute(
                "INSERT INTO questions (question_text, quiz_id) VALUES (%s, %s)",
                (question['question_text'], quiz_id)
            )

            question_id = cursor.lastrowid

            if 'options' in question:
                for option in question['options']:
                    is_correct = option.get('is_correct', False)
                    cursor.execute(
                        "INSERT INTO options (option_text, is_correct, question_id) VALUES (%s, %s, %s)",
                        (option['option_text'], is_correct, question_id)
                    )

        mysql.connection.commit()
        cursor.close()

        return jsonify({
            'success': True,
            'message': 'Quiz został utworzony pomyślnie',
            'quiz_id': quiz_id
        }), 201

    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'error': str(e)}), 500


@quizzes_bp.route('/<int:quiz_id>', methods=['DELETE'])
def delete_quiz(quiz_id):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Nieautoryzowany dostęp'}), 401
    
    token = auth_header.split(' ')[1]
    try:
        decoded = jwt.decode(token, options={"verify_signature": False})
        user_id = decoded.get('sub')
        is_admin = is_admin_user()
    except Exception as e:
        return jsonify({'error': 'Nieprawidłowy token'}), 401
    
    cursor = mysql.connection.cursor()
    
    try:
        cursor.execute("""
            SELECT created_by FROM quizzes WHERE id = %s
        """, (quiz_id,))
        
        result = cursor.fetchone()
        if not result:
            return jsonify({'error': 'Quiz nie został znaleziony'}), 404
        
        quiz_author_id = result[0]
        if not is_admin and user_id != quiz_author_id:
            return jsonify({'error': 'Brak uprawnień do usunięcia tego quizu'}), 403
        
        cursor.execute("""
            DELETE o FROM options o
            JOIN questions q ON o.question_id = q.id
            WHERE q.quiz_id = %s
        """, (quiz_id,))
        
        cursor.execute("DELETE FROM questions WHERE quiz_id = %s", (quiz_id,))
        
        cursor.execute("DELETE FROM quizzes WHERE id = %s", (quiz_id,))
        
        mysql.connection.commit()
        
        return jsonify({
            'success': True,
            'message': 'Quiz został pomyślnie usunięty'
        })
        
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'error': str(e)}), 500
        
    finally:
        cursor.close()

@quizzes_bp.route('/<int:quiz_id>/check', methods=['POST'])
def check_quiz_answers(quiz_id):
    try:
        data = request.get_json()
        
        if not data or 'answers' not in data:
            return jsonify({'error': 'Brak danych odpowiedzi'}), 400
            
        user_answers = {str(ans['questionId']): ans['optionId'] for ans in data['answers']}
    
        cur = mysql.connection.cursor()
        
        cur.execute("SELECT id FROM quizzes WHERE id = %s", (quiz_id,))
        if not cur.fetchone():
            return jsonify({'error': 'Quiz nie został znaleziony'}), 404
            
        cur.execute("SELECT id FROM questions WHERE quiz_id = %s", (quiz_id,))
        question_ids = [str(row[0]) for row in cur.fetchall()]
        
        correct_answers = {}
        details = []
        
        for question_id in question_ids:
            cur.execute("""
                SELECT id, is_correct 
                FROM options 
                WHERE question_id = %s
            """, (question_id,))
            options = cur.fetchall()
            
            correct_option_id = None
            for opt_id, is_correct in options:
                if is_correct:
                    correct_option_id = opt_id
                    break
                    
            correct_answers[question_id] = correct_option_id
            
            user_option_id = user_answers.get(question_id)
            is_correct = user_option_id == correct_option_id
            
            details.append({
                'questionId': int(question_id),
                'userOptionId': user_option_id,
                'correctOptionId': correct_option_id,
                'isCorrect': is_correct
            })
        
        correct_count = sum(1 for detail in details if detail['isCorrect'])
        
        cur.close()
        
        return jsonify({
            'quizId': quiz_id,
            'totalQuestions': len(question_ids),
            'correctAnswers': correct_count,
            'details': details
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
