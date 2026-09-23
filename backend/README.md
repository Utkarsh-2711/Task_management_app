# Task Management System Backend

Express REST API for the Task Management System. The backend uses MySQL through `mysql2/promise` and exposes project and task CRUD operations.

## Requirements

- Node.js 18 or newer
- MySQL 8 or newer

## Configuration

Create or update `backend/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=task_management
```

Keep `.env` private. It must not be committed to source control.

## Setup and Run

```powershell
cd backend
npm install
npm run dev
```

The API runs at `http://localhost:5000`.

The server initializes `database/schema.sql` on startup, creates the database and tables when needed, and checks the MySQL connection before listening for requests.

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

| Method | Endpoint         | Description     |
| ------ | ---------------- | --------------- |
| POST   | `/api/tasks`     | Create a task   |
| GET    | `/api/tasks`     | List tasks      |
| GET    | `/api/tasks/:id` | Get one task    |
| PUT    | `/api/tasks/:id` | Update one task |
| DELETE | `/api/tasks/:id` | Delete one task |

### AI Assistant (Section 8)

| Method | Endpoint                      | Description                                        |
| ------ | ----------------------------- | -------------------------------------------------- |
| POST   | `/api/ai/parse-task`          | Extract structured task data from natural language |
| GET    | `/api/ai/project-summary/:id` | Get concise 2–3 sentence project summary           |
| POST   | `/api/ai/suggest-tasks/:id`   | Generate 1–3 useful next tasks for a project       |

Task filters are available through query parameters:

```text
GET /api/tasks?projectId=1&status=in_progress&priority=high&search=login
```

### Health

```text
GET /api/health
```

Returns a successful response only when the API can reach MySQL.

## Validation and Business Rules

- Project names and task titles cannot be empty.
- A task must reference an existing project.
- Project status is `active` or `completed`.
- Task status is `todo`, `in_progress`, or `completed`.
- Task priority is `low`, `medium`, or `high`.
- Due dates must use a real `YYYY-MM-DD` calendar date.
- IDs must be positive integers.
- A project cannot become `completed` while any related task is not `completed`.
- Missing resources return `404`.
- Invalid input returns `400`.
- Database availability and unexpected failures use consistent JSON error responses.

The project completion rule is enforced in `src/controllers/project.controller.js`, so it applies to every client, not only the React interface.

## Database Design

The schema contains two related tables:

```text
projects (1) -------- (many) tasks
```

Each task has a required `project_id` foreign key. Deleting a project cascades to its tasks through `ON DELETE CASCADE`. Indexes support project, status, priority, and title filtering.

## Backend Structure

```text
src/
  server.js                    Express setup and startup
  config/db.js                 MySQL pool and schema initialization
  controllers/                 Project and task business logic
  routes/                      API route definitions
  middleware/                  Async and centralized error handling
  utils/validation.js          Shared request validation helpers
```

## Error Response Format

Successful and failed responses use a consistent JSON shape:

```json
{
    "success": false,
    "message": "Project cannot be completed because some tasks are still pending."
}
```
