from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route('/api/userinfo')
def userinfo():
    # Tu potem dodamy walidację tokena JWT
    return jsonify({"username": "test_user", "roles": ["user"]})
    

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)
