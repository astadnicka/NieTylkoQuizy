from flask import Flask
# from flask_mysqldb import MySQL
from flask_cors import CORS
from routes import register_routes
from flask_mysqldb import MySQL


app = Flask(__name__)
CORS(app)

import config
app.config.from_object(config)

mysql = MySQL(app)

# from routes.users import users_bp
# from routes.quizzes import quizzes_bp
# from routes.categories import categories_bp

# app.register_blueprint(users_bp, url_prefix='/users')
# app.register_blueprint(quizzes_bp, url_prefix='/quizzes')
# app.register_blueprint(categories_bp, url_prefix='/categories')
register_routes(app)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
