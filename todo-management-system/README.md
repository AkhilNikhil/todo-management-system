
# My Tasks – Personal Task Manager

A containerized full-stack task management application built with React, Flask, PostgreSQL, JWT authentication, Docker, and Docker Compose.

The application allows users to register, log in, and manage their own tasks. Each user's tasks are isolated so one user cannot access another user's data.

## Features

- User registration and login
- JWT-based authentication
- Create, view, update, and delete tasks
- Mark tasks as completed or incomplete
- User-specific task isolation
- PostgreSQL database
- React frontend with Vite
- Flask REST API
- Gunicorn production server
- Nginx reverse proxy
- Dockerized frontend and backend
- Docker Compose for local multi-container deployment
- Docker Hub image publishing
- Cloud deployment using Render
- Persistent data using Supabase PostgreSQL

## Architecture

### Local Docker Architecture

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
   v
Supabase PostgreSQL
```

### Cloud Architecture

```text
Browser
   |
   v
Render Frontend Service
React + Nginx
   |
   | HTTPS /api
   v
Render Backend Service
Flask + Gunicorn
   |
   | PostgreSQL connection
   v
Supabase PostgreSQL
```

The frontend and backend are independently containerized and deployed as separate services.

## Technology Stack

### Frontend

- React
- Vite
- JavaScript
- HTML
- CSS
- Nginx

### Backend

- Python
- Flask
- Flask-SQLAlchemy
- Flask-JWT-Extended
- Flask-CORS
- Gunicorn

### Database

- PostgreSQL
- Supabase

### DevOps

- Docker
- Docker Compose
- Docker Hub
- Git
- GitHub
- Render

## Project Structure

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
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   │
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.js
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## Backend API

### Authentication

#### Register

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

#### Login

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

The login endpoint returns a JWT access token.

### Todo APIs

All Todo endpoints require a valid JWT access token.

#### Get Tasks

```http
GET /api/todos
```

#### Create Task

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

#### Update Task

```http
PUT /api/todos/<id>
```

#### Delete Task

```http
DELETE /api/todos/<id>
```

### Authentication Header

Protected API requests use:

```http
Authorization: Bearer <JWT_TOKEN>
```

The backend identifies the authenticated user from the JWT token and only returns or modifies that user's tasks.

## Database

The application uses PostgreSQL hosted on Supabase.

### Users Table

```text
users
├── id
├── email
├── password_hash
└── created_at
```

### Todos Table

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

The `user_id` column creates the relationship between users and their tasks.

```text
User
  |
  | 1
  |
  | many
  v
Todos
```

A foreign key with `ON DELETE CASCADE` ensures that tasks belonging to a deleted user are also removed.

## Environment Variables

Create a `.env` file inside the `backend` directory for local development.

Example:

```env
DATABASE_URL=your-postgresql-connection-string
JWT_SECRET_KEY=your-secret-key
```

Do not commit the `.env` file to GitHub.

The `.env` file is ignored through `.gitignore`.

## Running Locally with Docker Compose

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

View frontend logs:

```bash
docker compose logs frontend
```

View backend logs:

```bash
docker compose logs backend
```

Stop the application:

```bash
docker compose down
```

The application can then be accessed through:

```text
http://localhost
```

The backend is not directly exposed to the host. API requests are routed through the Nginx reverse proxy using `/api`.

## Docker Images

The application images are published to Docker Hub.

### Backend

```text
akhilbm/todo-backend:2.0
```

### Frontend

```text
akhilbm/todo-frontend:2.2
```

The frontend image uses Nginx to serve the React application and proxy `/api` requests to the backend service.

## Docker Compose

Docker Compose runs the frontend and backend as separate containers.

The frontend communicates with the backend through the Docker network.

```text
Frontend
   |
   | /api
   v
Backend
```

The database is hosted externally on Supabase PostgreSQL.

## User Data Isolation

The application implements user-specific task access using JWT authentication.

When a user logs in, the backend generates a JWT token.

For protected requests:

```text
Browser
   |
   | JWT Token
   v
Flask Backend
   |
   | Identify authenticated user
   v
PostgreSQL
```

Tasks are associated with the authenticated user's `user_id`.

Therefore:

```text
User 1
  └── Task A
  └── Task B

User 2
  └── Task C
  └── Task D
```

User 1 cannot retrieve, modify, or delete User 2's tasks through the application API.

## Data Persistence

PostgreSQL provides persistent storage for application data.

The task data is stored in the external Supabase PostgreSQL database instead of container-local storage.

This means application containers can be restarted or redeployed without losing registered users or tasks.

Persistence was verified by:

1. Creating a user.
2. Creating tasks.
3. Restarting the application.
4. Logging in again.
5. Confirming that the previously created tasks were still available.

## Cloud Deployment

The application is deployed using separate Render services.

### Backend Service

```text
Service: todo-backend-v2
Platform: Render
Runtime: Docker
Database: Supabase PostgreSQL
```

Environment variables configured on Render:

```text
DATABASE_URL
JWT_SECRET_KEY
```

The backend uses Gunicorn and the Render-provided `PORT` environment variable.

### Frontend Service

```text
Service: todo-frontend-v2
Platform: Render
Runtime: Docker
Web Server: Nginx
```

The frontend Nginx configuration forwards `/api` requests to the deployed backend service over HTTPS.

## Deployment Flow

```text
Developer
    |
    v
GitHub
    |
    v
Docker Build
    |
    v
Docker Hub
    |
    +--------------------+
    |                    |
    v                    v
Backend Image       Frontend Image
    |                    |
    v                    v
Render Backend      Render Frontend
    |                    |
    +--------+-----------+
             |
             v
       Supabase PostgreSQL
```

## Testing

The application was tested locally and in the deployed environment.

### Authentication Testing

- User registration
- User login
- JWT token generation
- Protected API access
- Unauthorized request handling

### Task Testing

- Create task
- View tasks
- Update task
- Mark task completed/incomplete
- Delete task

### User Isolation Testing

Two separate users were created and tested.

```text
User 1 → Own tasks only
User 2 → Own tasks only
```

A request from User 2 to retrieve tasks returned only User 2's tasks.

### Persistence Testing

Application containers were restarted and previously stored PostgreSQL data remained available.

## Security Considerations

- Passwords are stored as password hashes rather than plain text.
- JWT authentication protects task APIs.
- User identity is obtained from the JWT token.
- Backend does not trust arbitrary user IDs supplied by the frontend.
- Database credentials are stored using environment variables.
- `.env` is excluded from Git.
- Backend is not directly exposed through the frontend deployment.
- HTTPS is used between the deployed frontend and backend services.

## V2 Status

The V2 implementation includes:

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

**V2 is complete.
