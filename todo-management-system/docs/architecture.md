# Architecture

## Overview

The application is a Dockerized full-stack task management system.

It consists of:

- React frontend
- Nginx web server and reverse proxy
- Flask backend
- Gunicorn application server
- SQLite database
- Docker containers
- Docker Compose

## Application Flow

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

## Frontend

The frontend is built using React and Vite.

The production frontend is served by Nginx inside the frontend Docker container.

Nginx serves the React application and reverse-proxies `/api` requests to the backend container.

The frontend container exposes port 80.

## Backend

The backend is built using Python and Flask.

Gunicorn is used as the application server inside the Docker container.

The backend listens on port 5000 inside the Docker network.

The backend port is not directly exposed to the host.

## Authentication

The application uses JWT authentication.

Users register using an email and password.

Passwords are hashed before storage.

After successful login, the backend generates a JWT access token.

Protected API requests require the JWT token.

## User Data Isolation

Each task belongs to a user through the `user_id` field.

The backend obtains the authenticated user's ID from the verified JWT.

Task operations use this authenticated user ID.

This prevents one user from accessing another user's tasks.

## Database

V1 uses SQLite.

The database is stored inside the backend container at:

```text
/app/instance/data/todo.db
```

Docker Compose mounts the `todo-data` named volume to this directory.

## Docker Architecture

### Frontend Container

- React application
- Nginx
- Port 80

### Backend Container

- Flask application
- Gunicorn
- Port 5000

The two containers communicate through the Docker network created by Docker Compose.

## Docker Hub

The V1 application uses these Docker Hub images:

```text
akhilbm/todo-backend:1.1
akhilbm/todo-frontend:1.1
```

Docker Compose uses these images to run the application.

## Data Persistence

The `todo-data` Docker named volume stores the SQLite database separately from the backend container.

Normal container recreation does not remove the named volume.

## V1 Architecture Summary

```text
                 Browser
                    |
                    v
          Frontend Container
             React + Nginx
                    |
                 /api
                    |
                    v
          Backend Container
            Flask + Gunicorn
                    |
                    v
             SQLite Database
                    |
                    v
            Docker Volume
```