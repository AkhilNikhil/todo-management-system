from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from app.models import Todo, User

todos_bp = Blueprint("todos", __name__, url_prefix="/api/todos")


@todos_bp.route("", methods=["GET"])
@jwt_required()
def get_todos():
    user_id = int(get_jwt_identity())

    todos = Todo.query.filter_by(user_id=user_id).all()

    result = []

    for todo in todos:
        assigned_by_email = None

        if todo.assigned_by:
            admin_user = User.query.get(todo.assigned_by)

            if admin_user:
                assigned_by_email = admin_user.email

        result.append({
            "id": todo.id,
            "title": todo.title,
            "description": todo.description,
            "priority": todo.priority,
            "completed": todo.completed,
            "assigned_by": todo.assigned_by,
            "assigned_by_email": assigned_by_email
        })

    return jsonify(result), 200


@todos_bp.route("", methods=["POST"])
@jwt_required()
def create_todo():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    title = data.get("title")
    description = data.get("description")

    if not title:
        return jsonify({
            "message": "Title is required"
        }), 400

    todo = Todo(
        title=title,
        description=description,
        priority="Medium",
        user_id=user_id,
        assigned_by=None
    )

    db.session.add(todo)
    db.session.commit()

    return jsonify({
        "message": "Todo created successfully",
        "todo": {
            "id": todo.id,
            "title": todo.title,
            "description": todo.description,
            "priority": todo.priority,
            "completed": todo.completed,
            "assigned_by": None,
            "assigned_by_email": None
        }
    }), 201


@todos_bp.route("/<int:todo_id>", methods=["PUT"])
@jwt_required()
def update_todo(todo_id):
    user_id = int(get_jwt_identity())

    todo = Todo.query.filter_by(
        id=todo_id,
        user_id=user_id
    ).first()

    if not todo:
        return jsonify({
            "message": "Todo not found"
        }), 404

    data = request.get_json()

    if "title" in data:
        todo.title = data["title"]

    if "description" in data:
        todo.description = data["description"]

    if "completed" in data:
        todo.completed = data["completed"]

    db.session.commit()

    return jsonify({
        "message": "Todo updated successfully"
    }), 200


@todos_bp.route("/<int:todo_id>", methods=["DELETE"])
@jwt_required()
def delete_todo(todo_id):
    user_id = int(get_jwt_identity())

    todo = Todo.query.filter_by(
        id=todo_id,
        user_id=user_id
    ).first()

    if not todo:
        return jsonify({
            "message": "Todo not found"
        }), 404

    db.session.delete(todo)
    db.session.commit()

    return jsonify({
        "message": "Todo deleted successfully"
    }), 200