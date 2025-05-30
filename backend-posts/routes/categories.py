from flask import Blueprint

categories_bp = Blueprint('categories', __name__)

@categories_bp.route('/')
def index():
    return "Hello from categories!"
