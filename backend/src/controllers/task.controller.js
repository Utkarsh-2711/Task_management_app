// Task controller: validates task data, checks project ownership, and handles task CRUD operations.
import pool from "../config/db.js";
import { isPositiveInteger, isValidDate } from "../utils/validation.js";

const taskStatuses = ["todo", "in_progress", "completed"];
const priorities = ["low", "medium", "high"];

// Task status and priority mirror the ENUM values defined in the MySQL schema.
function isValidTask(status, priority) {
    return taskStatuses.includes(status) && priorities.includes(priority);
}

async function projectExists(projectId) {
    // Check the parent row before inserting or moving a task.
    const [rows] = await pool.execute("SELECT id FROM projects WHERE id = ?", [
        projectId,
    ]);
    return rows.length > 0;
}

export async function createTask(request, response) {
    // A task is inserted only when its project exists and its enum values are valid.
    const {
        project_id: projectId,
        title,
        description = null,
        status = "todo",
        priority = "medium",
        due_date: dueDate = null,
    } = request.body || {};

    if (typeof title !== "string" || !title.trim()) {
        return response
            .status(400)
            .json({ success: false, message: "Task title cannot be empty." });
    }
    if (description !== null && typeof description !== "string") {
        return response.status(400).json({
            success: false,
            message: "Task description must be text.",
        });
    }
    if (!isPositiveInteger(projectId)) {
        return response.status(400).json({
            success: false,
            message: "project_id must be a positive integer.",
        });
    }
    if (!(await projectExists(projectId))) {
        return response.status(400).json({
            success: false,
            message: "Task must belong to an existing project.",
        });
    }
    if (!isValidTask(status, priority)) {
        return response.status(400).json({
            success: false,
            message: "Invalid task status or priority.",
        });
    }
    if (!isValidDate(dueDate)) {
        return response.status(400).json({
            success: false,
            message: "Due date must use YYYY-MM-DD format.",
        });
    }

    // Store the normalized title and validated values in the related project.
    const [result] = await pool.execute(
        "INSERT INTO tasks (project_id, title, description, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?)",
        [projectId, title.trim(), description, status, priority, dueDate],
    );
    const [rows] = await pool.execute("SELECT * FROM tasks WHERE id = ?", [
        result.insertId,
    ]);

    return response.status(201).json({ success: true, data: rows[0] });
}

export async function listTasks(request, response) {
    // Build filters dynamically while keeping values parameterized to avoid SQL injection.
    const { projectId, status, priority, search } = request.query;
    const conditions = [];
    const values = [];

    if (projectId && !isPositiveInteger(projectId)) {
        return response.status(400).json({
            success: false,
            message: "projectId must be a positive integer.",
        });
    }
    if (status && !taskStatuses.includes(status)) {
        return response
            .status(400)
            .json({ success: false, message: "Invalid task status filter." });
    }
    if (priority && !priorities.includes(priority)) {
        return response
            .status(400)
            .json({ success: false, message: "Invalid priority filter." });
    }

    if (projectId) {
        conditions.push("t.project_id = ?");
        values.push(projectId);
    }
    if (status) {
        conditions.push("t.status = ?");
        values.push(status);
    }
    if (priority) {
        conditions.push("t.priority = ?");
        values.push(priority);
    }
    if (search) {
        conditions.push("t.title LIKE ?");
        values.push(`%${search}%`);
    }

    // Only add a WHERE clause when at least one supported filter was supplied.
    const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";
    const [rows] = await pool.execute(
        `SELECT t.*
         FROM tasks t
         ${whereClause}
         ORDER BY t.created_at DESC`,
        values,
    );
    return response.json({ success: true, data: rows });
}

export async function getTask(request, response) {
    if (!isPositiveInteger(request.params.id)) {
        return response.status(400).json({
            success: false,
            message: "Task ID must be a positive integer.",
        });
    }
    const [rows] = await pool.execute("SELECT * FROM tasks WHERE id = ?", [
        request.params.id,
    ]);

    if (!rows.length) {
        return response
            .status(404)
            .json({ success: false, message: "Task not found." });
    }
    return response.json({ success: true, data: rows[0] });
}

export async function updateTask(request, response) {
    // Partial updates reuse existing values so clients can update only selected fields.
    const taskId = request.params.id;
    if (!isPositiveInteger(taskId)) {
        return response.status(400).json({
            success: false,
            message: "Task ID must be a positive integer.",
        });
    }
    const [existingRows] = await pool.execute(
        "SELECT * FROM tasks WHERE id = ?",
        [taskId],
    );

    if (!existingRows.length) {
        return response
            .status(404)
            .json({ success: false, message: "Task not found." });
    }

    // Use stored values for fields omitted from the partial update request.
    const existingTask = existingRows[0];
    const body = request.body || {};
    const projectId = body.project_id ?? existingTask.project_id;
    const title = body.title ?? existingTask.title;
    const status = body.status ?? existingTask.status;
    const priority = body.priority ?? existingTask.priority;

    if (typeof title !== "string" || !title.trim()) {
        return response
            .status(400)
            .json({ success: false, message: "Task title cannot be empty." });
    }
    if (
        body.description !== undefined &&
        body.description !== null &&
        typeof body.description !== "string"
    ) {
        return response.status(400).json({
            success: false,
            message: "Task description must be text.",
        });
    }
    if (!isPositiveInteger(projectId)) {
        return response.status(400).json({
            success: false,
            message: "project_id must be a positive integer.",
        });
    }
    if (!(await projectExists(projectId))) {
        return response.status(400).json({
            success: false,
            message: "Task must belong to an existing project.",
        });
    }
    if (!isValidTask(status, priority)) {
        return response.status(400).json({
            success: false,
            message: "Invalid task status or priority.",
        });
    }
    if (!isValidDate(body.due_date ?? existingTask.due_date)) {
        return response.status(400).json({
            success: false,
            message: "Due date must use YYYY-MM-DD format.",
        });
    }

    // Re-check the project relationship when a task is moved to another project.
    await pool.execute(
        `UPDATE tasks
         SET project_id = ?, title = ?, description = ?, status = ?, priority = ?, due_date = ?
         WHERE id = ?`,
        [
            projectId,
            title.trim(),
            body.description ?? existingTask.description,
            status,
            priority,
            body.due_date ?? existingTask.due_date,
            taskId,
        ],
    );

    const [rows] = await pool.execute("SELECT * FROM tasks WHERE id = ?", [
        taskId,
    ]);
    return response.json({ success: true, data: rows[0] });
}

export async function deleteTask(request, response) {
    if (!isPositiveInteger(request.params.id)) {
        return response.status(400).json({
            success: false,
            message: "Task ID must be a positive integer.",
        });
    }
    const [result] = await pool.execute("DELETE FROM tasks WHERE id = ?", [
        request.params.id,
    ]);

    if (!result.affectedRows) {
        return response
            .status(404)
            .json({ success: false, message: "Task not found." });
    }
    return response.json({
        success: true,
        message: "Task deleted successfully.",
    });
}
