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
import threading
import time
import requests
import sqlite3

TELEGRAM_TOKEN = "8125973498:AAG6BkXEjAWjwaSEvO-XzdaolJmMtny-MZA"
TELEGRAM_CHAT_ID = "1895703688"

def send_telegram_message(message: str) -> None:
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    try:
        requests.post(url, json={
            "chat_id": TELEGRAM_CHAT_ID,
            "text": message
        }, timeout=5)
    except Exception as e:
        print(f"Telegram dispatch error: {e}")

def live_location_updater(sos_id: int, user_id: int, user_name: str, db_path: str = "safety.db"):
    """
    Background worker that updates the Telegram channel with updated coordinates
    every 2 minutes while the SOS is active.
    """
    print(f"[Live Tracker] Started for SOS Event {sos_id}, User {user_id}")
    while True:
        time.sleep(120)
        
        conn = None
        try:
            conn = sqlite3.connect(db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Check if SOS is still active
            sos = cursor.execute(
                "SELECT status FROM sos_events WHERE id = ?", (sos_id,)
            ).fetchone()
            
            if not sos or sos['status'] != 'active':
                print(f"[Live Tracker] SOS Event {sos_id} is no longer active. Terminating.")
                break
                
            # Fetch latest location from location_history
            loc = cursor.execute(
                "SELECT latitude, longitude FROM location_history WHERE user_id = ? ORDER BY recorded_at DESC LIMIT 1",
                (user_id,)
            ).fetchone()
            
            if loc:
                lat = loc['latitude']
                lng = loc['longitude']
            else:
                # fallback to original sos event coordinates
                orig = cursor.execute(
                    "SELECT latitude, longitude FROM sos_events WHERE id = ?",
                    (sos_id,)
                ).fetchone()
                lat = orig['latitude'] if orig and orig['latitude'] else "12.9667"
                lng = orig['longitude'] if orig and orig['longitude'] else "77.7104"
                
            time_now = datetime.datetime.now().strftime("%I:%M %p")
            
            message = (
                f"📍 LOCATION UPDATE — {user_name} is still in distress\n"
                f"Location: https://maps.google.com/?q={lat},{lng}\n"
                f"Time: {time_now}"
            )
            
            send_telegram_message(message)
            
        except Exception as e:
            print(f"[Live Tracker] Error in background thread: {e}")
        finally:
            if conn:
                conn.close()

def send_telegram_initial_alert(user_name: str, phone: str, user_id: int, latitude, longitude, battery_level=None, sos_id=None) -> None:
    lat = latitude if latitude else "12.9667"
    lng = longitude if longitude else "77.7104"
    time_now = datetime.datetime.now().strftime("%d %b %Y, %I:%M %p")
    
    battery_line = ""
    if battery_level is not None:
        b_str = str(battery_level).strip()
        if not b_str.endswith('%'):
            b_str = f"{b_str}%"
        battery_line = f"🔋 Battery: {b_str}\n"

    message = (
        f"🚨 EMERGENCY ALERT 🚨\n\n"
        f"👤 Name: {user_name}\n"
        f"📞 Phone: {phone}\n"
        f"🆔 User ID: {user_id}\n"
        f"{battery_line}"
        f"\n📍 Location:\n"
        f"https://maps.google.com/?q={lat},{lng}\n\n"
        f"🕒 Time: {time_now}\n"
        f"⚠ Status: SOS ACTIVE"
    )
    
    send_telegram_message(message)
    
    if sos_id is not None:
        # Spawn the background tracking thread
        t = threading.Thread(
            target=live_location_updater,
            args=(sos_id, user_id, user_name),
            daemon=True
        )
        t.start()

def send_telegram_cancellation(user_name: str) -> None:
    time_now = datetime.datetime.now().strftime("%I:%M %p")
    message = (
        f"✅ SOS CANCELLED\n"
        f"Name: {user_name}\n"
        f"All clear at {time_now}"
    )
    send_telegram_message(message)



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
