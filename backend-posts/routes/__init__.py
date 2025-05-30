from .users import users_bp
from .quizzes import quizzes_bp
from .categories import categories_bp

def register_routes(app):
    app.register_blueprint(users_bp, url_prefix='/users')
    app.register_blueprint(quizzes_bp, url_prefix='/quizzes')
    app.register_blueprint(categories_bp, url_prefix='/categories')
