import { useState } from "react";

function TaskFormModal({
    task,
    form,
    projects,
    onChange,
    onGenerateTask,
    onSubmit,
    onClose,
    aiReviewMeta = null,
}) {
    const [validationError, setValidationError] = useState("");
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiError, setAiError] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [localReviewActive, setLocalReviewActive] = useState(false);

    function handleSubmit(event) {
        event.preventDefault();
        if (!form.title.trim()) {
            setValidationError("Task title cannot be empty.");
            return;
        }
        if (!form.project_id) {
            setValidationError("Please select a project for this task.");
            return;
        }
        setValidationError("");
        onSubmit(event);
    }

    async function handleGenerateTask() {
        if (!aiPrompt.trim()) {
            setAiError("Describe the task first.");
            return;
        }
        setAiError("");
        setAiLoading(true);
        try {
            await onGenerateTask(aiPrompt.trim());
            setLocalReviewActive(true);
            setAiPrompt("");
        } catch (requestError) {
            setAiError(requestError.message);
        } finally {
            setAiLoading(false);
        }
    }

    const showReviewBanner = Boolean(aiReviewMeta || localReviewActive);
    const selectedProjectObj = projects.find(
        (project) => String(project.id) === String(form.project_id),
    );

    return (
        <div
            className="modal-backdrop"
            onMouseDown={(event) =>
                event.target === event.currentTarget && onClose()
            }>
            <div className="modal">
                <button
                    className="modal-close"
                    type="button"
                    aria-label="Close task form"
                    onClick={onClose}>
                    ×
                </button>
                <p className="overline">Task details</p>
                <h2>{task ? "Edit task" : "Create a task"}</h2>

                {showReviewBanner && (
                    <div className="ai-review-banner">
                        <div className="ai-review-banner-header">
                            <span className="ai-sparkle-pill">✨ AI Extracted Task</span>
                            <span className="ai-review-badge">Step: Review & Edit</span>
                        </div>
                        <p className="ai-review-text">
                            {aiReviewMeta?.source === "suggestion"
                                ? "This task was suggested by AI. Review and edit below, then click Create task to save."
                                : "The AI extracted the structured information below. Review or edit any field before saving."}
                        </p>
                        <div className="ai-review-chips">
                            <span className="ai-chip">
                                <strong>Project:</strong>{" "}
                                {selectedProjectObj?.name || "Assigned Project"}
                            </span>
                            <span className="ai-chip">
                                <strong>Priority:</strong>{" "}
                                {form.priority ? form.priority.toUpperCase() : "MEDIUM"}
                            </span>
                            {form.due_date ? (
                                <span className="ai-chip">
                                    <strong>Due Date:</strong> {form.due_date}
                                </span>
                            ) : null}
                        </div>
                    </div>
                )}

                {!task && !showReviewBanner && (
                    <div className="ai-task-helper">
                        <label htmlFor="ai-task-prompt">
                            ✨ Describe task in natural language
                        </label>
                        <textarea
                            id="ai-task-prompt"
                            value={aiPrompt}
                            placeholder='e.g. "Create a high priority task for the website project to fix the login API before Friday."'
                            onChange={(event) =>
                                setAiPrompt(event.target.value)
                            }
                        />
                        <button
                            className="secondary-button"
                            type="button"
                            onClick={handleGenerateTask}
                            disabled={aiLoading}>
                            {aiLoading ? "✨ Generating with AI..." : "✨ Generate with AI"}
                        </button>
                        {aiError && <p className="form-error">{aiError}</p>}
                        <small className="ai-helper-note">
                            The AI will extract structured fields below for your review before saving.
                        </small>
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    <label>
                        Task title
                        <input
                            id="task-form-title"
                            value={form.title}
                            onChange={(event) =>
                                onChange("title", event.target.value)
                            }
                            placeholder="e.g. Fix login API"
                        />
                    </label>
                    <label>
                        Project
                        <select
                            id="task-form-project"
                            value={form.project_id}
                            onChange={(event) =>
                                onChange("project_id", event.target.value)
                            }>
                            <option value="">Choose project</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    {projects.length === 0 ? (
                        <p className="form-error">
                            Create a project before adding a task.
                        </p>
                    ) : validationError ? (
                        <p className="form-error">{validationError}</p>
                    ) : null}
                    <label>
                        Description
                        <textarea
                            id="task-form-description"
                            value={form.description}
                            placeholder="Detailed task description..."
                            onChange={(event) =>
                                onChange("description", event.target.value)
                            }
                        />
                    </label>
                    <div className="form-grid">
                        <label>
                            Status
                            <select
                                id="task-form-status"
                                value={form.status}
                                onChange={(event) =>
                                    onChange("status", event.target.value)
                                }>
                                <option value="todo">Todo</option>
                                <option value="in_progress">In progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </label>
                        <label>
                            Priority
                            <select
                                id="task-form-priority"
                                value={form.priority}
                                onChange={(event) =>
                                    onChange("priority", event.target.value)
                                }>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </label>
                    </div>
                    <label>
                        Due date
                        <input
                            id="task-form-duedate"
                            type="date"
                            value={form.due_date || ""}
                            onChange={(event) =>
                                onChange("due_date", event.target.value)
                            }
                        />
                    </label>
                    <button id="task-form-submit" className="primary-button full-width">
                        {task ? "Save task" : "Create task"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default TaskFormModal;
