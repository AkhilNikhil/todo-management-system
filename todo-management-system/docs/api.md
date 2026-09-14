# API Documentation

The backend provides REST API endpoints for authentication and task management.

## Base URL

When running locally:

```text
http://localhost/api
```

## Authentication

Authentication uses JSON Web Tokens (JWT).

Protected endpoints require the JWT access token in the request header:

```text
Authorization: Bearer <token>
```

## Authentication Endpoints

### Register

Creates a new user account.

```text
POST /api/auth/register
```

Request:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Login

Authenticates an existing user and returns a JWT access token.

```text
POST /api/auth/login
```

Request:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "access_token": "<jwt-token>"
}
```

## Todo Endpoints

All todo endpoints require authentication.

### Get Todos

Returns tasks belonging to the authenticated user.

```text
GET /api/todos
```

Header:

```text
Authorization: Bearer <token>
```

### Create Todo

Creates a new task for the authenticated user.

```text
POST /api/todos
```

Request:

```json
{
  "title": "Learn Docker",
  "description": "Practice Docker containers"
}
```

### Update Todo

Updates an existing task.

```text
PUT /api/todos/<id>
```

Request:

```json
{
  "title": "Learn Docker",
  "description": "Practice Docker and Compose",
  "completed": true
}
```

### Delete Todo

Deletes a task belonging to the authenticated user.

```text
DELETE /api/todos/<id>
```

## Data Isolation

The backend identifies the user from the verified JWT token.

Todo operations are filtered using the authenticated user's ID.

Therefore, a user cannot retrieve, update, or delete another user's tasks.

## API Summary

| Method | Endpoint | Authentication | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register user |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/todos` | Yes | Get user's tasks |
| POST | `/api/todos` | Yes | Create task |
| PUT | `/api/todos/<id>` | Yes | Update task |
| DELETE | `/api/todos/<id>` | Yes | Delete task |