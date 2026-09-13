import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS

db = SQLAlchemy()
jwt = JWTManager()


def create_app():
    app = Flask(__name__)

    os.makedirs(os.path.join(app.instance_path, "data"), exist_ok=True)

    app.config["SQLALCHEMY_DATABASE_URI"] = (
        "sqlite:///" + os.path.join(app.instance_path, "data", "todo.db")
    )
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

    app.register_blueprint(auth_bp)
    app.register_blueprint(todos_bp)

    @app.route("/")
    def home():
        return {"message": "Todo API is running"}

    with app.app_context():
        db.create_all()

    return app
