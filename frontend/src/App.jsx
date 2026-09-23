import { useEffect, useState } from "react";
import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
    useLocation,
    useNavigate,
} from "react-router-dom";
import "./App.css";
import { request } from "./services/api";
import AllTasksPage from "./components/AllTasksPage";
import ProjectFormModal from "./components/ProjectFormModal";
import ProjectTasksPage from "./components/ProjectTasksPage";
import ProjectsPage from "./components/ProjectsPage";
import NotFoundPage from "./components/NotFoundPage";
import Sidebar from "./components/Sidebar";
import TaskFormModal from "./components/TaskFormModal";

const emptyProject = { name: "", description: "", status: "active" };
const emptyTask = {
    project_id: "",
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    due_date: "",
};

function Workspace() {
    const location = useLocation();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [filters, setFilters] = useState({
        projectId: "",
        status: "",
        priority: "",
        search: "",
    });
    const [projectForm, setProjectForm] = useState(emptyProject);
    const [taskForm, setTaskForm] = useState(emptyTask);
    const [editingProject, setEditingProject] = useState(null);
    const [editingTask, setEditingTask] = useState(null);
    const [modal, setModal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [projectSummary, setProjectSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [projectSuggestions, setProjectSuggestions] = useState(null);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [aiReviewMeta, setAiReviewMeta] = useState(null);
    const [appliedSuggestion, setAppliedSuggestion] = useState(null);

    const projectMatch = location.pathname.match(/^\/projects\/(\d+)\/tasks$/);
    const selectedProject = projectMatch ? projectMatch[1] : "all";

    async function loadProjects() {
        setProjects(await request("/projects"));
    }

    async function loadTasks() {
        const params = new URLSearchParams();
        if (selectedProject !== "all") {
            params.set("projectId", selectedProject);
        } else if (filters.projectId) {
            params.set("projectId", filters.projectId);
        }
        if (filters.status) params.set("status", filters.status);
        if (filters.priority) params.set("priority", filters.priority);
        if (filters.search) params.set("search", filters.search);
        setTasks(await request(`/tasks?${params.toString()}`));
    }

    useEffect(() => {
        async function loadInitialData() {
            try {
                const [projectData, taskData] = await Promise.all([
                    request("/projects"),
                    request("/tasks"),
                ]);
                setProjects(projectData);
                setTasks(taskData);
            } catch (requestError) {
                setError(requestError.message);
            } finally {
                setLoading(false);
            }
        }
        loadInitialData();
    }, []);

    useEffect(() => {
        if (loading) return;
        async function refreshTasks() {
            const params = new URLSearchParams();
            if (selectedProject !== "all") {
                params.set("projectId", selectedProject);
            } else if (filters.projectId) {
                params.set("projectId", filters.projectId);
            }
            if (filters.status) params.set("status", filters.status);
            if (filters.priority) params.set("priority", filters.priority);
            if (filters.search) params.set("search", filters.search);
            try {
                setTasks(await request(`/tasks?${params.toString()}`));
            } catch (requestError) {
                setError(requestError.message);
            }
        }
        refreshTasks();
    }, [
        loading,
        selectedProject,
        filters.projectId,
        filters.status,
        filters.priority,
        filters.search,
    ]);

    function showError(requestError) {
        setError(requestError.message);
        setTimeout(() => setError(""), 5000);
    }

    function openProjectForm(project = null) {
        setEditingProject(project);
        setProjectForm(
            project
                ? {
                      name: project.name,
                      description: project.description || "",
                      status: project.status,
                  }
                : emptyProject,
        );
        setModal("project");
    }

    function openTaskForm(task = null) {
        setEditingTask(task);
        setAiReviewMeta(null);
        setAppliedSuggestion(null);
        setTaskForm(
            task
                ? { ...task, project_id: String(task.project_id) }
                : {
                      ...emptyTask,
                      project_id:
                          selectedProject === "all"
                              ? String(projects[0]?.id || "")
                              : selectedProject,
                  },
        );
        setModal("task");
    }

    async function submitProject(event) {
        event.preventDefault();
        try {
            await request(
                editingProject ? `/projects/${editingProject.id}` : "/projects",
                {
                    method: editingProject ? "PUT" : "POST",
                    body: JSON.stringify(projectForm),
                },
            );
            await loadProjects();
            setModal(null);
        } catch (requestError) {
            showError(requestError);
        }
    }

    async function completeProject(project) {
        try {
            await request(`/projects/${project.id}`, {
                method: "PUT",
                body: JSON.stringify({ status: "completed" }),
            });
            await loadProjects();
        } catch (requestError) {
            showError(requestError);
        }
    }

    async function reopenProject(project) {
        try {
            await request(`/projects/${project.id}`, {
                method: "PUT",
                body: JSON.stringify({ status: "active" }),
            });
            await loadProjects();
        } catch (requestError) {
            showError(requestError);
        }
    }

    async function submitTask(event) {
        event.preventDefault();
        try {
            await request(editingTask ? `/tasks/${editingTask.id}` : "/tasks", {
                method: editingTask ? "PUT" : "POST",
                body: JSON.stringify(taskForm),
            });
            await loadTasks();

            // When user adds the AI-generated suggested task, remove it from suggestions list
            if (appliedSuggestion) {
                setProjectSuggestions((prev) => {
                    if (!prev || !prev.items) return prev;
                    const remaining = prev.items.filter(
                        (item) => item.title !== appliedSuggestion.title,
                    );
                    return remaining.length > 0
                        ? { ...prev, items: remaining }
                        : null;
                });
                setAppliedSuggestion(null);
            }

            setModal(null);
            setAiReviewMeta(null);
        } catch (requestError) {
            showError(requestError);
        }
    }

    async function generateTaskFromPrompt(prompt, contextualProjectId = null) {
        const payload = { prompt };
        if (contextualProjectId) {
            payload.projectId = contextualProjectId;
        } else if (selectedProject !== "all") {
            payload.projectId = selectedProject;
        }
        const extractedTask = await request("/ai/parse-task", {
            method: "POST",
            body: JSON.stringify(payload),
        });

        const targetProjectId = extractedTask.project_id
            ? String(extractedTask.project_id)
            : contextualProjectId
              ? String(contextualProjectId)
              : selectedProject !== "all"
                ? String(selectedProject)
                : String(projects[0]?.id || "");

        const normalizedPriority = String(
            extractedTask.priority || "medium",
        ).toLowerCase();

        setEditingTask(null);
        setTaskForm({
            ...emptyTask,
            title: extractedTask.title || "",
            description: extractedTask.description || extractedTask.title || "",
            status: extractedTask.status || "todo",
            priority: ["low", "medium", "high"].includes(normalizedPriority)
                ? normalizedPriority
                : "medium",
            due_date: extractedTask.due_date || extractedTask.dueDate || "",
            project_id: targetProjectId,
        });

        setAiReviewMeta({
            source: "natural_language",
            prompt,
            extracted: extractedTask,
        });
        setModal("task");
        return extractedTask;
    }

    async function summarizeProject(projectId = "all") {
        setSummaryLoading(true);
        try {
            const path =
                projectId && projectId !== "all"
                    ? `/ai/project-summary/${projectId}`
                    : `/ai/summary`;
            const result = await request(path);
            setProjectSummary({
                projectId: String(projectId || "all"),
                text: result.summary,
            });
        } catch (requestError) {
            showError(requestError);
        } finally {
            setSummaryLoading(false);
        }
    }

    async function suggestTasks(projectId = "all") {
        setSuggestionsLoading(true);
        try {
            const path =
                projectId && projectId !== "all"
                    ? `/ai/suggest-tasks/${projectId}`
                    : `/ai/suggest-tasks`;
            const result = await request(path, {
                method: "POST",
            });
            setProjectSuggestions({
                projectId: String(projectId || "all"),
                items: result.suggestions || [],
            });
        } catch (requestError) {
            showError(requestError);
        } finally {
            setSuggestionsLoading(false);
        }
    }

    function applySuggestedTask(suggestion, projectId) {
        setEditingTask(null);
        setAppliedSuggestion(suggestion);
        const priLower = String(suggestion.priority || "medium").toLowerCase();
        setTaskForm({
            ...emptyTask,
            project_id: String(projectId),
            title: suggestion.title || "",
            description: suggestion.reason || "",
            priority: ["low", "medium", "high"].includes(priLower)
                ? priLower
                : "medium",
            status: "todo",
        });
        setAiReviewMeta({
            source: "suggestion",
            suggestion,
        });
        setModal("task");
    }

    function dismissSuggestion(targetIndex) {
        setProjectSuggestions((prev) => {
            if (!prev || !prev.items) return prev;
            const remaining = prev.items.filter((_, idx) => idx !== targetIndex);
            return remaining.length > 0 ? { ...prev, items: remaining } : null;
        });
    }

    function closeSuggestionsPanel() {
        setProjectSuggestions(null);
    }

    async function completeTask(task) {
        try {
            await request(`/tasks/${task.id}`, {
                method: "PUT",
                body: JSON.stringify({ status: "completed" }),
            });
            await loadTasks();
        } catch (requestError) {
            showError(requestError);
        }
    }

    async function removeProject(project) {
        if (!window.confirm(`Delete ${project.name} and its tasks?`)) return;
        try {
            await request(`/projects/${project.id}`, { method: "DELETE" });
            await Promise.all([loadProjects(), loadTasks()]);
            if (selectedProject === String(project.id)) navigate("/projects");
        } catch (requestError) {
            showError(requestError);
        }
    }

    async function removeTask(task) {
        if (!window.confirm(`Delete ${task.title}?`)) return;
        try {
            await request(`/tasks/${task.id}`, { method: "DELETE" });
            await loadTasks();
        } catch (requestError) {
            showError(requestError);
        }
    }

    const pageProps = {
        projects,
        tasks,
        loading,
        filters,
        onFilterChange: (key, value) =>
            setFilters({ ...filters, [key]: value }),
        onEditTask: openTaskForm,
        onCompleteTask: completeTask,
        onDeleteTask: removeTask,
        onCreateTask: () => openTaskForm(),
    };

    return (
        <div className="app-shell">
            <Sidebar
                projects={projects}
                selectedProject={selectedProject}
                taskCount={tasks.length}
                onSelectProject={() => undefined}
                onCreateProject={() => openProjectForm()}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen((open) => !open)}
                onClose={() => setSidebarOpen(false)}
            />
            <main className="main-content">
                {error && <div className="alert">{error}</div>}
                <Routes>
                    <Route
                        path="/"
                        element={<Navigate to="/projects" replace />}
                    />
                    <Route
                        path="/projects"
                        element={
                            <ProjectsPage
                                projects={projects}
                                tasks={tasks}
                                onCreateProject={() => openProjectForm()}
                                onEditProject={openProjectForm}
                                onCompleteProject={completeProject}
                                onReopenProject={reopenProject}
                                onDeleteProject={removeProject}
                            />
                        }
                    />
                    <Route
                        path="/projects/:projectId/tasks"
                        element={
                            <ProjectTasksPage
                                {...pageProps}
                                projectSummary={projectSummary}
                                summaryLoading={summaryLoading}
                                onSummarizeProject={summarizeProject}
                                projectSuggestions={projectSuggestions}
                                suggestionsLoading={suggestionsLoading}
                                onSuggestTasks={suggestTasks}
                                onApplySuggestion={applySuggestedTask}
                                onDismissSuggestion={dismissSuggestion}
                                onCloseSuggestionsPanel={closeSuggestionsPanel}
                                onGenerateTask={generateTaskFromPrompt}
                            />
                        }
                    />
                    <Route
                        path="/tasks"
                        element={
                            <AllTasksPage
                                {...pageProps}
                                showProjectFilter={true}
                                onGenerateTask={generateTaskFromPrompt}
                                projectSummary={projectSummary}
                                summaryLoading={summaryLoading}
                                onSummarizeProject={summarizeProject}
                                projectSuggestions={projectSuggestions}
                                suggestionsLoading={suggestionsLoading}
                                onSuggestTasks={suggestTasks}
                                onApplySuggestion={applySuggestedTask}
                                onDismissSuggestion={dismissSuggestion}
                                onCloseSuggestionsPanel={closeSuggestionsPanel}
                            />
                        }
                    />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </main>
            {modal === "project" && (
                <ProjectFormModal
                    project={editingProject}
                    form={projectForm}
                    onChange={(key, value) =>
                        setProjectForm({ ...projectForm, [key]: value })
                    }
                    onSubmit={submitProject}
                    onClose={() => setModal(null)}
                />
            )}
            {modal === "task" && (
                <TaskFormModal
                    task={editingTask}
                    form={taskForm}
                    projects={projects}
                    onChange={(key, value) =>
                        setTaskForm({ ...taskForm, [key]: value })
                    }
                    onGenerateTask={generateTaskFromPrompt}
                    onSubmit={submitTask}
                    onClose={() => {
                        setModal(null);
                        setAiReviewMeta(null);
                        setAppliedSuggestion(null);
                    }}
                    aiReviewMeta={aiReviewMeta}
                />
            )}
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Workspace />
        </BrowserRouter>
    );
}

export default App;
