# API Documentation

## Overview

The My Tasks application provides a REST API built using Python and Flask.

The API handles:

- User registration
- User authentication
- JWT token generation
- Task creation
- Task retrieval
- Task updates
- Task completion
- Task deletion
- Admin user management
- Admin task assignment
- Admin access to all tasks
- User-specific task access

The API communicates with a PostgreSQL database hosted on Supabase.

---

## Base URL

### Local Development

```text
http://localhost
```

API endpoints are accessed under the `/api` path.

### Cloud Deployment

Frontend:

```text
https://task-management-system-ri71.onrender.com
```

Backend:

```text
https://todo-backend-3-0-1.onrender.com
```

In V3 cloud deployment, the React frontend communicates directly with the deployed Flask backend over HTTPS.

Therefore, API requests use:

```text
https://todo-backend-3-0-1.onrender.com/api/...
```

Nginx serves the frontend application. It is not used as the cloud API gateway for the V3 React-to-Render-backend API requests.

---

## Authentication

The application uses JWT (JSON Web Token) authentication.

Users must register and log in before accessing protected task and admin endpoints.

After successful login, the backend returns an access token and the user's role.

The token must be included in the `Authorization` header for protected requests.

```http
Authorization: Bearer <JWT_TOKEN>
```

---

# Authentication Endpoints

## Register User

Creates a new user account.

Newly registered users receive the default `user` role.

### Endpoint

```http
POST /api/auth/register
```

### Request Body

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Example Request

```bash
curl -X POST https://todo-backend-3-0-1.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Successful Response

```json
{
  "message": "User registered successfully"
}
```

### Possible Errors

If the email already exists:

```json
{
  "message": "User already exists"
}
```

HTTP status:

```text
409 Conflict
```

If required fields are missing:

```json
{
  "message": "Email and password are required"
}
```

HTTP status:

```text
400 Bad Request
```

---

## Login User

Authenticates an existing user and returns a JWT access token and role.

### Endpoint

```http
POST /api/auth/login
```

### Request Body

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Example Request

```bash
curl -X POST https://todo-backend-3-0-1.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Successful Response

```json
{
  "message": "Login successful",
  "access_token": "<JWT_TOKEN>",
  "role": "user"
}
```

The `role` value identifies whether the authenticated account is a regular user or an administrator.

The returned JWT token is used for authenticated task and admin operations.

### Invalid Credentials

```json
{
  "message": "Invalid email or password"
}
```

HTTP status:

```text
401 Unauthorized
```

---

# Health Endpoint

Checks whether the Flask backend is healthy.

### Endpoint

```http
GET /api/health
```

### Authentication

No authentication required.

### Example Request

```bash
curl https://todo-backend-3-0-1.onrender.com/api/health
```

### Successful Response

```json
{
  "status": "healthy"
}
```

HTTP status:

```text
200 OK
```

---

# Todo Endpoints

All Todo endpoints require a valid JWT token.

The backend identifies the authenticated user from the verified JWT token.

The API does not trust a user ID supplied by the frontend for normal user task operations.

---

## Get User Tasks

Returns the tasks belonging to the authenticated user.

### Endpoint

```http
GET /api/todos
```

### Authentication

```http
Authorization: Bearer <JWT_TOKEN>
```

### Example Request

```bash
curl https://todo-backend-3-0-1.onrender.com/api/todos \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Successful Response

```json
[
  {
    "id": 1,
    "title": "Learn Docker",
    "description": "Practice Docker commands",
    "priority": "Medium",
    "completed": false,
    "assigned_by": null,
    "assigned_by_email": null
  }
]
```

If a task was assigned by an administrator, `assigned_by` contains the admin user's ID and `assigned_by_email` contains the admin's email.

If the user has no tasks:

```json
[]
```

---

## Create Task

Creates a new task for the authenticated user.

A task created through the normal Todo API is a personal task. Its priority defaults to `Medium`, and `assigned_by` is `null`.

### Endpoint

```http
POST /api/todos
```

### Authentication

```http
Authorization: Bearer <JWT_TOKEN>
```

### Request Body

```json
{
  "title": "Learn Kubernetes",
  "description": "Practice Kubernetes deployments"
}
```

### Example Request

```bash
curl -X POST https://todo-backend-3-0-1.onrender.com/api/todos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{"title":"Learn Kubernetes","description":"Practice Kubernetes deployments"}'
```

### Successful Response

```json
{
  "message": "Todo created successfully",
  "todo": {
    "id": 2,
    "title": "Learn Kubernetes",
    "description": "Practice Kubernetes deployments",
    "priority": "Medium",
    "completed": false,
    "assigned_by": null,
    "assigned_by_email": null
  }
}
```

---

## Update Task

Updates an existing task belonging to the authenticated user.

The current implementation supports updating:

- `title`
- `description`
- `completed`

### Endpoint

```http
PUT /api/todos/<id>
```

Replace `<id>` with the task ID.

### Authentication

```http
Authorization: Bearer <JWT_TOKEN>
```

### Request Body

```json
{
  "title": "Learn Kubernetes",
  "description": "Practice Kubernetes deployments and services",
  "completed": true
}
```

### Example Request

```bash
curl -X PUT https://todo-backend-3-0-1.onrender.com/api/todos/2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{"title":"Learn Kubernetes","description":"Practice Kubernetes deployments and services","completed":true}'
```

### Successful Response

```json
{
  "message": "Todo updated successfully"
}
```

---

## Delete Task

Deletes a task belonging to the authenticated user.

### Endpoint

```http
DELETE /api/todos/<id>
```

Replace `<id>` with the task ID.

### Authentication

```http
Authorization: Bearer <JWT_TOKEN>
```

### Example Request

```bash
curl -X DELETE https://todo-backend-3-0-1.onrender.com/api/todos/2 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Successful Response

```json
{
  "message": "Todo deleted successfully"
}
```

---

# Admin Endpoints

Admin endpoints require:

1. A valid JWT token.
2. The authenticated user's database role to be `admin`.

Regular users receive:

```json
{
  "message": "Admin access required"
}
```

with HTTP status:

```text
403 Forbidden
```

---

## Admin Access Test

Verifies that the authenticated user has administrator access.

### Endpoint

```http
GET /api/admin/test
```

### Authentication

```http
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

### Example Request

```bash
curl https://todo-backend-3-0-1.onrender.com/api/admin/test \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```

### Successful Response

```json
{
  "message": "Admin access confirmed"
}
```

---

## Get All Users

Returns the users registered in the application.

### Endpoint

```http
GET /api/admin/users
```

### Authentication

```http
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

### Example Request

```bash
curl https://todo-backend-3-0-1.onrender.com/api/admin/users \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```

### Successful Response

```json
{
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "role": "user",
      "created_at": "2026-01-01T00:00:00"
    }
  ],
  "total_users": 1
}
```

The exact user IDs and timestamps depend on the database contents.

---

## Get All Tasks

Returns all tasks in the system.

This endpoint is available only to administrators.

### Endpoint

```http
GET /api/admin/tasks
```

### Authentication

```http
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

### Example Request

```bash
curl https://todo-backend-3-0-1.onrender.com/api/admin/tasks \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```

### Successful Response

```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Learn Docker",
      "description": "Practice Docker commands",
      "priority": "Medium",
      "completed": false,
      "user_id": 1,
      "user_email": "user@example.com",
      "assigned_by": null,
      "assigned_by_email": null,
      "created_at": "2026-01-01T00:00:00",
      "updated_at": "2026-01-01T00:00:00"
    }
  ],
  "total_tasks": 1
}
```

---

## Assign Task to User

Allows an administrator to create a task for a selected user.

### Endpoint

```http
POST /api/admin/tasks
```

### Authentication

```http
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

### Request Body

```json
{
  "user_id": 1,
  "title": "Deploy Application",
  "description": "Deploy the application to the cloud",
  "priority": "High"
}
```

### Allowed Priorities

```text
Low
Medium
High
```

If `priority` is omitted, the default is:

```text
Medium
```

### Example Request

```bash
curl -X POST https://todo-backend-3-0-1.onrender.com/api/admin/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -d '{"user_id":1,"title":"Deploy Application","description":"Deploy the application to the cloud","priority":"High"}'
```

### Successful Response

```json
{
  "message": "Task assigned successfully",
  "todo": {
    "id": 3,
    "title": "Deploy Application",
    "description": "Deploy the application to the cloud",
    "priority": "High",
    "completed": false,
    "user_id": 1,
    "assigned_by": 14
  }
}
```

The `assigned_by` value is the authenticated administrator's user ID.

### Possible Errors

Missing request body:

```json
{
  "message": "Request body is required"
}
```

Missing user ID:

```json
{
  "message": "user_id is required"
}
```

Missing title:

```json
{
  "message": "Title is required"
}
```

Invalid priority:

```json
{
  "message": "Priority must be Low, Medium, or High"
}
```

Unknown target user:

```json
{
  "message": "User not found"
}
```

---

# HTTP Status Codes

The API uses standard HTTP status codes.

| Status Code | Meaning |
|---|---|
| `200` | Request successful |
| `201` | Resource created successfully |
| `400` | Invalid request or missing data |
| `401` | Authentication required or invalid JWT |
| `403` | Authenticated user does not have admin access |
| `404` | Resource not found |
| `409` | Resource already exists |
| `500` | Internal server error |

---

# JWT Authentication Flow

```text
1. User registers
        |
        v
2. User logs in
        |
        v
3. Backend verifies credentials
        |
        v
4. Backend generates JWT and returns role
        |
        v
5. Frontend stores JWT and role
        |
        v
6. Frontend sends JWT with protected API requests
        |
        v
7. Backend validates JWT
        |
        v
8. Backend identifies authenticated user
        |
        v
9. Backend checks authorization where required
        |
        v
10. Backend performs requested operation
```

---

# User Data Isolation

Each Todo belongs to a specific user through the `user_id` field.

```text
User 1
   |
   +-- Task A
   +-- Task B

User 2
   |
   +-- Task C
   +-- Task D
```

When retrieving or modifying normal user tasks, the backend uses the authenticated user's ID from the JWT token.

Therefore:

- User 1 can access User 1's tasks.
- User 2 can access User 2's tasks.
- User 1 cannot access User 2's tasks through the normal Todo endpoints.
- User 2 cannot access User 1's tasks through the normal Todo endpoints.

This isolation is enforced by the backend.

Administrators have separate admin endpoints that allow authorized system-level task visibility and assignment.

---

# Database Structure

## Users Table

```text
users
├── id
├── email
├── password_hash
├── created_at
└── role
```

## Todos Table

```text
todos
├── id
├── title
├── description
├── priority
├── completed
├── user_id
├── assigned_by
├── created_at
└── updated_at
```

The `user_id` column references the `id` column in the `users` table.

The `assigned_by` column also references `users.id` and records the administrator who assigned the task when applicable.

```text
users.id
   |
   +--------------------+
   |                    |
   | user_id            | assigned_by
   v                    v
todos.user_id       todos.assigned_by
```

The `assigned_by` relationship uses `ON DELETE SET NULL`.

The `user_id` relationship uses `ON DELETE CASCADE`.

---

# Protected Request Example

A protected request must include the JWT token.

```http
GET /api/todos
Authorization: Bearer <JWT_TOKEN>
```

Example using `curl`:

```bash
curl https://todo-backend-3-0-1.onrender.com/api/todos \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

Without a valid token, the API returns an authentication error.

---

# Admin Protected Request Example

Admin endpoints require a valid JWT belonging to a user whose database role is `admin`.

```http
GET /api/admin/users
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

Example using `curl`:

```bash
curl https://todo-backend-3-0-1.onrender.com/api/admin/users \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```

---

# API Request Flow

## V3 Cloud Flow

```text
Browser
   |
   | HTTPS API Request
   v
React Frontend
   |
   | HTTPS /api/...
   v
Render Flask Backend
   |
   | Validate JWT
   v
Authorization
   |
   | Query / update data
   v
Supabase PostgreSQL
   |
   | Database Response
   v
Flask Backend
   |
   | JSON Response
   v
React Frontend
   |
   v
Browser
```

## Local Docker Flow

```text
Browser
   |
   | HTTP
   v
Nginx Frontend Container
   |
   | Frontend application
   v
Browser

Browser / API Client
   |
   | HTTP
   v
Flask Backend Container
   |
   | SQL
   v
Supabase PostgreSQL
```

In the current V3 frontend implementation, the React application uses the deployed Render backend URL directly for API requests.

---

# API Endpoint Summary

| Method | Endpoint | Authentication | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Register a new user |
| `POST` | `/api/auth/login` | No | Authenticate user and return JWT + role |
| `GET` | `/api/health` | No | Check backend health |
| `GET` | `/api/todos` | Yes | Get authenticated user's tasks |
| `POST` | `/api/todos` | Yes | Create a personal task |
| `PUT` | `/api/todos/<id>` | Yes | Update authenticated user's task |
| `DELETE` | `/api/todos/<id>` | Yes | Delete authenticated user's task |
| `GET` | `/api/admin/test` | Admin | Verify admin access |
| `GET` | `/api/admin/users` | Admin | Get all users |
| `GET` | `/api/admin/tasks` | Admin | Get all tasks |
| `POST` | `/api/admin/tasks` | Admin | Assign a task to a user |

---

# API Security Notes

- Passwords are stored as password hashes.
- Passwords are never stored as plain text.
- Protected endpoints require JWT authentication.
- Admin endpoints require the authenticated user's database role to be `admin`.
- JWT identity is used to identify the authenticated user.
- Normal task access is restricted to the authenticated user's own data.
- Admin endpoints provide separate authorized access to user and task management functions.
- Database credentials are provided through environment variables.
- JWT secret configuration is provided through environment variables.
- Sensitive credentials are not stored in the Git repository.
- HTTPS is used for the deployed frontend-to-backend API communication.

---

# V3 API Scope

The V3 API introduces the role and task-assignment foundation.

Implemented in V3:

- User roles (`user` and `admin`)
- Admin authorization
- Admin user listing
- Admin task listing
- Admin task assignment
- Task priorities
- Assignment tracking through `assigned_by`
- Backend health check

Future features such as user-to-user messaging, user discovery, activity tracking, and expanded communication controls are outside the current V3 API scope.
