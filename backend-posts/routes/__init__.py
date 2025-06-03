from .quizzes import quizzes_bp

def register_routes(app):
    app.register_blueprint(quizzes_bp, url_prefix='/quizzes')
    # app.register_blueprint(main_bp)  
