from flask import Blueprint, jsonify

users_bp = Blueprint('users', __name__)

@users_bp.route('/')
def get_users():
    return jsonify([{"id": 1, "username": "admin"}])
