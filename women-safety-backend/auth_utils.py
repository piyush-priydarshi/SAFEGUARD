import hashlib
import secrets
import sqlite3
from functools import wraps
from flask import request, jsonify, current_app, g

# In-memory token store  {token: user_id}
# For production, use Redis or a DB-backed session store.
_token_store: dict[str, int] = {}


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def generate_token(user_id: int) -> str:
    token = secrets.token_hex(32)
    _token_store[token] = user_id
    return token


def revoke_token(token: str) -> None:
    _token_store.pop(token, None)


def get_user_id_from_token(token: str):
    return _token_store.get(token)


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        token = auth_header.split(' ', 1)[1]
        user_id = get_user_id_from_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401

        # Attach user_id to Flask's g for use in route handlers
        g.user_id = user_id
        return f(*args, **kwargs)
    return decorated


def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(
            current_app.config['DATABASE'],
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row
    return g.db
