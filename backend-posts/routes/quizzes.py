# -*- coding: utf-8 -*-

from flask import Blueprint, jsonify, request
from extensions import mysql
from flask_cors import cross_origin

quizzes_bp = Blueprint('quizzes', __name__)

# Endpoint do pobierania quizów (GET)
@quizzes_bp.route('/', methods=['GET'])
def get_quizzes():
    cursor = mysql.connection.cursor()
    cursor.execute("SET NAMES utf8mb4 COLLATE utf8mb4_polish_ci;")
    
    limit = request.args.get('limit', default=None, type=int)

    if limit:
        cursor.execute("""
            SELECT q.id, q.title, c.name AS category
            FROM quizzes q
            JOIN categories c ON q.category_id = c.id
            ORDER BY q.id DESC
            LIMIT %s
        """, (limit,))
    else:
        cursor.execute("""
            SELECT q.id, q.title, c.name AS category
            FROM quizzes q
            JOIN categories c ON q.category_id = c.id
            ORDER BY q.id DESC
        """)

    rows = cursor.fetchall()
    quizzes = [{'id': row[0], 'title': row[1], 'category': row[2]} for row in rows]
    cursor.close()
    return jsonify(quizzes)


@quizzes_bp.route('/<int:quiz_id>')
def get_quiz_by_id(quiz_id):
    cur = mysql.connection.cursor()
    cur.execute("SET NAMES utf8mb4 COLLATE utf8mb4_polish_ci;")


    # Pobierz quiz z nazwą kategorii
    cur.execute("""
        SELECT q.id, q.title, c.name AS category_name
        FROM quizzes q
        JOIN categories c ON q.category_id = c.id
        WHERE q.id = %s
    """, (quiz_id,))
    quiz_row = cur.fetchone()
    if not quiz_row:
        return jsonify({'error': 'Quiz not found'}), 404

    quiz = {
        'id': quiz_row[0],
        'title': quiz_row[1],
        'category': quiz_row[2],
        'questions': []
    }

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

        # Pobierz opcje (z is_correct, tylko jeśli to quiz)
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

