import os
import redis
import jwt
from flask import request, jsonify

REDIS_HOST = os.environ.get('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.environ.get('REDIS_PORT', 6379))
REDIS_DB = int(os.environ.get('REDIS_DB', 0))

redis_client = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)

def is_token_blacklisted(token):
    return redis_client.sismember('blacklist', token)

def get_token_from_header():
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header.split(' ')[1]
    return None

def require_token(fn):
    from functools import wraps
    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = get_token_from_header()
        if not token:
            return jsonify({'error': 'Brak tokenu uwierzytelniającego'}), 401
        if is_token_blacklisted(token):
            return jsonify({'error': 'Token jest zablokowany (wylogowany)'}), 401
        try:
            jwt.decode(token, options={"verify_signature": False})
        except Exception:
            return jsonify({'error': 'Nieprawidłowy token'}), 401
        return fn(*args, **kwargs)
    return wrapper

def get_current_user():
    token = get_token_from_header()
    if not token:
        return None
    try:
        decoded = jwt.decode(token, options={"verify_signature": False})
        return decoded
    except Exception:
        return None

def is_admin_user():
    user = get_current_user()
    if user and 'realm_access' in user and 'roles' in user['realm_access']:
        return 'admin' in user['realm_access']['roles']
    return False
