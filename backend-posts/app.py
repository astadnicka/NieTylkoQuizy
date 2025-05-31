from flask import Flask
from flask_cors import CORS
from extensions import mysql  
import config
from routes import register_routes

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

app.config.from_object(config)

app.config['MYSQL_DATABASE_CHARSET'] = 'utf8mb4'
app.config['MYSQL_DATABASE_USE_UNICODE'] = True
app.config['MYSQL_INIT_COMMAND'] = "SET NAMES 'utf8mb4' COLLATE 'utf8mb4_polish_ci'"

mysql.init_app(app)

with app.app_context():
    cursor = mysql.connection.cursor()
    cursor.close()

register_routes(app)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
