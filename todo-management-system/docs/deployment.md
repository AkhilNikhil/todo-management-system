# Deployment Documentation

## Overview

The My Tasks application is deployed using Docker containers, Docker Hub, Render, and Supabase PostgreSQL.

The V3 deployment consists of:

- React + Vite frontend
- Nginx web server
- Flask backend
- Gunicorn application server
- PostgreSQL database hosted on Supabase
- Docker container images
- Docker Hub container registry
- Render cloud services
- JWT authentication
- User and Admin roles

The frontend and backend are deployed as separate Render services.

---

# Deployment Architecture

## V3 Cloud Architecture

```text
                         Browser
                            |
                            | HTTPS
                            v
                 +----------------------+
                 |   Render Frontend    |
                 |----------------------|
                 | React + Vite         |
                 | Nginx                |
                 +----------+-----------+
                            |
                            | HTTPS API requests
                            v
                 +----------------------+
                 |   Render Backend     |
                 |----------------------|
                 | Flask                |
                 | Gunicorn             |
                 +----------+-----------+
                            |
                            | PostgreSQL
                            v
                 +----------------------+
                 | Supabase PostgreSQL  |
                 |      Database        |
                 +----------------------+
```

In V3, the React application calls the Render backend directly over HTTPS.

Nginx serves the frontend application. It is not used as the cloud API gateway.

---

# Prerequisites

The following tools and services are required:

- Git
- GitHub account
- Docker
- Docker Compose
- Docker Hub account
- Supabase account
- Render account

---

# Project Structure

The project is organized as follows:

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
│   ├── public/
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
└── README.md
```

---

# Database Deployment

The application uses PostgreSQL hosted on Supabase.

The database contains two main tables.

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

The `todos.user_id` column references `users.id`.

The `todos.assigned_by` column also references `users.id` and records the administrator who assigned a task when applicable.

The `assigned_by` relationship uses `ON DELETE SET NULL`.

The `user_id` relationship uses `ON DELETE CASCADE`.

The database is external to the application containers, so application container recreation does not remove stored users or tasks.

---

# Environment Variables

The backend requires environment variables for database and authentication configuration.

```env
DATABASE_URL=your-postgresql-connection-string
JWT_SECRET_KEY=your-secret-key
```

The actual values are not stored in Git.

For local development, the values are provided through the `.env` file.

For cloud deployment, the values are configured as environment variables in the Render backend service.

---

# Docker Image Build

The application uses separate Docker images for the frontend and backend.

## Backend Image

Build the V3 backend image:

```bash
docker build -t akhilbm/todo-backend:3.0 ./backend
```

Verify the image:

```bash
docker images
```

## Frontend Image

Build the V3 frontend image:

```bash
docker build -t akhilbm/todo-frontend:3.1 ./frontend
```

Verify the image:

```bash
docker images
```

---

# Docker Hub

The V3 images are stored in Docker Hub.

Backend image:

```text
akhilbm/todo-backend:3.0
```

Frontend image:

```text
akhilbm/todo-frontend:3.1
```

Log in to Docker Hub:

```bash
docker login
```

Push the backend image:

```bash
docker push akhilbm/todo-backend:3.0
```

Push the frontend image:

```bash
docker push akhilbm/todo-frontend:3.1
```

These images are used by the Render deployment.

---

# Local Docker Compose Deployment

Docker Compose is used to run the frontend and backend services locally.

Start the application:

```bash
docker compose up -d
```

Check running containers:

```bash
docker compose ps
```

View logs:

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

---

# Local Application Access

After starting Docker Compose, open:

```text
http://localhost
```

The frontend is exposed through port 80.

The backend container listens on port 5000.

The current `docker-compose.yml` maps the backend to host port 5000 and the frontend to host port 80.

The V3 React frontend uses the deployed Render backend URL for its API requests.

Therefore, local frontend execution and local backend container execution can be tested independently.

---

# Backend Container

The backend container runs:

```text
Flask
   |
   v
Gunicorn
   |
   v
Port 5000
```

The Docker image uses Gunicorn as the production WSGI server.

The container command is configured to use the `PORT` environment variable when provided by the deployment platform.

```text
gunicorn --bind 0.0.0.0:${PORT:-5000} run:app
```

The backend provides:

```text
GET /api/health
```

Expected response:

```json
{
  "status": "healthy"
}
```

---

# Frontend Container

The frontend uses a multi-stage Docker build.

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

Nginx:

- Serves the React application
- Handles frontend routes
- Provides the frontend web server

In the current V3 cloud configuration, Nginx does not proxy `/api` requests to the backend.

The React application communicates directly with the Render backend.

---

# Render Backend Deployment

The V3 backend is deployed as a separate Render service.

## Backend Configuration

```text
Service Type: Web Service
Image: akhilbm/todo-backend:3.0
Region: Singapore
Plan: Free
Health Check: /api/health
```

The backend receives its runtime port through the `PORT` environment variable.

The backend environment variables are configured in Render:

```env
DATABASE_URL=your-postgresql-connection-string
JWT_SECRET_KEY=your-secret-key
```

The backend connects to Supabase PostgreSQL using `DATABASE_URL`.

Backend service:

```text
todo-backend:3.0-1
```

Backend URL:

```text
https://todo-backend-3-0-1.onrender.com
```

Health endpoint:

```text
https://todo-backend-3-0-1.onrender.com/api/health
```

---

# Render Frontend Deployment

The V3 frontend is deployed as a separate Render service.

## Frontend Configuration

```text
Service Type: Web Service
Image: akhilbm/todo-frontend:3.1
Region: Singapore
Plan: Free
Port: 80
```

Render frontend service:

```text
task-management-system
```

Frontend URL:

```text
https://task-management-system-ri71.onrender.com
```

The frontend does not require database credentials.

Nginx serves the React application.

The React application calls the Render backend directly using HTTPS.

---

# V3 API Communication

The frontend uses the deployed backend URL:

```text
https://todo-backend-3-0-1.onrender.com
```

API requests are made under:

```text
https://todo-backend-3-0-1.onrender.com/api/...
```

Example:

```text
GET https://todo-backend-3-0-1.onrender.com/api/health
```

Example authenticated endpoint:

```text
GET https://todo-backend-3-0-1.onrender.com/api/todos
```

The browser sends the JWT in the `Authorization` header for protected requests.

---

# Cloud URLs

Frontend:

```text
https://task-management-system-ri71.onrender.com
```

Backend:

```text
https://todo-backend-3-0-1.onrender.com
```

Backend health endpoint:

```text
https://todo-backend-3-0-1.onrender.com/api/health
```

Expected health response:

```json
{
  "status": "healthy"
}
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
    +-----------------------+
    |                       |
    v                       v
Backend Image          Frontend Image
    |                       |
    v                       v
Docker Hub              Docker Hub
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

# V3 Deployment Features

The V3 deployment includes:

- React + Vite frontend
- Flask backend
- Gunicorn
- Docker containerization
- Docker Compose for local services
- Docker Hub image registry
- Render frontend deployment
- Render backend deployment
- Supabase PostgreSQL
- JWT authentication
- User and Admin roles
- Admin authorization
- Admin user listing
- Admin task listing
- Admin task assignment
- Task priorities
- Assignment tracking through `assigned_by`
- Backend health check

---

# Deployment Verification

After deployment, verify the following.

## 1. Backend Health Check

Open:

```text
https://todo-backend-3-0-1.onrender.com/api/health
```

The API should return:

```json
{
  "status": "healthy"
}
```

---

## 2. Frontend Check

Open:

```text
https://task-management-system-ri71.onrender.com
```

The My Tasks application should load successfully.

---

## 3. User Registration

Create a new user through the frontend.

Verify that registration completes successfully.

Newly registered users receive the default `user` role.

---

## 4. User Login

Log in using the registered account.

Verify that:

- Login succeeds.
- A JWT access token is returned.
- The user's role is returned.
- The application displays the user's tasks.

---

## 5. Task Creation

Create a new task.

Verify that:

- The task appears in the task list.
- The task receives the default `Medium` priority.
- The task is associated with the authenticated user.

---

## 6. Task Updates

Update a task.

Verify that:

- Title updates correctly.
- Description updates correctly.
- Completion status changes correctly.

---

## 7. Task Persistence

Restart or redeploy the application containers/services.

Log in again and verify that previously created tasks are still available.

The persistence is provided by Supabase PostgreSQL.

---

## 8. User Isolation

Create a second user account.

Verify that the second user does not see the first user's tasks.

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

The backend uses the authenticated user's ID from the JWT token to restrict normal task access.

---

## 9. Admin Access

Log in using an administrator account.

Verify that administrator-only operations are available.

Test:

```text
GET /api/admin/test
GET /api/admin/users
GET /api/admin/tasks
POST /api/admin/tasks
```

Regular users should receive:

```json
{
  "message": "Admin access required"
}
```

when attempting to access admin endpoints.

---

## 10. Admin Task Assignment

From the admin interface, assign a task to a user.

Verify that:

- The selected user receives the task.
- The selected priority is stored.
- The assignment is recorded through `assigned_by`.
- The task appears in the user's task list.

---

# Useful Docker Commands

List Docker images:

```bash
docker images
```

List running containers:

```bash
docker ps
```

List all containers:

```bash
docker ps -a
```

Stop a container:

```bash
docker stop <container-name>
```

Start a stopped container:

```bash
docker start <container-name>
```

Remove a container:

```bash
docker rm <container-name>
```

Remove an image:

```bash
docker rmi <image-name>
```

View container logs:

```bash
docker logs <container-name>
```

Inspect a container:

```bash
docker inspect <container-name>
```

---

# Useful Docker Compose Commands

Start services:

```bash
docker compose up -d
```

Stop services:

```bash
docker compose down
```

Rebuild services:

```bash
docker compose build
```

Rebuild and start:

```bash
docker compose up -d --build
```

View service status:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs
```

Follow logs:

```bash
docker compose logs -f
```

---

# Deployment Security

The following security practices are used:

- Passwords are stored as password hashes.
- JWT authentication protects task endpoints.
- Admin authorization protects administrator endpoints.
- Database credentials are stored in environment variables.
- JWT secret is stored in an environment variable.
- Sensitive credentials are not committed to Git.
- Normal task access is restricted using the authenticated user's identity.
- HTTPS is used for deployed frontend-to-backend API communication.

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

The persistence was verified by restarting the application and confirming that previously created data remained available.

---

# Troubleshooting

## Backend Container Is Not Starting

Check the container logs:

```bash
docker logs <backend-container>
```

Verify:

- `DATABASE_URL` is configured.
- `JWT_SECRET_KEY` is configured.
- Required Python dependencies are installed.
- Gunicorn starts successfully.

---

## Frontend Does Not Load

Check the frontend container:

```bash
docker ps
```

Check frontend logs:

```bash
docker logs <frontend-container>
```

Verify that Nginx is running and port 80 is available.

---

## Frontend Cannot Reach Backend

For V3 cloud deployment, verify that the React frontend is configured with:

```text
https://todo-backend-3-0-1.onrender.com
```

Check the browser developer console for API errors.

Verify the backend health endpoint:

```text
https://todo-backend-3-0-1.onrender.com/api/health
```

---

## Database Connection Error

Verify the `DATABASE_URL` value.

Check that:

- The PostgreSQL connection string is correct.
- The Supabase project is available.
- The backend has access to the database.
- The environment variable is configured correctly.

---

## Authentication Error

If protected API requests return `401 Unauthorized`, verify:

- The user has logged in.
- A JWT token was returned.
- The token is included in the `Authorization` header.
- The header uses the following format:

```http
Authorization: Bearer <JWT_TOKEN>
```

If an admin endpoint returns `403 Forbidden`, verify that the authenticated user's database role is `admin`.

---

# V3 Deployment Summary

The V3 application is deployed using a container-based architecture.

```text
React + Vite
     |
     v
Nginx
     |
     v
Render Frontend
     |
     | HTTPS API
     v
Render Backend
     |
     v
Flask + Gunicorn
     |
     v
Supabase PostgreSQL
```

Docker provides application containerization, Docker Hub stores the container images, and Render hosts the frontend and backend services.

Supabase PostgreSQL provides persistent storage for users and tasks.

V3 is considered the current frozen application version. Future features can be developed from this baseline without changing the V3 deployment documentation.
