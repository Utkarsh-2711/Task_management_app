import TaskBoard from "./TaskBoard";

function AllTasksPage({
    tasks,
    projects,
    loading,
    filters,
    onFilterChange,
    onEditTask,
    onCompleteTask,
    onDeleteTask,
    onCreateTask,
}) {
    return (
        <>
            <header className="topbar">
                <div>
                    <p className="overline">Workspace</p>
                    <h1>All tasks</h1>
                </div>
                <button className="primary-button" onClick={onCreateTask}>
                    + New task
                </button>
            </header>
            <TaskBoard
                tasks={tasks}
                projects={projects}
                loading={loading}
                filters={filters}
                selectedProjectName="Everything in one view"
                onFilterChange={onFilterChange}
                onEditTask={onEditTask}
                onCompleteTask={onCompleteTask}
                onDeleteTask={onDeleteTask}
            />
        </>
    );
}

export default AllTasksPage;
