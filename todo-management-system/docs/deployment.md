# Deployment Documentation

## Overview

The My Tasks application is deployed using Docker containers, Docker Hub, Render, and Supabase PostgreSQL.

The deployment consists of:

- React + Vite frontend
- Nginx web server and reverse proxy
- Flask backend
- Gunicorn application server
- PostgreSQL database hosted on Supabase
- Docker container images
- Docker Hub container registry
- Render cloud services

The frontend and backend are deployed as separate Render services.

---

# Deployment Architecture

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
                            | HTTPS /api
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

The database contains two main tables:

```text
users
├── id
├── email
├── password_hash
└── created_at

todos
├── id
├── title
├── description
├── completed
├── user_id
├── created_at
└── updated_at
```

The `todos.user_id` column references `users.id`.

The database is external to the application containers.

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

Build the backend image:

```bash
docker build -t akhilbm/todo-backend:2.0 ./backend
```

Verify the image:

```bash
docker images
```

---

## Frontend Image

Build the frontend image:

```bash
docker build -t akhilbm/todo-frontend:2.2 ./frontend
```

Verify the image:

```bash
docker images
```

---

# Docker Hub

The Docker images are stored in Docker Hub.

Backend image:

```text
akhilbm/todo-backend:2.0
```

Frontend image:

```text
akhilbm/todo-frontend:2.2
```

Log in to Docker Hub:

```bash
docker login
```

Push the backend image:

```bash
docker push akhilbm/todo-backend:2.0
```

Push the frontend image:

```bash
docker push akhilbm/todo-frontend:2.2
```

These images can then be pulled by deployment platforms such as Render.

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

The backend runs internally on port 5000 and is not directly exposed to the host.

Requests to:

```text
/api
```

are forwarded by Nginx to the backend service.

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
- Forwards `/api` requests to the backend

---

# Render Backend Deployment

The backend is deployed as a separate Render service.

## Backend Configuration

```text
Service Type: Web Service
Image: akhilbm/todo-backend:2.0
Port: 10000
Health Check: /
```

The Render backend receives its runtime port through the `PORT` environment variable.

The backend environment variables are configured in Render:

```env
DATABASE_URL=your-postgresql-connection-string
JWT_SECRET_KEY=your-secret-key
```

The backend connects to Supabase PostgreSQL using `DATABASE_URL`.

---

# Render Frontend Deployment

The frontend is deployed as a separate Render service.

## Frontend Configuration

```text
Service Type: Web Service
Image: akhilbm/todo-frontend:2.2
Port: 80
Health Check: /
```

The frontend does not require database credentials.

Nginx serves the React application and forwards `/api` requests to the deployed backend.

---

# Nginx Cloud Configuration

For the cloud deployment, Nginx forwards `/api` requests to the Render backend.

```nginx
location /api/ {
    proxy_pass https://todo-backend-2-0.onrender.com;
    proxy_ssl_server_name on;
    proxy_ssl_name todo-backend-2-0.onrender.com;

    proxy_set_header Host todo-backend-2-0.onrender.com;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

This allows the browser to communicate with the application through the frontend URL without directly calling the backend service.

---

# Cloud URLs

Frontend:

```text
https://todo-frontend-2-2.onrender.com
```

Backend:

```text
https://todo-backend-2-0.onrender.com
```

The backend root endpoint can be used as a basic health check:

```text
https://todo-backend-2-0.onrender.com/
```

Expected response:

```json
{
  "message": "Todo API is running"
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

# Deployment Verification

After deployment, verify the following.

## 1. Backend Health Check

Open:

```text
https://todo-backend-2-0.onrender.com/
```

The API should return:

```json
{
  "message": "Todo API is running"
}
```

---

## 2. Frontend Check

Open:

```text
https://todo-frontend-2-2.onrender.com
```

The My Tasks application should load successfully.

---

## 3. User Registration

Create a new user through the frontend.

Verify that registration completes successfully.

---

## 4. User Login

Log in using the registered account.

Verify that the backend returns a JWT access token and the application displays the user's tasks.

---

## 5. Task Creation

Create a new task.

Verify that the task appears in the task list.

---

## 6. Task Persistence

Restart or redeploy the application containers/services.

Log in again and verify that previously created tasks are still available.

The persistence is provided by Supabase PostgreSQL.

---

## 7. User Isolation

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

The backend uses the authenticated user's ID from the JWT token to restrict task access.

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
- Database credentials are stored in environment variables.
- JWT secret is stored in an environment variable.
- Sensitive credentials are not committed to Git.
- The backend container is not directly exposed to the host in the local Docker Compose setup.
- Nginx provides the frontend entry point and reverse proxy.
- User task access is restricted using the authenticated user's identity.

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

## Frontend Returns 502

Check the frontend Nginx configuration.

Verify that the `/api/` proxy points to the correct backend URL.

For the cloud deployment, the proxy should use the HTTPS Render backend URL.

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

---

# Deployment Summary

The application is deployed using a container-based architecture.

```text
React + Vite
     |
     v
Nginx
     |
     v
Flask + Gunicorn
     |
     v
Supabase PostgreSQL
```

Docker provides application containerization, Docker Hub stores the container images, and Render hosts the frontend and backend services.

Supabase PostgreSQL provides persistent storage for users and tasks.