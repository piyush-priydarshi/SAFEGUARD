# 🛡️ Women Safety System — Flask Backend

A modular, production-ready Flask REST API for a women's safety platform.

---

## 📁 Project Structure

```
women_safety/
├── app.py               # Entry point & app factory
├── database.py          # SQLite init & schema
├── auth_utils.py        # Token auth, password hashing, login_required
├── alert_service.py     # Mock SMS/call dispatcher
├── requirements.txt
└── routes/
    ├── auth.py          # Register, login, profile, logout
    ├── contacts.py      # Emergency contacts CRUD
    ├── sos.py           # SOS trigger / cancel / history
    ├── location.py      # GPS location tracking
    └── alerts.py        # Alert listing & acknowledgement
```

---

## ⚙️ Setup & Run

```bash
# 1. Create & activate virtual env
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run the server
python app.py
# → http://localhost:5000
```

---

## 🔑 Authentication

All protected routes require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are returned on `/api/auth/register` and `/api/auth/login`.

---

## 📡 API Reference

### Auth  `/api/auth`

| Method | Path        | Auth | Description               |
|--------|-------------|------|---------------------------|
| POST   | /register   | ❌   | Create a new account       |
| POST   | /login      | ❌   | Login & receive token      |
| GET    | /profile    | ✅   | View own profile           |
| PUT    | /profile    | ✅   | Update name / email        |
| POST   | /logout     | ✅   | Invalidate token           |

**Register body:**
```json
{ "name": "Priya", "phone": "9876543210", "email": "priya@example.com", "password": "secret" }
```

---

### Emergency Contacts  `/api/contacts`

| Method | Path    | Auth | Description          |
|--------|---------|------|----------------------|
| GET    | /       | ✅   | List all contacts    |
| POST   | /       | ✅   | Add contact (max 5)  |
| GET    | /<id>   | ✅   | Get one contact      |
| PUT    | /<id>   | ✅   | Update contact       |
| DELETE | /<id>   | ✅   | Delete contact       |

**Add contact body:**
```json
{ "name": "Amma", "phone": "9876540001", "relation": "Mother" }
```

---

### SOS  `/api/sos`

| Method | Path              | Auth | Description               |
|--------|-------------------|------|---------------------------|
| POST   | /trigger          | ✅   | 🚨 Trigger SOS alert      |
| POST   | /cancel           | ✅   | Cancel active SOS          |
| POST   | /resolve/<id>     | ✅   | Mark SOS as resolved       |
| GET    | /active           | ✅   | Check for active SOS       |
| GET    | /history          | ✅   | Full SOS history           |

**Trigger body (all optional):**
```json
{ "latitude": 13.0827, "longitude": 80.2707, "address": "Chennai Central" }
```

**Trigger response:**
```json
{
  "message": "SOS triggered successfully",
  "sos": { "id": 1, "status": "active", "triggered_at": "..." },
  "alerts_dispatched": [
    { "contact_name": "Amma", "contact_phone": "...", "channel": ["sms","call"], "status": "sent" }
  ]
}
```

---

### Location Tracking  `/api/location`

| Method | Path     | Auth | Description                        |
|--------|----------|------|------------------------------------|
| POST   | /update  | ✅   | Push a GPS coordinate              |
| GET    | /current | ✅   | Latest known location              |
| GET    | /history | ✅   | History (default 20, max 100)      |
| DELETE | /history | ✅   | Clear all location history         |

**Update body:**
```json
{ "latitude": 13.0827, "longitude": 80.2707, "accuracy": 10.5 }
```

---

### Alerts  `/api/alerts`

| Method | Path                     | Auth | Description                  |
|--------|--------------------------|------|------------------------------|
| GET    | /                        | ✅   | All alerts for current user  |
| GET    | /<id>                    | ✅   | Single alert detail          |
| POST   | /<id>/acknowledge        | ✅   | Simulate contact acknowledges|
| GET    | /sos/<sos_id>            | ✅   | Alerts for a specific SOS    |

---

## 🔌 Integrating Real Alert Providers

Open `alert_service.py` and replace the mock functions:

```python
# SMS via Twilio
from twilio.rest import Client
client = Client(TWILIO_SID, TWILIO_TOKEN)
client.messages.create(to=phone, from_=TWILIO_NUMBER, body=message)

# Voice call via Twilio
client.calls.create(to=phone, from_=TWILIO_NUMBER, url=TWIML_URL)
```

---

## 🗄️ Database Schema

```
users               → id, name, phone, email, password, created_at
emergency_contacts  → id, user_id, name, phone, relation, created_at
sos_events          → id, user_id, lat, lng, address, status, triggered_at, resolved_at
location_history    → id, user_id, lat, lng, accuracy, recorded_at
alerts              → id, sos_event_id, user_id, contact_id, contact_phone, message, status, sent_at, acknowledged_at
```

---

## 🚀 Production Checklist

- [ ] Replace in-memory token store with Redis or DB-backed sessions
- [ ] Use `python-dotenv` for secrets (SECRET_KEY, DB path)
- [ ] Switch `hash_password` to `bcrypt`
- [ ] Plug in real SMS/call provider in `alert_service.py`
- [ ] Add rate limiting (`flask-limiter`)
- [ ] Deploy behind `gunicorn` + Nginx
- [ ] Enable HTTPS
