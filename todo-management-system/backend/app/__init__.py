import os

from dotenv import load_dotenv
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS


load_dotenv()

db = SQLAlchemy()
jwt = JWTManager()


def create_app():
    app = Flask(__name__)

    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise RuntimeError("DATABASE_URL environment variable is not set")

    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    app.config["JWT_SECRET_KEY"] = os.getenv(
        "JWT_SECRET_KEY",
        "dev-secret-change-this-later"
    )

    db.init_app(app)
    jwt.init_app(app)
    CORS(app)

    from app.auth import auth_bp
    from app.todos import todos_bp
    from app.admin import admin_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(todos_bp)
    app.register_blueprint(admin_bp)

    @app.route("/")
    def home():
        return {"message": "Todo API is running"}

    @app.route("/api/health")
    def health():
        return {"status": "healthy"}, 200

    return app