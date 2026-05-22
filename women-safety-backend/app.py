from flask import Flask
from flask_cors import CORS   
from database import init_db
from routes.auth import auth_bp
from routes.contacts import contacts_bp
from routes.sos import sos_bp
from routes.location import location_bp
from routes.alerts import alerts_bp
from routes.admin import admin_bp


def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'womensafety-secret-key-2024'
    app.config['DATABASE'] = 'safety.db'

    CORS(app, resources={r"/*": {"origins": "*"}})


    init_db(app)

    app.register_blueprint(auth_bp,      url_prefix='/api/auth')
    app.register_blueprint(contacts_bp,  url_prefix='/api/contacts')
    app.register_blueprint(sos_bp,       url_prefix='/api/sos')
    app.register_blueprint(location_bp,  url_prefix='/api/location')
    app.register_blueprint(alerts_bp,    url_prefix='/api/alerts')
    app.register_blueprint(admin_bp,     url_prefix='/api/admin')

    @app.route('/')
    def index():
        return {
            "service": "Women Safety System API",
            "version": "1.0.0",
            "endpoints": {
                "auth":     ["/api/auth/register", "/api/auth/login", "/api/auth/profile"],
                "contacts": ["/api/contacts/", "/api/contacts/<id>"],
                "sos":      ["/api/sos/trigger", "/api/sos/cancel", "/api/sos/history"],
                "location": ["/api/location/update", "/api/location/current", "/api/location/history"],
                "alerts":   ["/api/alerts/", "/api/alerts/<id>/acknowledge"]
            }
        }

    return app


from flask import Flask
from flask_cors import CORS   
from database import init_db
from routes.auth import auth_bp
from routes.contacts import contacts_bp
from routes.sos import sos_bp
from routes.location import location_bp
from routes.alerts import alerts_bp
from routes.admin import admin_bp


def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'womensafety-secret-key-2024'
    app.config['DATABASE'] = 'safety.db'

    CORS(app, resources={r"/*": {"origins": "*"}})


    init_db(app)

    app.register_blueprint(auth_bp,      url_prefix='/api/auth')
    app.register_blueprint(contacts_bp,  url_prefix='/api/contacts')
    app.register_blueprint(sos_bp,       url_prefix='/api/sos')
    app.register_blueprint(location_bp,  url_prefix='/api/location')
    app.register_blueprint(alerts_bp,    url_prefix='/api/alerts')
    app.register_blueprint(admin_bp,     url_prefix='/api/admin')

    @app.route('/')
    def index():
        return {
            "service": "Women Safety System API",
            "version": "1.0.0",
            "endpoints": {
                "auth":     ["/api/auth/register", "/api/auth/login", "/api/auth/profile"],
                "contacts": ["/api/contacts/", "/api/contacts/<id>"],
                "sos":      ["/api/sos/trigger", "/api/sos/cancel", "/api/sos/history"],
                "location": ["/api/location/update", "/api/location/current", "/api/location/history"],
                "alerts":   ["/api/alerts/", "/api/alerts/<id>/acknowledge"]
            }
        }

    return app


import os

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=False)