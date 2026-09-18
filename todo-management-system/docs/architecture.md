# Application Architecture

## Overview

My Tasks is a containerized full-stack task management application built using React, Flask, PostgreSQL, Docker, and Docker Compose.

The application is divided into separate frontend and backend services. PostgreSQL is used for persistent data storage and is hosted on Supabase.

The application uses JWT authentication to identify users and enforce access to protected resources. V3 also introduces Admin and User roles, task priorities, and administrator task assignment.

---

## Architecture

### Local Docker Architecture

```text
                         Browser
                            |
                            v
                 +----------------------+
                 |   Frontend Container |
                 |----------------------|
                 | React + Vite         |
                 | Nginx                |
                 | Port 80              |
                 +----------+-----------+
                            |
                            | HTTP API
                            v
                 +----------------------+
                 |   Backend Container  |
                 |----------------------|
                 | Flask                |
                 | Gunicorn             |
                 | Port 5000            |
                 +----------+-----------+
                            |
                            | PostgreSQL
                            v
                 +----------------------+
                 | Supabase PostgreSQL  |
                 |      Database        |
                 +----------------------+
```

The frontend and backend run as separate containers under Docker Compose.

The database remains external to the application containers and is hosted on Supabase.

### Cloud Architecture

```text
                         Browser
                            |
                            | HTTPS
                            v
                 +------------------------+
                 |   Render Frontend      |
                 |------------------------|
                 | React + Vite           |
                 | Nginx                  |
                 +-----------+------------+
                             |
                             | HTTPS API requests
                             v
                 +------------------------+
                 |   Render Backend       |
                 |------------------------|
                 | Flask                  |
                 | Gunicorn               |
                 +-----------+------------+
                             |
                             | PostgreSQL
                             v
                 +------------------------+
                 | Supabase PostgreSQL    |
                 |       Database         |
                 +------------------------+
```

In the V3 cloud deployment, the React frontend communicates directly with the deployed Render backend API over HTTPS.

The frontend and backend are independently containerized and deployed as separate Render services.

---

## Components

### Frontend

The frontend is developed using React and Vite.

Responsibilities:

- Display the application interface
- Handle user registration and login
- Store the JWT access token
- Store the authenticated user's role
- Send authenticated API requests
- Display the user's tasks
- Create, update, complete, and delete tasks
- Display task priorities
- Provide the administrator interface for supported admin operations
- Communicate with the backend API

The frontend is built into static files and served using Nginx.

### Nginx

Nginx is used as the web server inside the frontend container.

Responsibilities:

- Serve the React application
- Handle frontend routes
- Provide the HTTP entry point for the frontend container
- Support the SPA fallback to `index.html`

In the V3 cloud architecture, API requests are sent directly from the React application to the Render backend URL over HTTPS. Nginx is not the cloud API gateway.

### Backend

The backend is developed using Python and Flask.

Responsibilities:

- Provide REST API endpoints
- Register users
- Authenticate users
- Generate JWT access tokens
- Validate JWT tokens
- Identify the authenticated user
- Enforce user-specific task access
- Enforce Admin/User authorization
- Create and manage tasks
- Assign tasks to users through admin APIs
- Return administrative user and task information
- Communicate with PostgreSQL

Gunicorn is used as the production WSGI server.

### Authorization

V3 introduces role-based authorization.

The supported roles are:

```text
user
admin
```

Normal users can access their own task resources.

Administrators can access administrator endpoints for:

- Viewing users
- Viewing all tasks
- Assigning tasks to users
- Testing administrator authorization

The backend checks the authenticated user's role before allowing access to admin endpoints.

---

## Database

The application uses PostgreSQL for persistent data storage.

The PostgreSQL database is hosted on Supabase.

### Users Table

```text
users
├── id
├── email
├── password_hash
├── created_at
└── role
```

The `role` field identifies whether the account is a normal user or administrator.

Possible values:

```text
user
admin
```

### Todos Table

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

The `priority` field supports:

```text
Low
Medium
High
```

The `user_id` field identifies the user who owns the task.

The `assigned_by` field identifies the administrator who assigned the task. It can be `NULL` for tasks created directly by users.

---

## Database Relationships

```text
                       users
                         |
             +-----------+-----------+
             |                       |
             | 1                     | 1
             v                       v
        todos.user_id          todos.assigned_by
             |                       |
             | many                  | many
             v                       v
           todos                   todos
```

The two relationships have different purposes:

```text
todos.user_id
    |
    +-- Identifies the task owner

todos.assigned_by
    |
    +-- Identifies the administrator who assigned the task
```

The `todos.user_id` foreign key uses `ON DELETE CASCADE`.

If a user is deleted, tasks owned by that user are also deleted.

The `todos.assigned_by` foreign key uses `ON DELETE SET NULL`.

If an administrator who assigned a task is deleted, the task remains but its `assigned_by` value becomes `NULL`.

---

## Authentication Flow

The application uses JWT-based authentication.

### Registration

```text
Browser
   |
   | POST /api/auth/register
   v
Flask Backend
   |
   | Hash password
   v
PostgreSQL
   |
   | User created
   v
Backend Response
```

Passwords are stored as password hashes rather than plain-text passwords.

### Login

```text
Browser
   |
   | POST /api/auth/login
   | email + password
   v
Flask Backend
   |
   | Verify credentials
   v
PostgreSQL
   |
   | User + role
   v
Flask Backend
   |
   | Generate JWT
   v
Browser
```

The login response contains:

- JWT access token
- User role

The frontend uses the JWT for protected API requests.

---

## Protected API Request Flow

```text
Browser / React
      |
      | Authorization: Bearer <JWT_TOKEN>
      v
Flask Backend
      |
      | Validate JWT
      v
Authenticated User
      |
      +----------------------+
      |                      |
      | role=user             | role=admin
      v                      v
User APIs               Admin APIs
      |                      |
      +----------+-----------+
                 |
                 v
          PostgreSQL
```

The backend obtains the authenticated user's identity from the verified JWT token.

The backend uses that identity when querying normal user task resources.

For administrator endpoints, the backend additionally verifies that the authenticated user's role is `admin`.

---

## Task Data Isolation

Each task is associated with a user through the `user_id` column.

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

When a normal user requests their tasks, the backend obtains the user ID from the JWT and queries tasks belonging to that user.

Therefore:

```text
User 1 → User 1 tasks
User 2 → User 2 tasks
```

Normal user task operations do not use an arbitrary user ID supplied by the frontend to determine ownership.

Administrators have separate protected endpoints that can view tasks across users and assign tasks.

---

## API Communication

The main API routes are:

```text
GET    /api/health

POST   /api/auth/register
POST   /api/auth/login

GET    /api/todos
POST   /api/todos
PUT    /api/todos/<id>
DELETE /api/todos/<id>

GET    /api/admin/test
GET    /api/admin/users
GET    /api/admin/tasks
POST   /api/admin/tasks
```

Protected requests include the JWT token in the `Authorization` header.

```http
Authorization: Bearer <JWT_TOKEN>
```

### V3 Cloud API Flow

```text
React Application
       |
       | HTTPS
       v
https://todo-backend-3-0-1.onrender.com
       |
       v
Flask + Gunicorn
       |
       v
Supabase PostgreSQL
```

---

## Docker Architecture

The application uses separate Docker images for the frontend and backend.

### Frontend Image

```text
React Source
     |
     v
Vite Build
     |
     v
Static Files
     |
     v
Nginx
     |
     v
Frontend Container
```

Docker image:

```text
akhilbm/todo-frontend:3.1
```

### Backend Image

```text
Python Application
       |
       v
     Flask
       |
       v
   Gunicorn
       |
       v
Backend Container
```

Docker image:

```text
akhilbm/todo-backend:3.0
```

---

## Docker Compose Architecture

Docker Compose is used for local development and testing.

```text
+---------------------------+
|     Docker Compose        |
|                           |
|  +---------------------+  |
|  | Frontend Container  |  |
|  | React + Nginx       |  |
|  +----------+----------+  |
|             |             |
|             | HTTP API    |
|             v             |
|  +---------------------+  |
|  | Backend Container   |  |
|  | Flask + Gunicorn    |  |
|  +----------+----------+  |
+-------------|-------------+
              |
              | PostgreSQL
              v
       Supabase PostgreSQL
```

The frontend and backend run as separate services managed by Docker Compose.

The PostgreSQL database is external to the application containers.

---

## Data Persistence

Application data is stored in Supabase PostgreSQL.

The database is not stored inside the frontend or backend containers.

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

Database persistence was verified by restarting the application and confirming that previously created users and tasks remained available.

---

## Cloud Deployment Architecture

The application is deployed as two separate Render services.

### Frontend Service

```text
Render
  |
  v
Frontend Service
  |
  +-- React
  +-- Nginx
```

Frontend service:

```text
task-management-system
```

Docker image:

```text
akhilbm/todo-frontend:3.1
```

The frontend serves the React application.

For V3 cloud API communication, the React application sends API requests directly to the Render backend over HTTPS.

### Backend Service

```text
Render
  |
  v
Backend Service
  |
  +-- Flask
  +-- Gunicorn
```

Backend service:

```text
todo-backend:3.0-1
```

Docker image:

```text
akhilbm/todo-backend:3.0
```

The backend connects to Supabase PostgreSQL using the `DATABASE_URL` environment variable.

Backend health endpoint:

```text
/api/health
```

---

## Environment Configuration

The backend uses environment variables for configuration.

```env
DATABASE_URL=your-postgresql-connection-string
JWT_SECRET_KEY=your-secret-key
```

The values are provided locally through the `.env` file and configured separately in the Render backend service.

Sensitive credentials are not stored in the Git repository.

---

## Request Flow

A typical V3 user task request follows this flow:

```text
1. User opens the application
          |
          v
2. Browser loads React application
          |
          v
3. User logs in
          |
          v
4. Backend validates credentials
          |
          v
5. Backend reads user role
          |
          v
6. Backend generates JWT
          |
          v
7. Browser stores JWT
          |
          v
8. React requests /api/todos
          |
          v
9. Request is sent to Flask Backend
          |
          v
10. Flask validates JWT
          |
          v
11. Backend identifies authenticated user
          |
          v
12. PostgreSQL returns user's tasks
          |
          v
13. Backend returns API response
          |
          v
14. React displays tasks
```

An administrator request follows the same authentication flow, followed by an additional role check before an admin endpoint is executed.

---

## Deployment Flow

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

## Architecture Summary

The V3 application consists of:

- React + Vite frontend
- Nginx web server
- Flask REST API backend
- Gunicorn application server
- PostgreSQL database hosted on Supabase
- JWT-based authentication
- Admin/User role-based authorization
- User-specific task isolation
- Task priority management
- Administrator task assignment
- Docker containers
- Docker Compose for local orchestration
- Docker Hub for container images
- Render for cloud deployment

The architecture separates frontend, backend, and database responsibilities while keeping the application simple enough to develop, test, containerize, and deploy.

V3 is currently frozen at this application stage. Future features can be developed in a later version without changing the V3 baseline.
