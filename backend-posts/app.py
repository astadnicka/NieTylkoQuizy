from flask import Flask
from flask_cors import CORS
from extensions import mysql  
import config
from routes import register_routes

app = Flask(__name__)
# CORS(app)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

app.config.from_object(config)

mysql.init_app(app)  

register_routes(app)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
