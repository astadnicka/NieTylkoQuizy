from flask import Flask, jsonify
from flask_cors import CORS
from extensions import mysql  
import config
from routes import register_routes
import time
import os

app = Flask(__name__)
CORS(app, 
     resources={r"/*": {"origins": ["http://localhost:3000", "http://frontend:3000"]}}, 
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

app.config.from_object(config)

app.config['MYSQL_DATABASE_CHARSET'] = 'utf8mb4'
app.config['MYSQL_DATABASE_USE_UNICODE'] = True
app.config['MYSQL_INIT_COMMAND'] = "SET NAMES 'utf8mb4' COLLATE 'utf8mb4_polish_ci'"

max_retries = 30
retry_interval = 2

for attempt in range(max_retries):
    try:
        mysql.init_app(app)
        with app.app_context():
            cursor = mysql.connection.cursor()
            cursor.close()
        print("Połączono z bazą danych MySQL!")
        break
    except Exception as e:
        print(f"Próba {attempt+1}/{max_retries}: Nie udało się połączyć z MySQL: {e}")
        if attempt < max_retries - 1:
            print(f"Ponowna próba za {retry_interval} sekund...")
            time.sleep(retry_interval)
        else:
            print("Osiągnięto maksymalną liczbę prób. Uruchamianie serwera mimo błędu...")

register_routes(app)

@app.route('/health')
def health_check():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute('SELECT 1')
        cursor.close()
        return jsonify(status="healthy"), 200
    except Exception as e:
        return jsonify(status="unhealthy", error=str(e)), 500

if __name__ == '__main__':

    app.run(host='0.0.0.0', port=5001, debug=True)