import { useNavigate } from "react-router-dom";

function ProjectCards({
    projects,
    tasks,
    onEditProject,
    onCompleteProject,
    onReopenProject,
    onDeleteProject,
    onCreateProject,
}) {
    const navigate = useNavigate();

    return (
        <section className="project-strip">
            <div>
                <p className="overline">Your projects</p>
                <h2>Keep the big picture close.</h2>
            </div>
            <div className="project-cards">
                {projects.map((project) => (
                    // Completion is enabled only when this project's tasks are all complete.
                    <div
                        className="project-card"
                        key={project.id}
                        onClick={() =>
                            navigate(`/projects/${project.id}/tasks`)
                        }>
                        <span className={`project-dot ${project.status}`} />
                        <strong>{project.name}</strong>
                        <small>
                            {project.status === "completed"
                                ? "Completed"
                                : `${tasks.filter((task) => task.project_id === project.id && task.status === "completed").length}/${tasks.filter((task) => task.project_id === project.id).length} tasks completed`}
                        </small>
                        <div className="card-actions">
                            <button
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onEditProject(project);
                                }}>
                                Edit
                            </button>
                            {project.status === "completed" ? (
                                <button
                                    className="reopen-action"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onReopenProject(project);
                                    }}>
                                    Reopen project
                                </button>
                            ) : (
                                <button
                                    className="complete-action"
                                    disabled={
                                        tasks.filter(
                                            (task) =>
                                                task.project_id === project.id,
                                        ).length === 0 ||
                                        tasks.some(
                                            (task) =>
                                                task.project_id ===
                                                    project.id &&
                                                task.status !== "completed",
                                        )
                                    }
                                    title="Complete all project tasks first"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onCompleteProject(project);
                                    }}>
                                    Complete project
                                </button>
                            )}
                            <button
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onDeleteProject(project);
                                }}>
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
                <button
                    className="project-card add-card"
                    onClick={onCreateProject}>
                    <strong>+ Add project</strong>
                    <small>Start a new workstream</small>
                </button>
            </div>
        </section>
    );
}

export default ProjectCards;
