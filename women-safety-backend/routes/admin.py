from flask import Blueprint, jsonify, current_app
from database import get_db
from auth_utils import login_required
from flask import g

ADMIN_PHONE = "9667938325"

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/dashboard', methods=['GET'])
@login_required
def get_dashboard():
    try:
        db = get_db(current_app)
        
        # Check if user is admin
        user = db.execute("SELECT phone FROM users WHERE id = ?", (g.user_id,)).fetchone()
        if not user or user['phone'] != ADMIN_PHONE:
            return jsonify({'error': 'Unauthorized: Admin access denied'}), 403
        
        # Get users
        users_cur = db.execute('SELECT id, name, phone, email, created_at FROM users ORDER BY created_at DESC')
        users = [dict(row) for row in users_cur.fetchall()]
        
        # Get contacts
        contacts_cur = db.execute('SELECT id, user_id, name, phone, relation, created_at FROM emergency_contacts ORDER BY created_at DESC')
        contacts = [dict(row) for row in contacts_cur.fetchall()]
        
        # Get SOS events
        sos_cur = db.execute('SELECT id, user_id, latitude, longitude, address, status, triggered_at, resolved_at FROM sos_events ORDER BY triggered_at DESC')
        sos_events = [dict(row) for row in sos_cur.fetchall()]
        
        return jsonify({
            'status': 'success',
            'data': {
                'users': users,
                'contacts': contacts,
                'sos_events': sos_events
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
