from flask import Blueprint, request, jsonify, g
from auth_utils import login_required, get_db

contacts_bp = Blueprint('contacts', __name__)

MAX_CONTACTS = 5


@contacts_bp.route('/', methods=['GET'])
@login_required
def list_contacts():
    db = get_db()
    rows = db.execute(
        "SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY created_at",
        (g.user_id,)
    ).fetchall()
    return jsonify({"contacts": [_serialize(r) for r in rows]})


@contacts_bp.route('/', methods=['POST'])
@login_required
def add_contact():
    data     = request.get_json(silent=True) or {}
    name     = data.get('name', '').strip()
    phone    = data.get('phone', '').strip()
    relation = data.get('relation', '').strip()

    if not name or not phone:
        return jsonify({"error": "name and phone are required"}), 400

    db = get_db()
    count = db.execute(
        "SELECT COUNT(*) FROM emergency_contacts WHERE user_id = ?",
        (g.user_id,)
    ).fetchone()[0]

    if count >= MAX_CONTACTS:
        return jsonify({"error": f"Maximum {MAX_CONTACTS} emergency contacts allowed"}), 400

    db.execute(
        "INSERT INTO emergency_contacts (user_id, name, phone, relation) VALUES (?, ?, ?, ?)",
        (g.user_id, name, phone, relation or None)
    )
    db.commit()

    row = db.execute(
        "SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY id DESC LIMIT 1",
        (g.user_id,)
    ).fetchone()
    return jsonify({"message": "Contact added", "contact": _serialize(row)}), 201


@contacts_bp.route('/<int:contact_id>', methods=['GET'])
@login_required
def get_contact(contact_id):
    db  = get_db()
    row = db.execute(
        "SELECT * FROM emergency_contacts WHERE id = ? AND user_id = ?",
        (contact_id, g.user_id)
    ).fetchone()
    if not row:
        return jsonify({"error": "Contact not found"}), 404
    return jsonify({"contact": _serialize(row)})


@contacts_bp.route('/<int:contact_id>', methods=['PUT'])
@login_required
def update_contact(contact_id):
    db  = get_db()
    row = db.execute(
        "SELECT * FROM emergency_contacts WHERE id = ? AND user_id = ?",
        (contact_id, g.user_id)
    ).fetchone()
    if not row:
        return jsonify({"error": "Contact not found"}), 404

    data     = request.get_json(silent=True) or {}
    name     = data.get('name', row['name'])
    phone    = data.get('phone', row['phone'])
    relation = data.get('relation', row['relation'])

    db.execute(
        "UPDATE emergency_contacts SET name = ?, phone = ?, relation = ? WHERE id = ?",
        (name, phone, relation, contact_id)
    )
    db.commit()
    row = db.execute("SELECT * FROM emergency_contacts WHERE id = ?", (contact_id,)).fetchone()
    return jsonify({"message": "Contact updated", "contact": _serialize(row)})


@contacts_bp.route('/<int:contact_id>', methods=['DELETE'])
@login_required
def delete_contact(contact_id):
    db  = get_db()
    row = db.execute(
        "SELECT id FROM emergency_contacts WHERE id = ? AND user_id = ?",
        (contact_id, g.user_id)
    ).fetchone()
    if not row:
        return jsonify({"error": "Contact not found"}), 404

    db.execute("DELETE FROM emergency_contacts WHERE id = ?", (contact_id,))
    db.commit()
    return jsonify({"message": "Contact deleted"})


# ── helpers ──────────────────────────────────────────────────────────────────

def _serialize(row) -> dict:
    return {
        "id":         row['id'],
        "user_id":    row['user_id'],
        "name":       row['name'],
        "phone":      row['phone'],
        "relation":   row['relation'],
        "created_at": row['created_at']
    }
