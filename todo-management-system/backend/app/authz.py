from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from app.models import User


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()

        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)

        if not user:
            return jsonify({"message": "User not found"}), 404

        if user.role != "admin":
            return jsonify({"message": "Admin access required"}), 403

        return fn(*args, **kwargs)

    return wrapper
