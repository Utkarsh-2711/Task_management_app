# Task Management System

A small task management system built with React, Node.js, Express, and MySQL.

## Project Structure

```text
frontend/   React + Vite application
backend/    Express REST API
database/   MySQL schema
```

## Requirements

- Node.js 18 or newer
- MySQL 8 or newer

## Setup

### 1. Configure MySQL

Make sure the local MySQL server is running. The backend reads its connection settings from `backend/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=task_management
```

On startup, the backend runs `database/schema.sql` automatically. It creates the database and both tables if they do not already exist.

### 2. Start the backend

```powershell
cd backend
npm install
npm run dev
```

The API runs at `http://localhost:5000`.

### 3. Start the frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

## Database Relationship

One project can contain many tasks. Each task has a required `project_id` foreign key pointing to `projects.id`. The relationship is:

```text
projects (1) -------- (many) tasks
```

Deleting a project cascades to its tasks through `ON DELETE CASCADE`.

## API Endpoints

### Projects

| Method | Endpoint            | Description                    |
| ------ | ------------------- | ------------------------------ |
| POST   | `/api/projects`     | Create a project               |
| GET    | `/api/projects`     | List projects                  |
| GET    | `/api/projects/:id` | Get one project with its tasks |
| PUT    | `/api/projects/:id` | Update a project               |
| DELETE | `/api/projects/:id` | Delete a project and its tasks |

### Tasks

| Method | Endpoint         | Description   |
| ------ | ---------------- | ------------- |
| POST   | `/api/tasks`     | Create a task |
| GET    | `/api/tasks`     | List tasks    |
| GET    | `/api/tasks/:id` | Get one task  |
| PUT    | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |

Task filters are supported through query parameters:

```text
GET /api/tasks?projectId=1&status=todo&priority=high&search=login
```

## Validation and Business Rules

- Project name cannot be empty.
- Task title cannot be empty.
- A task must reference an existing project.
- Project status is `active` or `completed`.
- Task status is `todo`, `in_progress`, or `completed`.
- Task priority is `low`, `medium`, or `high`.
- A project cannot become `completed` while it has a pending task.
- Missing resources return `404` responses.
- Invalid request data returns `400` responses.

The project-completion rule is implemented in `backend/src/controllers/project.controller.js`, close to the project update operation. This keeps the rule in the API layer so every client follows the same business rule.

## Design Decisions and Improvements

The relational structure keeps project data and task data normalized, while the foreign key guarantees that every task belongs to a real project. MySQL `ENUM` values protect the allowed status and priority values.

For 10,000 or more tasks, the next improvements would be pagination, indexes on frequently filtered columns, server-side debounced search, and selecting only the required columns. The current schema already includes indexes for `project_id`, `status`, `priority`, and `title`.

## Health Check

```text
GET /api/health
```

A successful response confirms that the API and MySQL connection are available.
