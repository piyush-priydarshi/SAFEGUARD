"""
alert_service.py
----------------
Mock alert dispatching system.

In production this module would integrate with real providers:
  - SMS  → Twilio / AWS SNS / Vonage
  - Call → Twilio Voice / Exotel
  - Push → Firebase Cloud Messaging

For now, every alert is logged to the DB with status='sent'
and a console message simulates the delivery.
"""

import datetime


# ── Message templates ─────────────────────────────────────────────────────────

def _build_message(user_name: str, latitude, longitude, address: str | None) -> str:
    location_str = ""
    if latitude and longitude:
        maps_link   = f"https://maps.google.com/?q={latitude},{longitude}"
        location_str = f"\nLocation: {maps_link}"
        if address:
            location_str += f" ({address})"
    elif address:
        location_str = f"\nLast known address: {address}"
    else:
        location_str = "\nLocation not available."

    return (
        f"🚨 EMERGENCY ALERT 🚨\n"
        f"{user_name} has triggered an SOS alert and may be in danger.\n"
        f"Please check on them immediately or call the police (100).{location_str}"
    )


# ── Core dispatcher ───────────────────────────────────────────────────────────

def send_sos_alerts(db, user_id: int, sos_id: int,
                    latitude, longitude, address) -> list[dict]:
    """
    Fetch all emergency contacts for `user_id`, create an alert record for
    each, and simulate dispatching (SMS + Call).

    Returns a list of summary dicts for the API response.
    """
    user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        return []

    contacts = db.execute(
        "SELECT * FROM emergency_contacts WHERE user_id = ?", (user_id,)
    ).fetchall()

    if not contacts:
        # Still record a system alert so the trigger is not silent
        return [_dispatch_system_alert(db, user, sos_id, latitude, longitude, address)]

    dispatched = []
    for contact in contacts:
        message = _build_message(user['name'], latitude, longitude, address)
        db.execute("""
            INSERT INTO alerts
                (sos_event_id, user_id, contact_id, contact_phone, message, status)
            VALUES (?, ?, ?, ?, ?, 'sent')
        """, (sos_id, user_id, contact['id'], contact['phone'], message))

        # ── Mock delivery ──────────────────────────────────────────────────
        _mock_send_sms(contact['phone'], message)
        _mock_place_call(contact['phone'], user['name'])
        # ──────────────────────────────────────────────────────────────────

        dispatched.append({
            "contact_name":  contact['name'],
            "contact_phone": contact['phone'],
            "channel":       ["sms", "call"],
            "status":        "sent"
        })

    return dispatched


def _dispatch_system_alert(db, user, sos_id, latitude, longitude, address) -> dict:
    """Fallback alert when the user has no contacts configured."""
    message = _build_message(user['name'], latitude, longitude, address)
    db.execute("""
        INSERT INTO alerts
            (sos_event_id, user_id, contact_id, contact_phone, message, status)
        VALUES (?, ?, NULL, 'SYSTEM', ?, 'sent')
    """, (sos_id, user['id'], message))
    print(f"[SYSTEM ALERT] No emergency contacts for user {user['id']}. "
          f"Alert logged internally only.")
    return {"contact_name": "System", "contact_phone": "N/A",
            "channel": ["internal"], "status": "sent"}


# ── Mock transport layer ──────────────────────────────────────────────────────

def _mock_send_sms(phone: str, message: str) -> None:
    timestamp = datetime.datetime.now().strftime('%H:%M:%S')
    print(f"[{timestamp}] 📱 MOCK SMS → {phone}")
    print(f"             {message[:80]}{'…' if len(message) > 80 else ''}")


def _mock_place_call(phone: str, user_name: str) -> None:
    timestamp = datetime.datetime.now().strftime('%H:%M:%S')
    print(f"[{timestamp}] 📞 MOCK CALL → {phone} | "
          f"Playing: '{user_name} has sent an SOS. Please help immediately.'")
