function TaskBoard({
    tasks,
    projects,
    loading,
    filters,
    selectedProjectName,
    onFilterChange,
    onEditTask,
    onCompleteTask,
    onDeleteTask,
}) {
    return (
        <section className="task-section">
            <div className="section-heading">
                <div>
                    <p className="overline">Task board</p>
                    <h2>{selectedProjectName}</h2>
                </div>
            </div>
            <div className="toolbar">
                <label className="search-box">
                    <span>⌕</span>
                    <input
                        placeholder="Search task titles"
                        value={filters.search}
                        onChange={(event) =>
                            onFilterChange("search", event.target.value)
                        }
                    />
                </label>
                <select
                    value={filters.status}
                    onChange={(event) =>
                        onFilterChange("status", event.target.value)
                    }>
                    <option value="">Any status</option>
                    <option value="todo">Todo</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                </select>
                <select
                    value={filters.priority}
                    onChange={(event) =>
                        onFilterChange("priority", event.target.value)
                    }>
                    <option value="">Any priority</option>
                    <option value="low">Low priority</option>
                    <option value="medium">Medium priority</option>
                    <option value="high">High priority</option>
                </select>
            </div>
            <div className="task-table">
                <div className="table-header">
                    <span>Task</span>
                    <span>Project</span>
                    <span>Status</span>
                    <span>Priority</span>
                    <span>Due date</span>
                    <span />
                </div>
                {loading ? (
                    <div className="empty-state">Loading your workspace...</div>
                ) : tasks.length === 0 ? (
                    <div className="empty-state">
                        <strong>Your board is clear.</strong>
                        <span>Create a task to get started.</span>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <div className="task-row" key={task.id}>
                            <div className="task-title">
                                <button
                                    type="button"
                                    className={`task-check ${task.status === "completed" ? "done" : ""}`}
                                    onClick={() => onCompleteTask(task)}
                                    disabled={task.status === "completed"}
                                    aria-label={
                                        task.status === "completed"
                                            ? `${task.title} is completed`
                                            : `Mark ${task.title} as completed`
                                    }
                                    title={
                                        task.status === "completed"
                                            ? "Task completed"
                                            : "Mark task as completed"
                                    }
                                />
                                <div>
                                    <strong>{task.title}</strong>
                                    <small>
                                        {task.description || "No description"}
                                    </small>
                                </div>
                            </div>
                            <span className="project-name">
                                {projects.find(
                                    (project) => project.id === task.project_id,
                                )?.name || `Project ${task.project_id}`}
                            </span>
                            <span className={`pill status-${task.status}`}>
                                {task.status.replace("_", " ")}
                            </span>
                            <span className={`pill priority-${task.priority}`}>
                                {task.priority}
                            </span>
                            <span className="due-date">
                                {task.due_date || "No due date"}
                            </span>
                            <div className="row-actions">
                                {task.status !== "completed" && (
                                    <button
                                        onClick={() => onCompleteTask(task)}>
                                        Complete
                                    </button>
                                )}
                                <button onClick={() => onEditTask(task)}>
                                    Edit
                                </button>
                                <button onClick={() => onDeleteTask(task)}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}

export default TaskBoard;
