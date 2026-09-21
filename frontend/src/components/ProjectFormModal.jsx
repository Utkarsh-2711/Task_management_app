import { useState } from "react";

function ProjectFormModal({ project, form, onChange, onSubmit, onClose }) {
    const [validationError, setValidationError] = useState("");

    function handleSubmit(event) {
        event.preventDefault();
        if (!form.name.trim()) {
            setValidationError("Project name cannot be empty.");
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
                    aria-label="Close project form"
                    onClick={onClose}>
                    ×
                </button>
                <p className="overline">Project details</p>
                <h2>{project ? "Edit project" : "Create a project"}</h2>
                <form onSubmit={handleSubmit} noValidate>
                    <label>
                        Project name
                        <input
                            value={form.name}
                            onChange={(event) =>
                                onChange("name", event.target.value)
                            }
                        />
                    </label>
                    {validationError && (
                        <p className="form-error">{validationError}</p>
                    )}
                    <label>
                        Description
                        <textarea
                            value={form.description}
                            onChange={(event) =>
                                onChange("description", event.target.value)
                            }
                        />
                    </label>
                    <label>
                        Status
                        <select
                            value={form.status}
                            onChange={(event) =>
                                onChange("status", event.target.value)
                            }>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                        </select>
                    </label>
                    <button className="primary-button full-width">
                        {project ? "Save project" : "Create project"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ProjectFormModal;
