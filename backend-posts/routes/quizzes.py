from flask import Blueprint

quizzes_bp = Blueprint('quizzes', __name__)

@quizzes_bp.route('/')
def index():
    return "Hello from quizzes!"
