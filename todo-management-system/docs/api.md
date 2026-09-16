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
- User-specific task access

The API communicates with a PostgreSQL database hosted on Supabase.

---

## Base URL

### Local Development

```text
http://localhost/api
```

### Cloud Deployment

```text
https://todo-frontend-2-2.onrender.com/api
```

The frontend communicates with the backend through the `/api` path.

In the local Docker environment, Nginx forwards `/api` requests to the Flask backend container.

In the cloud deployment, Nginx forwards `/api` requests to the deployed Render backend.

---

## Authentication

The application uses JWT (JSON Web Token) authentication.

Users must register and log in before accessing protected task endpoints.

After successful login, the backend returns an access token.

The token must be included in the `Authorization` header for protected requests.

```http
Authorization: Bearer <JWT_TOKEN>
```

---

# Authentication Endpoints

## Register User

Creates a new user account.

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
curl -X POST http://localhost/api/auth/register \
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

If required fields are missing:

```json
{
  "message": "Email and password are required"
}
```

---

## Login User

Authenticates an existing user and returns a JWT access token.

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
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Successful Response

```json
{
  "access_token": "<JWT_TOKEN>"
}
```

The returned JWT token is used for authenticated task operations.

### Invalid Credentials

```json
{
  "message": "Invalid email or password"
}
```

---

# Todo Endpoints

All Todo endpoints require a valid JWT token.

The backend identifies the user from the verified JWT token.

The API does not trust a user ID supplied by the frontend.

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
curl http://localhost/api/todos \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Successful Response

```json
[
  {
    "id": 1,
    "title": "Learn Docker",
    "description": "Practice Docker commands",
    "completed": false,
    "user_id": 1
  }
]
```

If the user has no tasks:

```json
[]
```

---

## Create Task

Creates a new task for the authenticated user.

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
curl -X POST http://localhost/api/todos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{"title":"Learn Kubernetes","description":"Practice Kubernetes deployments"}'
```

### Successful Response

```json
{
  "id": 2,
  "title": "Learn Kubernetes",
  "description": "Practice Kubernetes deployments",
  "completed": false,
  "user_id": 1
}
```

---

## Update Task

Updates an existing task belonging to the authenticated user.

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
curl -X PUT http://localhost/api/todos/2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{"title":"Learn Kubernetes","description":"Practice Kubernetes deployments and services","completed":true}'
```

### Successful Response

```json
{
  "id": 2,
  "title": "Learn Kubernetes",
  "description": "Practice Kubernetes deployments and services",
  "completed": true,
  "user_id": 1
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
curl -X DELETE http://localhost/api/todos/2 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Successful Response

```json
{
  "message": "Todo deleted successfully"
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
4. Backend generates JWT
        |
        v
5. Frontend stores JWT
        |
        v
6. Frontend sends JWT with API requests
        |
        v
7. Backend validates JWT
        |
        v
8. Backend identifies authenticated user
        |
        v
9. Backend performs requested task operation
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

When retrieving tasks, the backend uses the authenticated user's ID from the JWT token.

Therefore:

- User 1 can access User 1's tasks.
- User 2 can access User 2's tasks.
- User 1 cannot access User 2's tasks.
- User 2 cannot access User 1's tasks.

This isolation is enforced by the backend.

---

# Database Structure

## Users Table

```text
users
├── id
├── email
├── password_hash
└── created_at
```

## Todos Table

```text
todos
├── id
├── title
├── description
├── completed
├── user_id
├── created_at
└── updated_at
```

The `user_id` column in the `todos` table references the `id` column in the `users` table.

```text
users.id
    |
    | 1
    |
    | many
    v
todos.user_id
```

---

# Protected Request Example

A protected request must include the JWT token.

```http
GET /api/todos
Authorization: Bearer <JWT_TOKEN>
```

Example using `curl`:

```bash
curl http://localhost/api/todos \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

Without a valid token, the API returns an authentication error.

---

# API Request Flow

```text
Browser
   |
   | HTTP Request
   v
Nginx
   |
   | /api
   v
Flask Backend
   |
   | Validate JWT
   v
Authenticated User
   |
   | Query user-specific data
   v
PostgreSQL
   |
   | Database Response
   v
Flask Backend
   |
   v
Nginx
   |
   v
Browser
```

---

# API Endpoint Summary

| Method | Endpoint | Authentication | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Register a new user |
| `POST` | `/api/auth/login` | No | Authenticate user and return JWT |
| `GET` | `/api/todos` | Yes | Get authenticated user's tasks |
| `POST` | `/api/todos` | Yes | Create a task |
| `PUT` | `/api/todos/<id>` | Yes | Update a task |
| `DELETE` | `/api/todos/<id>` | Yes | Delete a task |

---

# API Security Notes

- Passwords are stored as password hashes.
- Passwords are never stored as plain text.
- Protected endpoints require JWT authentication.
- JWT identity is used to identify the authenticated user.
- Task access is restricted to the authenticated user's own data.
- Database credentials are provided through environment variables.
- JWT secret configuration is provided through environment variables.
- Sensitive credentials are not stored in the Git repository.