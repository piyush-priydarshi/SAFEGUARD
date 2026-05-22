from flask import Blueprint, request, jsonify, g
from auth_utils import hash_password, generate_token, revoke_token, login_required, get_db

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    name  = data.get('name', '').strip()
    phone = data.get('phone', '').strip()
    email = data.get('email', '').strip() or None
    password = data.get('password', '')

    if not name or not phone or not password:
        return jsonify({"error": "name, phone, and password are required"}), 400

    db = get_db()
    try:
        db.execute(
            "INSERT INTO users (name, phone, email, password) VALUES (?, ?, ?, ?)",
            (name, phone, email, hash_password(password))
        )
        db.commit()
    except Exception as e:
        if 'UNIQUE' in str(e):
            return jsonify({"error": "Phone or email already registered"}), 409
        return jsonify({"error": str(e)}), 500

    user = db.execute("SELECT * FROM users WHERE phone = ?", (phone,)).fetchone()
    token = generate_token(user['id'])
    return jsonify({
        "message": "Registration successful",
        "token": token,
        "user": _serialize_user(user)
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    phone    = data.get('phone', '').strip()
    password = data.get('password', '')

    if not phone or not password:
        return jsonify({"error": "phone and password are required"}), 400

    db   = get_db()
    user = db.execute("SELECT * FROM users WHERE phone = ?", (phone,)).fetchone()

    if not user or user['password'] != hash_password(password):
        return jsonify({"error": "Invalid phone or password"}), 401

    token = generate_token(user['id'])
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": _serialize_user(user)
    })


@auth_bp.route('/profile', methods=['GET'])
@login_required
def profile():
    db   = get_db()
    user = db.execute("SELECT * FROM users WHERE id = ?", (g.user_id,)).fetchone()
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": _serialize_user(user)})


@auth_bp.route('/profile', methods=['PUT'])
@login_required
def update_profile():
    data  = request.get_json(silent=True) or {}
    name  = data.get('name')
    email = data.get('email')

    db = get_db()
    if name:
        db.execute("UPDATE users SET name = ? WHERE id = ?", (name, g.user_id))
    if email:
        db.execute("UPDATE users SET email = ? WHERE id = ?", (email, g.user_id))
    db.commit()

    user = db.execute("SELECT * FROM users WHERE id = ?", (g.user_id,)).fetchone()
    return jsonify({"message": "Profile updated", "user": _serialize_user(user)})


@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    token = request.headers['Authorization'].split(' ', 1)[1]
    revoke_token(token)
    return jsonify({"message": "Logged out successfully"})


# ── helpers ──────────────────────────────────────────────────────────────────

def _serialize_user(row) -> dict:
    return {
        "id":         row['id'],
        "name":       row['name'],
        "phone":      row['phone'],
        "email":      row['email'],
        "created_at": row['created_at']
    }
