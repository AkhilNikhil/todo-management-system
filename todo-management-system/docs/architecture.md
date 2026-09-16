# Application Architecture

## Overview

My Tasks is a containerized full-stack task management application built using React, Flask, PostgreSQL, Docker, and Docker Compose.

The application is divided into separate frontend and backend services. PostgreSQL is used as the persistent database and is hosted on Supabase.

The application uses JWT authentication to identify users and ensure that each user can access only their own tasks.

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
                           | /api
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
                            | HTTPS /api
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

## Components

### Frontend

The frontend is developed using React and Vite.

Responsibilities:

- Display the application interface
- Handle user registration and login
- Store the JWT access token
- Send authenticated API requests
- Display the user's tasks
- Create, update, complete, and delete tasks
- Communicate with the backend through `/api`

The frontend is built into static files and served using Nginx.

### Nginx

Nginx is used as the web server inside the frontend container.

Responsibilities:

- Serve the React application
- Handle frontend routes
- Forward `/api` requests to the Flask backend
- Provide the entry point for browser requests

Local requests follow this flow:

```text
Browser
   |
   v
Nginx
   |
   | /api
   v
Flask Backend
```

In the cloud deployment, Nginx forwards `/api` requests to the deployed Render backend over HTTPS.

### Backend

The backend is developed using Python and Flask.

Responsibilities:

- Provide REST API endpoints
- Register users
- Authenticate users
- Generate JWT access tokens
- Validate JWT tokens
- Identify the authenticated user
- Create and manage tasks
- Enforce user-specific task access
- Communicate with PostgreSQL

Gunicorn is used as the production WSGI server.

### Database

The application uses PostgreSQL for persistent data storage.

The PostgreSQL database is hosted on Supabase.

The main tables are:

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
   | User found
   v
Flask Backend
   |
   | Generate JWT
   v
Browser
```

The frontend stores the JWT access token and sends it with protected API requests.

## Protected API Request Flow

```text
Browser
   |
   | Authorization: Bearer <JWT_TOKEN>
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
   | user_id
   v
PostgreSQL
```

The backend obtains the authenticated user's identity from the verified JWT token.

The backend does not rely on an arbitrary user ID supplied by the frontend.

## Task Data Isolation

Each task is associated with a user through the `user_id` column.

```text
                    users
                      |
                      | 1
                      |
                      | many
                      v
                    todos
```

Example:

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

When a user requests their tasks, the backend uses the authenticated user's ID to query the database.

Therefore, a user can only access tasks belonging to their own account.

## Database Relationship

The `todos.user_id` column is a foreign key referencing `users.id`.

```text
users.id
   |
   | referenced by
   v
todos.user_id
```

The relationship is:

```text
One User
   |
   +---- Many Todos
```

The foreign key uses `ON DELETE CASCADE`.

If a user is deleted, the tasks associated with that user are also deleted.

## API Communication

The frontend communicates with the backend using HTTP requests.

The main API routes are:

```text
POST   /api/auth/register
POST   /api/auth/login

GET    /api/todos
POST   /api/todos
PUT    /api/todos/<id>
DELETE /api/todos/<id>
```

Protected Todo requests include the JWT token in the `Authorization` header.

```http
Authorization: Bearer <JWT_TOKEN>
```

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
akhilbm/todo-frontend:2.2
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
akhilbm/todo-backend:2.0
```

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
|             | /api        |
|             v             |
|  +---------------------+  |
|  | Backend Container   |  |
|  | Flask + Gunicorn    |  |
|  +----------+----------+  |
|             |             |
+-------------|-------------+
              |
              | PostgreSQL
              v
      Supabase PostgreSQL
```

The frontend and backend communicate through the Docker Compose network.

The PostgreSQL database is external to the application containers.

## Data Persistence

Application data is stored in Supabase PostgreSQL.

The database is not stored inside the frontend or backend containers.

Therefore, restarting or recreating the application containers does not remove the registered users or tasks stored in PostgreSQL.

The database persistence was verified by restarting the application and confirming that previously created data remained available.

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

The frontend service serves the React application and forwards `/api` requests to the backend.

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

The backend connects to Supabase PostgreSQL using the `DATABASE_URL` environment variable.

## Environment Configuration

The backend uses environment variables for configuration.

```env
DATABASE_URL=your-postgresql-connection-string
JWT_SECRET_KEY=your-secret-key
```

The values are provided locally through the `.env` file and configured separately in the Render backend service.

Sensitive credentials are not stored in the Git repository.

## Request Flow

A typical task request follows this flow:

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
5. Backend generates JWT
          |
          v
6. Browser stores JWT
          |
          v
7. Browser requests /api/todos
          |
          v
8. Nginx forwards request
          |
          v
9. Flask validates JWT
          |
          v
10. Backend identifies user
          |
          v
11. PostgreSQL returns user's tasks
          |
          v
12. Backend returns API response
          |
          v
13. React displays tasks
```

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

## Architecture Summary

The application consists of:

- React + Vite frontend
- Nginx web server and reverse proxy
- Flask REST API backend
- Gunicorn application server
- PostgreSQL database hosted on Supabase
- JWT-based authentication
- User-specific task isolation
- Docker containers
- Docker Compose for local orchestration
- Docker Hub for container images
- Render for cloud deployment

The architecture separates the frontend, backend, and database responsibilities while keeping the application simple enough to develop, test, containerize, and deploy.