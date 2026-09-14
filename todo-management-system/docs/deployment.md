# Deployment Guide

## Prerequisites

The V1 application requires:

- Docker Desktop
- Git
- Docker Compose

## Environment Configuration

Create a `.env` file in the project root.

Example:

```env
JWT_SECRET_KEY=your-secret-key
```

Do not commit `.env` to Git.

The repository contains `.env.example` as a template.

## Start the Application

From the project root:

```bash
docker compose up -d
```

Docker Compose starts the frontend and backend containers.

## Check Container Status

Run:

```bash
docker compose ps
```

The frontend and backend containers should show a running status.

## Access the Application

Open a browser and visit:

```text
http://localhost
```

The frontend is exposed on port 80.

## Docker Networking

The frontend and backend communicate through the Docker network created by Docker Compose.

The backend port is not exposed directly to the host.

Nginx receives `/api` requests and forwards them to the backend container.

## Docker Hub Images

V1 uses the following Docker Hub images:

```text
akhilbm/todo-backend:1.1
akhilbm/todo-frontend:1.1
```

Docker Compose pulls the images from Docker Hub when they are not available locally.

## View Logs

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

Follow logs in real time:

```bash
docker compose logs -f
```

## Stop the Application

Stop the containers:

```bash
docker compose down
```

The `todo-data` named volume is retained when using `docker compose down`.

## Data Persistence

The SQLite database is stored in the Docker named volume:

```text
todo-data
```

The volume is mounted inside the backend container at:

```text
/app/instance/data
```

This allows the SQLite database to survive normal container recreation.

## V1 Deployment Flow

```text
Docker Hub
   |
   | Pull Images
   v
Docker Compose
   |
   +--------------------+
   |                    |
   v                    v
Frontend              Backend
React + Nginx         Flask + Gunicorn
   |                    |
   +------ Docker ------+
          Network
             |
             v
           SQLite
             |
             v
       todo-data Volume
```

## V1 Deployment Status

The application has been tested locally using Docker Compose and the Docker Hub images.

The complete user workflow has been verified:

- Registration
- Login
- Add task
- Complete task
- Undo completion
- Delete task
- Logout
- Login again