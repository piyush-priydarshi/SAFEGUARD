from flask import Blueprint, request, jsonify, g
from auth_utils import login_required, get_db

alerts_bp = Blueprint('alerts', __name__)


@alerts_bp.route('/', methods=['GET'])
@login_required
def list_alerts():
    """List all alerts sent for the current user's SOS events."""
    db   = get_db()
    rows = db.execute("""
        SELECT a.*, s.triggered_at AS sos_triggered_at
        FROM   alerts a
        JOIN   sos_events s ON a.sos_event_id = s.id
        WHERE  a.user_id = ?
        ORDER  BY a.sent_at DESC
    """, (g.user_id,)).fetchall()
    return jsonify({"alerts": [_serialize(r) for r in rows]})


@alerts_bp.route('/<int:alert_id>', methods=['GET'])
@login_required
def get_alert(alert_id):
    db  = get_db()
    row = db.execute(
        "SELECT * FROM alerts WHERE id = ? AND user_id = ?",
        (alert_id, g.user_id)
    ).fetchone()
    if not row:
        return jsonify({"error": "Alert not found"}), 404
    return jsonify({"alert": _serialize(row)})


@alerts_bp.route('/<int:alert_id>/acknowledge', methods=['POST'])
@login_required
def acknowledge_alert(alert_id):
    """Simulate a contact acknowledging the alert."""
    db  = get_db()
    row = db.execute(
        "SELECT * FROM alerts WHERE id = ? AND user_id = ?",
        (alert_id, g.user_id)
    ).fetchone()
    if not row:
        return jsonify({"error": "Alert not found"}), 404
    if row['status'] == 'acknowledged':
        return jsonify({"message": "Already acknowledged", "alert": _serialize(row)})

    db.execute("""
        UPDATE alerts
        SET    status = 'acknowledged', acknowledged_at = datetime('now')
        WHERE  id = ?
    """, (alert_id,))
    db.commit()
    row = db.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,)).fetchone()
    return jsonify({"message": "Alert acknowledged", "alert": _serialize(row)})


@alerts_bp.route('/sos/<int:sos_id>', methods=['GET'])
@login_required
def alerts_for_sos(sos_id):
    """Get all alerts dispatched for a specific SOS event."""
    db   = get_db()
    rows = db.execute(
        "SELECT * FROM alerts WHERE sos_event_id = ? AND user_id = ? ORDER BY sent_at",
        (sos_id, g.user_id)
    ).fetchall()
    return jsonify({"sos_id": sos_id, "alerts": [_serialize(r) for r in rows]})


# ── helpers ──────────────────────────────────────────────────────────────────

def _serialize(row) -> dict:
    return {
        "id":               row['id'],
        "sos_event_id":     row['sos_event_id'],
        "user_id":          row['user_id'],
        "contact_id":       row['contact_id'],
        "contact_phone":    row['contact_phone'],
        "message":          row['message'],
        "status":           row['status'],
        "sent_at":          row['sent_at'],
        "acknowledged_at":  row['acknowledged_at']
    }
