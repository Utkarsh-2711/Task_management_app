# Task Management System Frontend

React and Vite frontend for the Task Management System. The frontend communicates with the Express API at `http://localhost:5000/api`.

## Requirements

- Node.js 18 or newer
- Running backend API and MySQL database

## Setup

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

For a production build:

```powershell
npm run lint
npm run build
```

## Main Views

- `/projects` - project overview, project statistics, project creation, editing, deletion, completion, and reopening.
- `/projects/:projectId/tasks` - tasks belonging to one project.
- `/tasks` - all tasks across projects.
- Any unknown route displays the dedicated not-found page.

## User Features

- Create and edit projects.
- Create and edit tasks with status, priority, description, and due date.
- Mark `todo` or `in_progress` tasks as completed with the Complete action.
- Search tasks by title.
- Filter tasks by status and priority.
- Delete tasks and projects.
- A project can be completed only after all its tasks are completed.
- Reopen a completed project when needed.
- Inline form validation and readable API error messages.
- Responsive layout for desktop and mobile screens.

## Frontend Structure

```text
src/
  App.jsx                    Router and shared application state
  services/api.js            Centralized fetch and API error handling
  components/
    ProjectsPage.jsx         Project overview
    ProjectTasksPage.jsx     Tasks for one project
    AllTasksPage.jsx         All tasks view
    ProjectCards.jsx         Project actions and progress
    TaskBoard.jsx            Task search, filters, and actions
    ProjectFormModal.jsx     Project form validation
    TaskFormModal.jsx        Task form validation
    Sidebar.jsx              Application navigation
```

## API Configuration

The API base URL is currently defined in `src/services/api.js`:

```text
http://localhost:5000/api
```

The shared `request()` helper handles JSON requests, response parsing, backend errors, connection failures, and invalid server responses.

## Business Rule

The frontend disables the project completion action when pending tasks exist. The backend independently enforces the same rule, so the rule cannot be bypassed by calling the API directly.
