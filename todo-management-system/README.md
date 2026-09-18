# My Tasks – Personal Task Manager

A containerized full-stack task management application built with React, Flask, PostgreSQL, JWT authentication, Docker, and Docker Compose.

The application allows users to register, log in, and manage their tasks. V3 introduces role-based access with Admin and User roles, allowing administrators to manage users and assign tasks.

---

## Features

### Authentication

- User registration
- User login
- JWT-based authentication
- Password hashing
- Protected API endpoints
- User-specific task isolation

### Task Management

- Create tasks
- View tasks
- Update tasks
- Mark tasks as completed or incomplete
- Delete tasks
- Task priority levels: Low, Medium, High
- Admin task assignment

### Admin Features

- Admin and User roles
- Admin-only API access
- View registered users
- View all tasks
- Assign tasks to users
- Track which administrator assigned a task

### Application and DevOps

- React frontend with Vite
- Flask REST API
- Gunicorn production server
- Nginx web server
- Dockerized frontend and backend
- Docker Compose for local orchestration
- Docker Hub image publishing
- Render cloud deployment
- PostgreSQL database hosted on Supabase
- Persistent cloud database storage

---

# Architecture

## Local Docker Architecture

```text
Browser
   |
   v
Frontend Container
React + Vite + Nginx
Port 80
   |
   | /api
   v
Backend Container
Flask + Gunicorn
Port 5000
   |
   | PostgreSQL
   v
Supabase PostgreSQL
```

## Cloud Architecture

```text
Browser
   |
   | HTTPS
   v
Render Frontend Service
React + Nginx
   |
   | HTTPS API requests
   v
Render Backend Service
Flask + Gunicorn
   |
   | PostgreSQL connection
   v
Supabase PostgreSQL
```

In the V3 cloud deployment, the React frontend communicates directly with the deployed Render backend API over HTTPS.

The frontend and backend are independently containerized and deployed as separate services.

---

# Technology Stack

## Frontend

- React
- Vite
- JavaScript
- HTML
- CSS
- Nginx

## Backend

- Python
- Flask
- Flask-SQLAlchemy
- Flask-JWT-Extended
- Flask-CORS
- Gunicorn

## Database

- PostgreSQL
- Supabase

## DevOps

- Docker
- Docker Compose
- Docker Hub
- Git
- GitHub
- Render

---

# Project Structure

```text
todo-management-system/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── authz.py
│   │   ├── admin.py
│   │   ├── models.py
│   │   └── todos.py
│   │
│   ├── Dockerfile
│   ├── requirements.txt
│   └── run.py
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   │
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.js
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   └── deployment.md
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

# Backend API

## Health Check

```http
GET /api/health
```

Returns the health status of the backend.

Example response:

```json
{
  "status": "healthy"
}
```

---

# Authentication APIs

## Register User

```http
POST /api/auth/register
```

Example request:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

The password is stored as a password hash.

### Possible Responses

Successful registration:

```json
{
  "message": "User registered successfully"
}
```

If the user already exists:

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

```http
POST /api/auth/login
```

Example request:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

A successful login returns a JWT access token and the user's role.

Example:

```json
{
  "message": "Login successful",
  "access_token": "<JWT_TOKEN>",
  "role": "user"
}
```

For an administrator account, the role is:

```text
admin
```

---

# Todo APIs

All Todo endpoints require a valid JWT access token.

Protected requests use:

```http
Authorization: Bearer <JWT_TOKEN>
```

## Get Tasks

```http
GET /api/todos
```

Returns tasks belonging to the authenticated user.

Example response:

```json
[
  {
    "id": 1,
    "title": "Learn Docker",
    "description": "Practice Docker containers",
    "priority": "Medium",
    "completed": false,
    "assigned_by": null,
    "assigned_by_email": null
  }
]
```

---

## Create Task

```http
POST /api/todos
```

Example request:

```json
{
  "title": "Learn Docker",
  "description": "Practice Docker containers"
}
```

Tasks created directly by users receive the default priority:

```text
Medium
```

Example response:

```json
{
  "message": "Todo created successfully",
  "todo": {
    "id": 1,
    "title": "Learn Docker",
    "description": "Practice Docker containers",
    "priority": "Medium",
    "completed": false,
    "assigned_by": null,
    "assigned_by_email": null
  }
}
```

---

## Update Task

```http
PUT /api/todos/<id>
```

Example request:

```json
{
  "title": "Learn Kubernetes",
  "description": "Practice Kubernetes deployments",
  "completed": true
}
```

Example response:

```json
{
  "message": "Todo updated successfully"
}
```

---

## Delete Task

```http
DELETE /api/todos/<id>
```

Deletes a task belonging to the authenticated user.

Example response:

```json
{
  "message": "Todo deleted successfully"
}
```

---

# Admin APIs

Admin endpoints require a valid JWT belonging to a user with the `admin` role.

Normal users cannot access these endpoints.

## Admin Test

```http
GET /api/admin/test
```

Verifies that the authenticated user has administrator access.

Successful response:

```json
{
  "message": "Admin access confirmed"
}
```

---

## Get Users

```http
GET /api/admin/users
```

Returns the registered users.

Example response structure:

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

---

## Get All Tasks

```http
GET /api/admin/tasks
```

Returns tasks across users for administrator management.

Task information includes:

- Task ID
- Title
- Description
- Priority
- Completion status
- User ID
- User email
- Assigned administrator
- Assignment information
- Creation timestamp
- Update timestamp

Example response structure:

```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Deploy Application",
      "description": "Deploy the application using Docker",
      "priority": "High",
      "completed": false,
      "user_id": 2,
      "user_email": "user@example.com",
      "assigned_by": 14,
      "assigned_by_email": "admin@example.com",
      "created_at": "2026-01-01T00:00:00",
      "updated_at": "2026-01-01T00:00:00"
    }
  ],
  "total_tasks": 1
}
```

---

## Assign Task

```http
POST /api/admin/tasks
```

Creates a task for a selected user.

Example request:

```json
{
  "user_id": 2,
  "title": "Deploy Application",
  "description": "Deploy the application using Docker",
  "priority": "High"
}
```

Allowed priority values:

```text
Low
Medium
High
```

The task is associated with the selected user and records the administrator who assigned it.

Example response:

```json
{
  "message": "Task assigned successfully",
  "todo": {
    "id": 2,
    "title": "Deploy Application",
    "description": "Deploy the application using Docker",
    "priority": "High",
    "completed": false,
    "user_id": 2,
    "assigned_by": 14
  }
}
```

---

# Authentication and Authorization

The application uses JWT authentication.

The authentication flow is:

```text
User
 |
 | Login
 v
Flask Backend
 |
 | Verify credentials
 v
PostgreSQL
 |
 | User + Role
 v
Flask Backend
 |
 | Generate JWT
 v
Frontend
```

For protected requests:

```text
Frontend
 |
 | Authorization: Bearer <JWT>
 v
Flask Backend
 |
 | Validate JWT
 v
Authenticated User
 |
 +----------------------+
 |                      |
 | User                 | Admin
 v                      v
User APIs               Admin APIs
```

The backend uses the authenticated user's identity from the JWT to determine which resources can be accessed.

---

# User Data Isolation

Each task belongs to a specific user through the `user_id` field.

```text
User 1
  ├── Task A
  └── Task B

User 2
  ├── Task C
  └── Task D
```

The backend obtains the authenticated user's ID from the JWT token.

Therefore:

```text
User 1 → User 1 tasks only
User 2 → User 2 tasks only
```

The backend does not trust an arbitrary user ID supplied by the frontend for normal user task operations.

---

# Database

The application uses PostgreSQL hosted on Supabase.

## Users Table

```text
users
├── id
├── email
├── password_hash
├── created_at
└── role
```

The `role` field identifies whether the account is an administrator or normal user.

Possible roles:

```text
admin
user
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

### Relationships

```text
users.id
   |
   +------------------+
   |                  |
   v                  v
todos.user_id    todos.assigned_by
```

- `user_id` identifies the user who owns the task.
- `assigned_by` identifies the administrator who assigned the task.
- User deletion cascades to their tasks through the `user_id` relationship.
- Administrator deletion sets `assigned_by` to `NULL`.

---

# Environment Variables

The backend uses environment variables for database and authentication configuration.

Example:

```env
DATABASE_URL=your-postgresql-connection-string
JWT_SECRET_KEY=your-secret-key
```

The actual credentials must not be committed to GitHub.

The `.env` file is excluded through `.gitignore`.

---

# Running Locally with Docker Compose

Make sure Docker and Docker Compose are installed.

From the project root:

```bash
docker compose build
```

Start the application:

```bash
docker compose up -d
```

Check running containers:

```bash
docker compose ps
```

View all logs:

```bash
docker compose logs
```

View backend logs:

```bash
docker compose logs backend
```

View frontend logs:

```bash
docker compose logs frontend
```

Stop the application:

```bash
docker compose down
```

The frontend can be accessed at:

```text
http://localhost
```

The backend runs on port `5000`.

---

# Docker Images

V3 uses separate Docker images for the frontend and backend.

## Backend

```text
akhilbm/todo-backend:3.0
```

## Frontend

The updated V3 frontend build is prepared as:

```text
akhilbm/todo-frontend:3.1
```

This tag will be used for the updated V3 frontend image that communicates directly with the deployed Render backend.

---

# Docker Compose

Docker Compose runs the frontend and backend as separate containers.

```text
+----------------------+
|    Docker Compose    |
|                      |
|  Frontend Container  |
|  React + Nginx       |
|          |           |
|          v           |
|  Backend Container   |
|  Flask + Gunicorn    |
+----------+-----------+
           |
           v
   Supabase PostgreSQL
```

The PostgreSQL database is external to the application containers.

---

# Data Persistence

Application data is stored in Supabase PostgreSQL rather than inside the application containers.

Therefore:

```text
Container Restart
       |
       v
Application Containers Recreated
       |
       v
Supabase PostgreSQL
       |
       v
Existing Users and Tasks Remain
```

Persistence was verified by restarting the application and confirming that previously created users and tasks remained available.

---

# Cloud Deployment

The application is deployed using Docker images hosted on Docker Hub and separate Render services.

## Backend Service

```text
Service: todo-backend:3.0-1
Platform: Render
Runtime: Docker
Image: akhilbm/todo-backend:3.0
Database: Supabase PostgreSQL
Health Check: /api/health
```

Backend URL:

```text
https://todo-backend-3-0-1.onrender.com
```

The backend uses the Render-provided `PORT` environment variable.

Required environment variables:

```text
DATABASE_URL
JWT_SECRET_KEY
```

---

## Frontend Service

```text
Service: task-management-system
Platform: Render
Runtime: Docker
Image: akhilbm/todo-frontend:3.1
Web Server: Nginx
```

Frontend URL:

```text
https://task-management-system-ri71.onrender.com
```

The V3 React frontend communicates directly with the deployed backend:

```text
React Frontend
      |
      | HTTPS
      v
Render Backend
      |
      v
Supabase PostgreSQL
```

---

# Deployment Flow

```text
Developer
    |
    v
GitHub Repository
    |
    v
Docker Build
    |
    v
Docker Hub
    |
    +-----------------------+
    |                       |
    v                       v
Backend Image          Frontend Image
    |                       |
    v                       v
Render Backend         Render Frontend
    |                       |
    +-----------+-----------+
                |
                v
        Supabase PostgreSQL
```

---

# Testing

The V3 application was tested locally and through the deployed backend.

## Backend Testing

- Backend import tests
- Health endpoint
- Authentication endpoints
- JWT authentication
- Protected API access
- Unauthorized request handling
- Admin authorization

## Task Testing

- Create task
- View tasks
- Update task
- Mark task completed/incomplete
- Delete task
- Task persistence
- Priority handling

## Admin Testing

- Admin authentication
- Admin access protection
- User listing
- All-task listing
- Task assignment
- Assignment tracking
- Priority validation

## User Isolation Testing

Separate users were tested to verify that normal users only access their own tasks.

```text
User 1 → Own tasks
User 2 → Own tasks
Admin  → Administrative task management
```

---

# Security Considerations

- Passwords are stored as password hashes rather than plain text.
- JWT authentication protects task APIs.
- JWT identity is used to identify the authenticated user.
- Admin endpoints require the `admin` role.
- Normal users cannot access admin endpoints.
- User task access is restricted to the authenticated user's identity.
- Database credentials are stored using environment variables.
- JWT secret is stored using an environment variable.
- `.env` is excluded from Git.
- HTTPS is used for cloud frontend/backend communication.
- PostgreSQL data is stored externally in Supabase.

---

# Documentation

Detailed project documentation is available in the `docs/` directory.

```text
docs/
├── architecture.md
├── api.md
└── deployment.md
```

The documentation covers:

- Application architecture
- API endpoints
- Authentication
- Authorization
- Database structure
- Docker configuration
- Docker Compose
- Docker Hub
- Render deployment
- Environment configuration
- Troubleshooting

---

# V2 Status

V2 established the production-ready application foundation:

- React frontend
- Flask backend
- JWT authentication
- PostgreSQL database
- Supabase database hosting
- User-specific task isolation
- Docker containerization
- Docker Compose
- Docker Hub images
- Render cloud deployment
- Persistent database storage
- Local and cloud testing

**V2 is complete and frozen.**

---

# V3 Status

V3 extends the V2 foundation with:

- Improved application GUI
- Admin and User roles
- Admin authorization
- Admin user management
- Admin task assignment
- Admin all-task view
- Task priority
- Assignment tracking
- Backend health endpoint
- Updated Docker configuration
- Updated cloud deployment architecture
- Direct frontend-to-backend HTTPS API communication

**V3 application development is currently frozen at this stage.**

Further features can be developed in a future version without changing the frozen V3 baseline.

---

# Future Development

Possible future versions may extend the application with additional functionality such as:

- More advanced role management
- User directory and user discovery
- Task filtering and search
- Task status workflows
- User-to-user communication
- Admin-to-user messaging
- Activity and audit tracking
- Additional monitoring and observability
- Kubernetes deployment
- Infrastructure as Code with Terraform
- CI/CD automation

These features are intentionally outside the current frozen V3 scope.
