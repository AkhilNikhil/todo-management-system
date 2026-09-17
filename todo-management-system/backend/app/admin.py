from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.authz import admin_required
from app import db
from app.models import User, Todo


admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.route("/test", methods=["GET"])
@admin_required
def admin_test():
    return jsonify({
        "message": "Admin access confirmed"
    }), 200


@admin_bp.route("/users", methods=["GET"])
@admin_required
def get_users():
    users = User.query.order_by(User.id.asc()).all()

    return jsonify({
        "users": [
            {
                "id": user.id,
                "email": user.email,
                "role": user.role,
                "created_at": user.created_at.isoformat()
            }
            for user in users
        ],
        "total_users": len(users)
    }), 200


@admin_bp.route("/tasks", methods=["GET"])
@admin_required
def get_all_tasks():
    tasks = Todo.query.order_by(Todo.id.asc()).all()

    result = []

    for task in tasks:
        task_user = User.query.get(task.user_id)

        assigned_by_email = None

        if task.assigned_by:
            assigned_by_user = User.query.get(task.assigned_by)

            if assigned_by_user:
                assigned_by_email = assigned_by_user.email

        result.append({
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "priority": task.priority,
            "completed": task.completed,
            "user_id": task.user_id,
            "user_email": task_user.email if task_user else None,
            "assigned_by": task.assigned_by,
            "assigned_by_email": assigned_by_email,
            "created_at": (
                task.created_at.isoformat()
                if task.created_at
                else None
            ),
            "updated_at": (
                task.updated_at.isoformat()
                if task.updated_at
                else None
            )
        })

    return jsonify({
        "tasks": result,
        "total_tasks": len(result)
    }), 200


@admin_bp.route("/tasks", methods=["POST"])
@admin_required
def assign_task():
    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    user_id = data.get("user_id")
    title = data.get("title")
    description = data.get("description")
    priority = data.get("priority", "Medium")

    if not user_id:
        return jsonify({
            "message": "user_id is required"
        }), 400

    if not title or not title.strip():
        return jsonify({
            "message": "Title is required"
        }), 400

    allowed_priorities = ["Low", "Medium", "High"]

    if priority not in allowed_priorities:
        return jsonify({
            "message": "Priority must be Low, Medium, or High"
        }), 400

    target_user = User.query.get(user_id)

    if not target_user:
        return jsonify({
            "message": "User not found"
        }), 404

    admin_id = int(get_jwt_identity())

    todo = Todo(
        title=title.strip(),
        description=description,
        priority=priority,
        user_id=target_user.id,
        assigned_by=admin_id
    )

    db.session.add(todo)
    db.session.commit()

    return jsonify({
        "message": "Task assigned successfully",
        "todo": {
            "id": todo.id,
            "title": todo.title,
            "description": todo.description,
            "priority": todo.priority,
            "completed": todo.completed,
            "user_id": todo.user_id,
            "assigned_by": todo.assigned_by
        }
    }), 201