import requests
from flask import Blueprint, request, jsonify, g
from auth_utils import login_required, get_db
from alert_service import send_sos_alerts
from datetime import datetime

sos_bp = Blueprint('sos', __name__)


# 🔥 TELEGRAM FUNCTION
def send_telegram_alert(message):
    token = "8125973498:AAG6BkXEjAWjwaSEvO-XzdaolJmMtny-MZA"
    chat_id = "1895703688"

    url = f"https://api.telegram.org/bot{token}/sendMessage"

    requests.post(url, json={
        "chat_id": chat_id,
        "text": message
    })


@sos_bp.route('/trigger', methods=['POST'])
@login_required
def trigger_sos():
    """Trigger an SOS alert with optional GPS coordinates."""
    data      = request.get_json(silent=True) or {}
    latitude  = data.get('latitude')
    longitude = data.get('longitude')
    address   = data.get('address', '').strip() or None

    db = get_db()

    # Check for already-active SOS
    active = db.execute(
        "SELECT id FROM sos_events WHERE user_id = ? AND status = 'active'",
        (g.user_id,)
    ).fetchone()

    if active:
        return jsonify({
            "error": "An active SOS is already in progress",
            "sos_id": active['id']
        }), 409

    db.execute(
        "INSERT INTO sos_events (user_id, latitude, longitude, address) VALUES (?, ?, ?, ?)",
        (g.user_id, latitude, longitude, address)
    )
    db.commit()

    sos = db.execute(
        "SELECT * FROM sos_events WHERE user_id = ? ORDER BY id DESC LIMIT 1",
        (g.user_id,)
    ).fetchone()

    # Fire mock alerts
    alerts_sent = send_sos_alerts(db, g.user_id, sos['id'], latitude, longitude, address)

    # 🔥 FETCH USER DETAILS
    user = db.execute(
        "SELECT name, phone FROM users WHERE id = ?",
        (g.user_id,)
    ).fetchone()

    name = user['name'] if user and user['name'] else "Unknown"
    phone = user['phone'] if user and user['phone'] else "N/A"

    # 🔥 SAFE LOCATION
    lat = latitude if latitude else "12.9667"
    lng = longitude if longitude else "77.7104"

    # 🔥 TIME FORMAT
    time_now = datetime.now().strftime("%d %b %Y, %I:%M %p")

    # 🔥 TELEGRAM ALERT (IMPROVED)
    send_telegram_alert(
        f"""🚨 EMERGENCY ALERT 🚨

👤 Name: {name}
📞 Phone: {phone}
🆔 User ID: {g.user_id}

📍 Location:
https://maps.google.com/?q={lat},{lng}

🕒 Time: {time_now}
⚠ Status: SOS ACTIVE
"""
    )

    db.commit()

    return jsonify({
        "message": "SOS triggered successfully",
        "sos":     _serialize_sos(sos),
        "alerts_dispatched": alerts_sent
    }), 201


@sos_bp.route('/cancel', methods=['POST'])
@login_required
def cancel_sos():
    db = get_db()

    sos = db.execute(
        "SELECT * FROM sos_events WHERE user_id = ? AND status = 'active'",
        (g.user_id,)
    ).fetchone()

    if not sos:
        return jsonify({"error": "No active SOS found"}), 404

    db.execute(
        "UPDATE sos_events SET status = 'cancelled', resolved_at = datetime('now') WHERE id = ?",
        (sos['id'],)
    )
    db.commit()

    sos = db.execute(
        "SELECT * FROM sos_events WHERE id = ?",
        (sos['id'],)
    ).fetchone()

    return jsonify({"message": "SOS cancelled", "sos": _serialize_sos(sos)})


@sos_bp.route('/resolve/<int:sos_id>', methods=['POST'])
@login_required
def resolve_sos(sos_id):
    db = get_db()

    sos = db.execute(
        "SELECT * FROM sos_events WHERE id = ? AND user_id = ?",
        (sos_id, g.user_id)
    ).fetchone()

    if not sos:
        return jsonify({"error": "SOS not found"}), 404

    if sos['status'] != 'active':
        return jsonify({"error": f"SOS is already '{sos['status']}'"}), 400

    db.execute(
        "UPDATE sos_events SET status = 'resolved', resolved_at = datetime('now') WHERE id = ?",
        (sos_id,)
    )
    db.commit()

    sos = db.execute(
        "SELECT * FROM sos_events WHERE id = ?",
        (sos_id,)
    ).fetchone()

    return jsonify({"message": "SOS resolved", "sos": _serialize_sos(sos)})


@sos_bp.route('/history', methods=['GET'])
@login_required
def sos_history():
    db = get_db()

    rows = db.execute(
        "SELECT * FROM sos_events WHERE user_id = ? ORDER BY triggered_at DESC",
        (g.user_id,)
    ).fetchall()

    return jsonify({"history": [_serialize_sos(r) for r in rows]})


@sos_bp.route('/active', methods=['GET'])
@login_required
def active_sos():
    db = get_db()

    sos = db.execute(
        "SELECT * FROM sos_events WHERE user_id = ? AND status = 'active'",
        (g.user_id,)
    ).fetchone()

    if not sos:
        return jsonify({"active": False, "sos": None})

    return jsonify({"active": True, "sos": _serialize_sos(sos)})


def _serialize_sos(row):
    return {
        "id":           row['id'],
        "user_id":      row['user_id'],
        "latitude":     row['latitude'],
        "longitude":    row['longitude'],
        "address":      row['address'],
        "status":       row['status'],
        "triggered_at": row['triggered_at'],
        "resolved_at":  row['resolved_at']
    }