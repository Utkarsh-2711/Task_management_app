import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const model =
    process.env.AI_MODEL || process.env.GEMINI_MODEL || "gemini-2.5-flash";

function getClient() {
    const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
}

function parseJsonResponse(text) {
    const cleanedText = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
    return JSON.parse(cleanedText);
}

// Timeout wrapper to prevent hanging requests when the LLM provider is slow or unresponsive.
async function withTimeout(promise, timeoutMs = 25000) {
    let timerId;
    const timeoutPromise = new Promise((_, reject) => {
        timerId = setTimeout(() => {
            const error = new Error("AI request timed out.");
            error.status = 504;
            error.code = "AI_TIMEOUT";
            reject(error);
        }, timeoutMs);
    });

    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        clearTimeout(timerId);
    }
}

// Retry transient 503/504/timeout/high-demand spikes with exponential backoff.
async function callWithRetry(fn, maxRetries = 1) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await withTimeout(fn());
        } catch (error) {
            lastError = error;
            const isTransient =
                error.status === 503 ||
                error.status === 504 ||
                error.code === "AI_TIMEOUT" ||
                error.message?.includes("high demand") ||
                error.message?.includes("UNAVAILABLE") ||
                error.message?.includes("timed out");
            if (isTransient && attempt < maxRetries) {
                await new Promise((resolve) =>
                    setTimeout(resolve, 1000 * (attempt + 1)),
                );
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}

// Intelligent fallback heuristic parser if LLM service is offline or unconfigured
function fallbackParseTaskPrompt(prompt, projects) {
    const lower = prompt.toLowerCase();
    
    // 1. Priority extraction
    let priority = "High";
    if (/\blow\s*priority\b|\bminor\b/i.test(prompt)) {
        priority = "Low";
    } else if (/\bmedium\s*priority\b|\bnormal\b/i.test(prompt)) {
        priority = "Medium";
    } else if (/\bhigh\s*priority\b|\burgent\b|\bcritical\b/i.test(prompt)) {
        priority = "High";
    }

    // 2. Project matching
    let matchedProject = null;
    for (const proj of projects) {
        const projLower = proj.name.toLowerCase();
        if (lower.includes(projLower)) {
            matchedProject = proj.name;
            break;
        }
    }
    if (!matchedProject) {
        // Match significant words (e.g. "website" matches "Website Project")
        for (const proj of projects) {
            const words = proj.name.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
            if (words.some((w) => lower.includes(w))) {
                matchedProject = proj.name;
                break;
            }
        }
    }

    // 3. Due Date extraction
    let dueDate = null;
    const now = new Date();
    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayMatch = lower.match(/\b(?:before|by|on|due)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i);
    if (dayMatch) {
        const targetDay = daysOfWeek.indexOf(dayMatch[1].toLowerCase());
        const currentDay = now.getDay();
        let diff = targetDay - currentDay;
        if (diff <= 0) diff += 7; // next occurrence
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() + diff);
        dueDate = targetDate.toISOString().slice(0, 10);
    } else if (lower.includes("tomorrow")) {
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() + 1);
        dueDate = targetDate.toISOString().slice(0, 10);
    } else {
        const explicitDate = prompt.match(/\b\d{4}-\d{2}-\d{2}\b/);
        if (explicitDate) dueDate = explicitDate[0];
    }

    // 4. Title & Description extraction
    let title = "";
    const actionMatch =
        prompt.match(/\bto\s+([^\.]+?)(?:\s+(?:before|by|due|on)\s+|$)/i) ||
        prompt.match(/(?:fix|create|update|add|implement|build|refactor|design)\s+([^\.]+?)(?:\s+(?:before|by|due|on|for)\s+|$)/i);
    
    if (actionMatch) {
        title = actionMatch[0].replace(/^to\s+/i, "").trim();
        title = title.charAt(0).toUpperCase() + title.slice(1);
    } else {
        title = prompt.length > 60 ? prompt.slice(0, 57) + "..." : prompt;
    }
    title = title.replace(/\s+(?:before|by|due)\s+.*$/i, "").trim();

    return {
        title: title || "New Task",
        description: title || prompt,
        priority,
        dueDate,
        project: matchedProject || (projects[0]?.name || null),
    };
}

export async function parseTaskPrompt(prompt, projects) {
    const client = getClient();
    const projectNames = projects.map((project) => project.name);
    const today = new Date().toISOString().slice(0, 10);

    if (!client) {
        console.warn("[AI Service] Gemini API key not found. Using intelligent NLP fallback parser.");
        return fallbackParseTaskPrompt(prompt, projects);
    }

    const instruction = `You are an AI task assistant. Extract structured task data from natural language.
Return ONLY valid JSON with exactly these keys:
- "title": concise task title (e.g. "Fix login API")
- "description": clear task description (e.g. "Fix the login API")
- "priority": one of "High", "Medium", "Low"
- "dueDate": due date in YYYY-MM-DD format, or null if unspecified
- "project": the project name from the available projects that best matches, or null

Today's date is ${today}.
Available projects: ${JSON.stringify(projectNames)}.
If the prompt specifies relative time such as "before Friday" or "tomorrow", compute the exact date relative to today.`;

    try {
        const result = await callWithRetry(() =>
            client.models.generateContent({
                model,
                contents: `${instruction}\n\nUser request: ${prompt}`,
                config: {
                    responseMimeType: "application/json",
                    temperature: 0.1,
                },
            }),
        );
        const parsed = parseJsonResponse(result.text || "");
        if (!parsed || typeof parsed !== "object" || !parsed.title) {
            return fallbackParseTaskPrompt(prompt, projects);
        }
        return parsed;
    } catch (error) {
        console.warn("[AI Service] Gemini parse failed, using fallback:", error.message);
        return fallbackParseTaskPrompt(prompt, projects);
    }
}

function fallbackSummarizeProject(projectName, tasks) {
    const total = tasks.length;
    const namePrefix = projectName.toLowerCase().startsWith("the ")
        ? projectName
        : `The ${projectName}`;
    if (total === 0) {
        return `${namePrefix} currently has 0 tasks. Create a task to get started.`;
    }
    const completed = tasks.filter((t) => t.status === "completed").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const pending = tasks.filter((t) => t.status === "todo").length;

    const pendingTasks = tasks.filter((t) => t.status !== "completed");
    const highPriority = pendingTasks.find((t) => t.priority === "high");
    const mediumPriority = pendingTasks.find((t) => t.priority === "medium");
    const topTask = highPriority || mediumPriority || pendingTasks[0];

    let topNotice = "";
    if (topTask) {
        let dueDesc = "soon";
        if (topTask.due_date) {
            const todayStr = new Date().toISOString().slice(0, 10);
            const dueStr =
                typeof topTask.due_date === "string"
                    ? topTask.due_date.slice(0, 10)
                    : "";
            const todayDate = new Date(todayStr);
            const taskDueDate = new Date(dueStr);
            const diffDays = Math.round(
                (taskDueDate - todayDate) / (1000 * 60 * 60 * 24),
            );

            if (diffDays === 0) dueDesc = "today";
            else if (diffDays === 1) dueDesc = "tomorrow";
            else if (diffDays < 0) dueDesc = "overdue";
            else dueDesc = `on ${dueStr}`;
        }
        topNotice = ` The highest-priority pending task is ${topTask.title}, which is due ${dueDesc}.`;
    }

    return `${namePrefix} has ${total} tasks. ${completed} are completed, ${inProgress} are in progress, and ${pending} are pending.${topNotice}`;
}

export async function summarizeProject(projectName, tasks) {
    if (!tasks || tasks.length === 0) {
        return `The ${projectName} currently has 0 tasks. Create a task to get started.`;
    }

    const client = getClient();
    if (!client) {
        console.warn("[AI Service] Gemini API key not found. Using fallback project summarizer.");
        return fallbackSummarizeProject(projectName, tasks);
    }

    const today = new Date().toISOString().slice(0, 10);
    const taskData = tasks.map((task) => ({
        title: task.title,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date,
    }));

    const prompt = `You are a project management assistant. Summarize the project "${projectName}" in 2 or 3 concise sentences.
Include:
- Total number of tasks
- Number of completed, in-progress, and pending tasks
- The highest-priority pending task and its due date if one exists.
Today is ${today}.
Example style: "The Website Project has 8 tasks. 4 are completed, 3 are in progress, and 1 is pending. The highest-priority pending task is Fix Login API, which is due tomorrow."
Project tasks: ${JSON.stringify(taskData)}`;

    try {
        const result = await callWithRetry(() =>
            client.models.generateContent({
                model,
                contents: prompt,
                config: { temperature: 0.2 },
            }),
        );
        const summary = result.text?.trim();
        if (!summary) return fallbackSummarizeProject(projectName, tasks);
        return summary;
    } catch (error) {
        console.warn("[AI Service] Gemini summary failed, using fallback:", error.message);
        return fallbackSummarizeProject(projectName, tasks);
    }
}

function fallbackSuggestTasks(projectName, tasks) {
    const taskTitles = tasks.map((t) => (t.title || "").toLowerCase()).join(" ");
    const suggestions = [];

    if (
        taskTitles.includes("login") ||
        taskTitles.includes("api") ||
        taskTitles.includes("auth")
    ) {
        suggestions.push({
            title: "Add login error handling",
            priority: "High",
            reason: "The login API is currently being implemented.",
        });
        suggestions.push({
            title: "Implement session token refresh",
            priority: "Medium",
            reason: "Ensures seamless user authentication without unexpected logouts.",
        });
    } else {
        suggestions.push({
            title: `Configure automated tests for ${projectName}`,
            priority: "High",
            reason: "Prevents regressions and verifies core requirements.",
        });
        suggestions.push({
            title: "Add API input validation and sanitize payload",
            priority: "Medium",
            reason: "Protects database integrity and improves error feedback.",
        });
    }

    return { suggestions };
}

export async function suggestTasksForProject(projectName, tasks) {
    const client = getClient();
    if (!client) {
        console.warn("[AI Service] Gemini API key not found. Using fallback task suggestions.");
        return fallbackSuggestTasks(projectName, tasks);
    }

    const taskData = tasks.map((task) => ({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
    }));

    const instruction = `You are a project management assistant. Based on existing tasks for project "${projectName}", suggest 1 to 3 useful, actionable next tasks.
Return ONLY valid JSON with exactly the key "suggestions" containing an array of 1 to 3 objects.
Each object must have:
- "title": clear concise task title (e.g. "Add login error handling")
- "priority": one of "High", "Medium", "Low"
- "reason": concise explanation why this task is suggested (e.g. "The login API is currently being implemented.")

Existing project tasks: ${JSON.stringify(taskData)}`;

    try {
        const result = await callWithRetry(() =>
            client.models.generateContent({
                model,
                contents: instruction,
                config: {
                    responseMimeType: "application/json",
                    temperature: 0.3,
                },
            }),
        );
        const parsed = parseJsonResponse(result.text || "");
        if (!parsed || !Array.isArray(parsed.suggestions) || parsed.suggestions.length === 0) {
            return fallbackSuggestTasks(projectName, tasks);
        }
        return parsed;
    } catch (error) {
        console.warn("[AI Service] Gemini suggest failed, using fallback:", error.message);
        return fallbackSuggestTasks(projectName, tasks);
    }
}
