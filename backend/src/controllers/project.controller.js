// Project controller: validates project data and handles all project CRUD operations.
import pool from "../config/db.js";
import { isPositiveInteger } from "../utils/validation.js";

const projectStatuses = ["active", "completed"];

// Keep project status validation in one place so create and update use the same rules.
function isValidStatus(status) {
    return status === undefined || projectStatuses.includes(status);
}

export async function createProject(request, response) {
    // Create a project using only validated values from the request body.
    const { name, description = null, status = "active" } = request.body || {};

    if (typeof name !== "string" || !name.trim()) {
        return response
            .status(400)
            .json({ success: false, message: "Project name cannot be empty." });
    }
    if (description !== null && typeof description !== "string") {
        return response.status(400).json({
            success: false,
            message: "Project description must be text.",
        });
    }
    if (!isValidStatus(status)) {
        return response
            .status(400)
            .json({ success: false, message: "Invalid project status." });
    }

    // Parameterized queries protect project data from SQL injection.
    const [result] = await pool.execute(
        "INSERT INTO projects (name, description, status) VALUES (?, ?, ?)",
        [name.trim(), description, status],
    );
    const [rows] = await pool.execute("SELECT * FROM projects WHERE id = ?", [
        result.insertId,
    ]);

    return response.status(201).json({ success: true, data: rows[0] });
}

export async function listProjects(_request, response) {
    // Return newest projects first so the overview shows recently created work.
    const [rows] = await pool.query(
        "SELECT * FROM projects ORDER BY created_at DESC",
    );
    return response.json({ success: true, data: rows });
}

export async function getProject(request, response) {
    // Return the project together with its related tasks for the project detail endpoint.
    if (!isPositiveInteger(request.params.id)) {
        return response.status(400).json({
            success: false,
            message: "Project ID must be a positive integer.",
        });
    }
    const [rows] = await pool.execute("SELECT * FROM projects WHERE id = ?", [
        request.params.id,
    ]);

    if (!rows.length) {
        return response
            .status(404)
            .json({ success: false, message: "Project not found." });
    }

    const [tasks] = await pool.execute(
        "SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC",
        [request.params.id],
    );
    return response.json({ success: true, data: { ...rows[0], tasks } });
}

export async function updateProject(request, response) {
    const projectId = request.params.id;
    const { name, description, status } = request.body || {};

    if (!isPositiveInteger(projectId)) {
        return response.status(400).json({
            success: false,
            message: "Project ID must be a positive integer.",
        });
    }

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
        return response
            .status(400)
            .json({ success: false, message: "Project name cannot be empty." });
    }
    if (
        description !== undefined &&
        description !== null &&
        typeof description !== "string"
    ) {
        return response.status(400).json({
            success: false,
            message: "Project description must be text.",
        });
    }
    if (!isValidStatus(status)) {
        return response
            .status(400)
            .json({ success: false, message: "Invalid project status." });
    }

    const [existingRows] = await pool.execute(
        "SELECT * FROM projects WHERE id = ?",
        [projectId],
    );
    if (!existingRows.length) {
        return response
            .status(404)
            .json({ success: false, message: "Project not found." });
    }

    // A project can be completed only after every task in that project is completed.
    // This check belongs in the API because clients can bypass frontend validation.
    if (status === "completed") {
        const [pendingRows] = await pool.execute(
            "SELECT COUNT(*) AS pending_count FROM tasks WHERE project_id = ? AND status <> 'completed'",
            [projectId],
        );
        if (pendingRows[0].pending_count > 0) {
            return response.status(400).json({
                success: false,
                message:
                    "Project cannot be completed because some tasks are still pending.",
            });
        }
    }

    // Preserve omitted fields during a partial PUT request.
    const updatedProject = {
        name: name === undefined ? existingRows[0].name : name.trim(),
        description:
            description === undefined
                ? existingRows[0].description
                : description,
        status: status === undefined ? existingRows[0].status : status,
    };
    await pool.execute(
        "UPDATE projects SET name = ?, description = ?, status = ? WHERE id = ?",
        [
            updatedProject.name,
            updatedProject.description,
            updatedProject.status,
            projectId,
        ],
    );

    const [rows] = await pool.execute("SELECT * FROM projects WHERE id = ?", [
        projectId,
    ]);
    return response.json({ success: true, data: rows[0] });
}

export async function deleteProject(request, response) {
    // The database foreign key cascades this deletion to the project's tasks.
    if (!isPositiveInteger(request.params.id)) {
        return response.status(400).json({
            success: false,
            message: "Project ID must be a positive integer.",
        });
    }
    const [result] = await pool.execute("DELETE FROM projects WHERE id = ?", [
        request.params.id,
    ]);

    if (!result.affectedRows) {
        return response
            .status(404)
            .json({ success: false, message: "Project not found." });
    }
    return response.json({
        success: true,
        message: "Project deleted successfully.",
    });
}
