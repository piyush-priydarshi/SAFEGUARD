from flask import Blueprint, request, jsonify, g
from auth_utils import login_required, get_db

location_bp = Blueprint('location', __name__)

HISTORY_LIMIT = 100   # max stored points per user


@location_bp.route('/update', methods=['POST'])
@login_required
def update_location():
    """Record a new GPS location for the user."""
    data      = request.get_json(silent=True) or {}
    latitude  = data.get('latitude')
    longitude = data.get('longitude')
    accuracy  = data.get('accuracy')

    if latitude is None or longitude is None:
        return jsonify({"error": "latitude and longitude are required"}), 400

    try:
        latitude  = float(latitude)
        longitude = float(longitude)
    except (TypeError, ValueError):
        return jsonify({"error": "latitude and longitude must be numeric"}), 400

    if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
        return jsonify({"error": "Invalid coordinate values"}), 400

    db = get_db()
    db.execute(
        "INSERT INTO location_history (user_id, latitude, longitude, accuracy) VALUES (?, ?, ?, ?)",
        (g.user_id, latitude, longitude, accuracy)
    )

    # Rolling window — keep only the most recent HISTORY_LIMIT records
    db.execute("""
        DELETE FROM location_history
        WHERE user_id = ? AND id NOT IN (
            SELECT id FROM location_history
            WHERE user_id = ?
            ORDER BY recorded_at DESC
            LIMIT ?
        )
    """, (g.user_id, g.user_id, HISTORY_LIMIT))
    db.commit()

    row = db.execute(
        "SELECT * FROM location_history WHERE user_id = ? ORDER BY id DESC LIMIT 1",
        (g.user_id,)
    ).fetchone()
    return jsonify({"message": "Location updated", "location": _serialize(row)}), 201


@location_bp.route('/current', methods=['GET'])
@login_required
def current_location():
    """Return the user's most recent known location."""
    db  = get_db()
    row = db.execute(
        "SELECT * FROM location_history WHERE user_id = ? ORDER BY recorded_at DESC LIMIT 1",
        (g.user_id,)
    ).fetchone()
    if not row:
        return jsonify({"error": "No location data available"}), 404
    return jsonify({"location": _serialize(row)})


@location_bp.route('/history', methods=['GET'])
@login_required
def location_history():
    """Return recent location history (newest first)."""
    limit = min(int(request.args.get('limit', 20)), HISTORY_LIMIT)
    db    = get_db()
    rows  = db.execute(
        "SELECT * FROM location_history WHERE user_id = ? ORDER BY recorded_at DESC LIMIT ?",
        (g.user_id, limit)
    ).fetchall()
    return jsonify({
        "history": [_serialize(r) for r in rows],
        "count":   len(rows)
    })


@location_bp.route('/history', methods=['DELETE'])
@login_required
def clear_history():
    """Delete all stored location history for the user."""
    db = get_db()
    db.execute("DELETE FROM location_history WHERE user_id = ?", (g.user_id,))
    db.commit()
    return jsonify({"message": "Location history cleared"})


# ── helpers ──────────────────────────────────────────────────────────────────

def _serialize(row) -> dict:
    return {
        "id":          row['id'],
        "user_id":     row['user_id'],
        "latitude":    row['latitude'],
        "longitude":   row['longitude'],
        "accuracy":    row['accuracy'],
        "recorded_at": row['recorded_at']
    }
