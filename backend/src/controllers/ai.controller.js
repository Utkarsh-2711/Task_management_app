import pool from "../config/db.js";
import { isPositiveInteger, isValidDate } from "../utils/validation.js";
import {
    parseTaskPrompt,
    summarizeProject,
    suggestTasksForProject,
} from "../services/gemini.service.js";

const priorities = ["low", "medium", "high"];

export async function parseTask(request, response) {
    const { prompt, projectId } = request.body || {};

    if (typeof prompt !== "string" || !prompt.trim()) {
        return response.status(400).json({
            success: false,
            message: "Please describe the task you want to create.",
        });
    }

    if (prompt.length > 2000) {
        return response.status(400).json({
            success: false,
            message:
                "Task description is too long. Keep it under 2000 characters.",
        });
    }

    const [projects] = await pool.query(
        "SELECT id, name FROM projects ORDER BY name ASC",
    );
    if (!projects.length) {
        return response.status(400).json({
            success: false,
            message: "Create a project before using the AI task assistant.",
        });
    }

    const extracted = await parseTaskPrompt(prompt.trim(), projects);
    if (!extracted || typeof extracted !== "object" || !extracted.title) {
        return response.status(400).json({
            success: false,
            message: "Unable to generate task information. Please try again.",
        });
    }

    // Match project:
    // 1. Exact match (case-insensitive)
    const rawProjectName = (extracted.project || "").trim().toLowerCase();
    let project = projects.find(
        (item) => item.name.trim().toLowerCase() === rawProjectName,
    );

    // 2. Partial / containment match (e.g. "website project" vs "Website Project" vs "Website")
    if (!project && rawProjectName) {
        project = projects.find(
            (item) =>
                item.name.toLowerCase().includes(rawProjectName) ||
                rawProjectName.includes(item.name.toLowerCase()),
        );
    }

    // 3. Fallback to contextual projectId if provided in request body
    if (!project && projectId) {
        project = projects.find((item) => String(item.id) === String(projectId));
    }

    // 4. Fallback to first available project
    if (!project && projects.length > 0) {
        project = projects[0];
    }

    // Normalize priority (e.g. "High" -> "high")
    const rawPriority = String(extracted.priority || "").trim().toLowerCase();
    const priority = priorities.includes(rawPriority) ? rawPriority : "medium";

    // Support both due_date and dueDate from various LLM response formats
    let dueDate = extracted.dueDate ?? extracted.due_date ?? null;
    if (dueDate && !isValidDate(dueDate)) {
        dueDate = null;
    }

    return response.json({
        success: true,
        data: {
            title: extracted.title.trim(),
            description: (extracted.description || extracted.title).trim(),
            status: "todo",
            priority,
            dueDate: dueDate || "",
            due_date: dueDate || "",
            project: project ? project.name : (extracted.project || ""),
            project_name: project ? project.name : (extracted.project || ""),
            project_id: project ? String(project.id) : "",
        },
    });
}

function formatSuggestions(rawSuggestions) {
    return (Array.isArray(rawSuggestions) ? rawSuggestions : [])
        .filter(
            (item) =>
                item &&
                typeof item.title === "string" &&
                item.title.trim().length > 0,
        )
        .slice(0, 3)
        .map((item) => {
            const rawPri = String(item.priority || "").trim().toLowerCase();
            const normalizedPri = priorities.includes(rawPri) ? rawPri : "medium";
            const displayPriority =
                normalizedPri.charAt(0).toUpperCase() + normalizedPri.slice(1);
            return {
                title: item.title.trim(),
                priority: displayPriority,
                reason:
                    typeof item.reason === "string" ? item.reason.trim() : "",
            };
        });
}

export async function projectSummary(request, response) {
    const rawProjectId = request.params.projectId || request.query.projectId;

    if (rawProjectId && rawProjectId !== "all") {
        if (!isPositiveInteger(rawProjectId)) {
            return response.status(400).json({
                success: false,
                message: "Project ID must be a positive integer.",
            });
        }

        const [projects] = await pool.execute(
            "SELECT id, name FROM projects WHERE id = ?",
            [rawProjectId],
        );
        if (!projects.length) {
            return response.status(404).json({
                success: false,
                message: "Project not found.",
            });
        }

        const [tasks] = await pool.execute(
            "SELECT title, description, status, priority, due_date FROM tasks WHERE project_id = ? ORDER BY created_at DESC",
            [rawProjectId],
        );
        const summary = await summarizeProject(projects[0].name, tasks);
        return response.json({ success: true, data: { summary } });
    }

    // Summarize across all tasks in workspace
    const [tasks] = await pool.execute(
        "SELECT title, description, status, priority, due_date FROM tasks ORDER BY created_at DESC",
    );
    const [firstProject] = await pool.query(
        "SELECT name FROM projects ORDER BY id ASC LIMIT 1",
    );
    const contextName =
        firstProject.length > 0 ? firstProject[0].name : "Website Project";
    const summary = await summarizeProject(contextName, tasks);
    return response.json({ success: true, data: { summary } });
}

export async function suggestTasks(request, response) {
    const rawProjectId = request.params.projectId || request.query.projectId;

    if (rawProjectId && rawProjectId !== "all") {
        if (!isPositiveInteger(rawProjectId)) {
            return response.status(400).json({
                success: false,
                message: "Project ID must be a positive integer.",
            });
        }

        const [projects] = await pool.execute(
            "SELECT id, name FROM projects WHERE id = ?",
            [rawProjectId],
        );
        if (!projects.length) {
            return response.status(404).json({
                success: false,
                message: "Project not found.",
            });
        }

        const [tasks] = await pool.execute(
            "SELECT title, description, status, priority, due_date FROM tasks WHERE project_id = ? ORDER BY created_at DESC",
            [rawProjectId],
        );

        const rawResult = await suggestTasksForProject(projects[0].name, tasks);
        const suggestions = formatSuggestions(rawResult?.suggestions);
        return response.json({ success: true, data: { suggestions } });
    }

    // Suggest based on all tasks
    const [tasks] = await pool.execute(
        "SELECT title, description, status, priority, due_date FROM tasks ORDER BY created_at DESC",
    );
    const [firstProject] = await pool.query(
        "SELECT name FROM projects ORDER BY id ASC LIMIT 1",
    );
    const contextName =
        firstProject.length > 0 ? firstProject[0].name : "Website Project";
    const rawResult = await suggestTasksForProject(contextName, tasks);
    const suggestions = formatSuggestions(rawResult?.suggestions);
    return response.json({ success: true, data: { suggestions } });
}
