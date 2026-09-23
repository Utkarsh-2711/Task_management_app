import ProjectCards from "./ProjectCards";
import SummaryCards from "./SummaryCards";

function ProjectsPage({
    projects,
    tasks,
    onCreateProject,
    onEditProject,
    onCompleteProject,
    onReopenProject,
    onDeleteProject,
}) {
    const completedTasks = tasks.filter(
        (task) => task.status === "completed",
    ).length;

    return (
        <>
            <header className="topbar">
                <div>
                    <p className="overline">Workspace</p>
                    <h1>Projects</h1>
                </div>
                <button className="primary-button" onClick={onCreateProject}>
                    + New project
                </button>
            </header>

            <SummaryCards
                taskCount={tasks.length}
                pendingTasks={tasks.length - completedTasks}
                completedTasks={completedTasks}
                projectCount={projects.length}
            />
            <ProjectCards
                projects={projects}
                tasks={tasks}
                onEditProject={onEditProject}
                onCompleteProject={onCompleteProject}
                onReopenProject={onReopenProject}
                onDeleteProject={onDeleteProject}
                onCreateProject={onCreateProject}
            />
        </>
    );
}

export default ProjectsPage;
