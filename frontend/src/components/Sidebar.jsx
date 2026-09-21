import { NavLink, useNavigate } from "react-router-dom";

function Sidebar({
    projects,
    selectedProject,
    taskCount,
    onSelectProject,
    onCreateProject,
    isOpen,
    onToggle,
    onClose,
}) {
    const navigate = useNavigate();

    return (
        <>
            <button
                className="mobile-menu-button"
                type="button"
                onClick={onToggle}
                aria-label={isOpen ? "Close navigation" : "Open navigation"}
                aria-expanded={isOpen}>
                {isOpen ? "×" : "☰"}
            </button>
            {isOpen && (
                <button
                    className="sidebar-overlay"
                    type="button"
                    aria-label="Close navigation"
                    onClick={onClose}
                />
            )}
            <aside className={`sidebar ${isOpen ? "open" : ""}`}>
                <div className="brand">
                    <span className="brand-mark">TM</span>
                    <span>Taskmark</span>
                </div>
                <p className="eyebrow">Workspace</p>
                <NavLink
                    className={({ isActive }) =>
                        `nav-item ${isActive ? "active" : ""}`
                    }
                    to="/tasks"
                    onClick={() => {
                        onSelectProject("all");
                        onClose();
                    }}>
                    <span>All tasks</span>
                    <strong>{taskCount}</strong>
                </NavLink>
                <p className="eyebrow project-label">
                    Projects
                    <button
                        className="small-action"
                        onClick={() => {
                            onCreateProject();
                            onClose();
                        }}>
                        +
                    </button>
                </p>
                <div className="project-list">
                    {projects.map((project) => (
                        <button
                            key={project.id}
                            className={`nav-item ${String(selectedProject) === String(project.id) ? "active" : ""}`}
                            onClick={() => {
                                onSelectProject(String(project.id));
                                navigate(`/projects/${project.id}/tasks`);
                                onClose();
                            }}>
                            <span>
                                <i
                                    className={`project-dot ${project.status}`}
                                />
                                {project.name}
                            </span>
                            <strong>
                                {project.status === "completed" ? "Done" : ""}
                            </strong>
                        </button>
                    ))}
                </div>
            </aside>
        </>
    );
}

export default Sidebar;
