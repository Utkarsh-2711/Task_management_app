import { useState } from "react";

function TaskFormModal({ task, form, projects, onChange, onSubmit, onClose }) {
    const [validationError, setValidationError] = useState("");

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
                <form onSubmit={handleSubmit} noValidate>
                    <label>
                        Task title
                        <input
                            value={form.title}
                            onChange={(event) =>
                                onChange("title", event.target.value)
                            }
                        />
                    </label>
                    <label>
                        Project
                        <select
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
                            value={form.description}
                            onChange={(event) =>
                                onChange("description", event.target.value)
                            }
                        />
                    </label>
                    <div className="form-grid">
                        <label>
                            Status
                            <select
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
                            type="date"
                            value={form.due_date || ""}
                            onChange={(event) =>
                                onChange("due_date", event.target.value)
                            }
                        />
                    </label>
                    <button className="primary-button full-width">
                        {task ? "Save task" : "Create task"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default TaskFormModal;
