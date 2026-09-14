# My Tasks - Personal Task Manager

A Dockerized full-stack task management application built with React, Flask, SQLite, and Docker.

## Features

- User registration and login
- JWT-based authentication
- Create tasks
- Mark tasks as completed
- Undo task completion
- Delete tasks
- User-specific task data
- Dockerized frontend and backend
- Nginx reverse proxy
- SQLite database
- Docker named volume for data persistence
- Docker Hub images

## Architecture

```text
Browser
   |
   v
Frontend Container
React + Nginx
   |
   | /api
   v
Backend Container
Flask + Gunicorn
   |
   v
SQLite Database
   |
   v
Docker Named Volume
```

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | React + Vite |
| Web Server | Nginx |
| Backend | Python + Flask |
| Application Server | Gunicorn |
| Database | SQLite |
| Authentication | JWT |
| Containerization | Docker |
| Orchestration | Docker Compose |
| Image Registry | Docker Hub |

## Project Structure

```text
todo-management-system/
├── backend/
├── frontend/
├── docs/
│   ├── architecture.md
│   ├── api.md
│   └── deployment.md
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

## Docker Hub Images

Backend:

```text
akhilbm/todo-backend:1.1
```

Frontend:

```text
akhilbm/todo-frontend:1.1
```

## Environment Configuration

Create a `.env` file in the project root.

Example:

```env
JWT_SECRET_KEY=your-secret-key
```

Do not commit the `.env` file to Git.

The repository provides `.env.example` as a template.

## Running the Application

Start the application:

```bash
docker compose up -d
```

Check the containers:

```bash
docker compose ps
```

Open the application in a browser:

```text
http://localhost
```

## Useful Docker Commands

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

Follow logs:

```bash
docker compose logs -f
```

Stop the application:

```bash
docker compose down
```

## Authentication and Data Isolation

Users register and log in using their email and password.

Passwords are hashed before being stored.

After successful login, the backend generates a JWT access token.

The authenticated user's ID is obtained from the verified JWT.

Tasks are associated with the authenticated user through the `user_id` field.

This ensures that users can access only their own tasks.

## Data Persistence

The V1 application uses SQLite.

The database is stored at:

```text
/app/instance/data/todo.db
```

Docker Compose mounts a named volume called `todo-data` to this location.

This allows the database to persist when the backend container is recreated.

## API Documentation

See [API Documentation](docs/api.md).

## Architecture Documentation

See [Architecture Documentation](docs/architecture.md).

## Deployment Documentation

See [Deployment Guide](docs/deployment.md).

## V1 Status

V1 is a working Dockerized full-stack task management application.

The following workflow has been tested:

- Registration
- Login
- Add task
- Complete task
- Undo task completion
- Delete task
- Logout
- Login again