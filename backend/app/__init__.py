from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from config import Config
from flask_cors import CORS


db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()

def create_app():
    app = Flask(__name__)
    app.config.from_object("config.Config")

    CORS(app)

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)

    from .auth import auth_bp
    from .routes import main_bp
    from .songs import songs_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(main_bp, url_prefix="/api")
    app.register_blueprint(songs_bp, url_prefix="/api/songs")

    return app
