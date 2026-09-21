import { Link, useNavigate, useParams } from "react-router-dom";
import TaskBoard from "./TaskBoard";

function ProjectTasksPage({
    projects,
    tasks,
    loading,
    filters,
    onFilterChange,
    onEditTask,
    onCompleteTask,
    onDeleteTask,
    onCreateTask,
}) {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const project = projects.find(
        (item) => String(item.id) === String(projectId),
    );

    if (!project) {
        return (
            <section className="empty-state page-empty">
                <strong>Project not found.</strong>
                <button
                    className="text-button"
                    onClick={() => navigate("/projects")}>
                    Back to projects
                </button>
            </section>
        );
    }

    return (
        <>
            <header className="topbar">
                <div>
                    <p className="overline">Project workspace</p>
                    <h1>{project.name}</h1>
                </div>
                <div className="topbar-actions">
                    <Link className="secondary-button" to="/projects">
                        Manage project workspace
                    </Link>
                    <button className="primary-button" onClick={onCreateTask}>
                        + New task
                    </button>
                </div>
            </header>
            <TaskBoard
                tasks={tasks}
                projects={projects}
                loading={loading}
                filters={filters}
                selectedProjectName={project.name}
                onFilterChange={onFilterChange}
                onEditTask={onEditTask}
                onCompleteTask={onCompleteTask}
                onDeleteTask={onDeleteTask}
            />
        </>
    );
}

export default ProjectTasksPage;
