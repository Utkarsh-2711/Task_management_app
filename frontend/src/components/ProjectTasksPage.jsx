import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import TaskBoard from "./TaskBoard";
import AiTaskCreatorBar from "./AiTaskCreatorBar";

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
    projectSummary,
    summaryLoading,
    onSummarizeProject,
    projectSuggestions,
    suggestionsLoading,
    onSuggestTasks,
    onApplySuggestion,
    onDismissSuggestion,
    onCloseSuggestionsPanel,
    onGenerateTask,
}) {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [copiedSummary, setCopiedSummary] = useState(false);

    const project = projects.find(
        (item) => String(item.id) === String(projectId),
    );
    const currentSummary =
        projectSummary?.projectId === String(projectId)
            ? projectSummary.text
            : "";
    const currentSuggestions =
        projectSuggestions?.projectId === String(projectId)
            ? projectSuggestions.items
            : null;

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

    function handleCopySummary() {
        if (!currentSummary) return;
        navigator.clipboard.writeText(currentSummary);
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
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

            {/* AI Feature 1: Natural Language Task Creation */}
            <AiTaskCreatorBar
                onGenerateTask={(prompt) => onGenerateTask(prompt, project.id)}
                defaultProjectName={project.name}
            />

            {/* AI Feature 2: Task / Project Summary */}
            <section className="ai-summary-section">
                <div className="ai-summary-content">
                    <div className="ai-summary-badge-row">
                        <span className="ai-sparkle-pill">✨ AI Project Summary</span>
                        <span className="ai-feature-tag">Feature 2: AI Summarize</span>
                    </div>
                    {currentSummary ? (
                        <div className="ai-summary-result-box">
                            <p className="ai-summary-text">{currentSummary}</p>
                            <button
                                type="button"
                                className="ai-copy-btn"
                                onClick={handleCopySummary}
                                title="Copy summary to clipboard">
                                {copiedSummary ? "✓ Copied" : "📋 Copy"}
                            </button>
                        </div>
                    ) : (
                        <p className="ai-summary-placeholder">
                            Click <strong>AI Summarize</strong> to generate a concise 2–3 sentence overview of this project's tasks, completion status, and highest-priority pending task.
                        </p>
                    )}
                </div>
                <div className="ai-buttons-row">
                    <button
                        id="ai-summarize-btn"
                        className="secondary-button ai-action-btn"
                        type="button"
                        onClick={() => onSummarizeProject(project.id)}
                        disabled={summaryLoading}>
                        {summaryLoading ? "✨ Summarizing..." : "✨ AI Summarize"}
                    </button>
                    {/* AI Feature 3: Suggested Next Tasks */}
                    <button
                        id="ai-suggest-task-btn"
                        className="secondary-button ai-action-btn"
                        type="button"
                        onClick={() => onSuggestTasks(project.id)}
                        disabled={suggestionsLoading}>
                        {suggestionsLoading ? "✨ Thinking..." : "✨ Suggest Next Task"}
                    </button>
                </div>
            </section>

            {/* AI Feature 3: Suggested Next Tasks Display */}
            {currentSuggestions && currentSuggestions.length > 0 && (
                <section className="ai-suggestions-panel">
                    <div className="ai-suggestions-intro">
                        <div className="ai-suggestions-intro-header">
                            <div className="ai-badge-row">
                                <span className="ai-sparkle-pill">✨ Suggested Next Tasks</span>
                                <span className="ai-feature-tag">Feature 3: Review Before Saving</span>
                            </div>
                            {onCloseSuggestionsPanel && (
                                <button
                                    type="button"
                                    className="ai-panel-close-btn"
                                    onClick={onCloseSuggestionsPanel}
                                    aria-label="Close suggestions panel"
                                    title="Close suggestions panel">
                                    ×
                                </button>
                            )}
                        </div>
                        <small>
                            Based on current project status, the AI suggests the following next tasks. Click <strong>Review & Add</strong> to inspect details in the task editor before committing.
                        </small>
                    </div>
                    <div className="ai-suggestions-cards">
                        {currentSuggestions.map((suggestion, idx) => {
                            const priLower = String(suggestion.priority || "medium").toLowerCase();
                            return (
                                <div className="ai-suggestion-card" key={idx}>
                                    <div className="ai-suggestion-header">
                                        <div className="ai-suggestion-meta">
                                            <span className={`pill priority-${priLower}`}>
                                                {suggestion.priority || "Medium"}
                                            </span>
                                        </div>
                                        {onDismissSuggestion && (
                                            <button
                                                type="button"
                                                className="ai-suggestion-close-btn"
                                                onClick={() => onDismissSuggestion(idx)}
                                                aria-label="Dismiss suggestion"
                                                title="Dismiss this suggestion">
                                                ×
                                            </button>
                                        )}
                                    </div>
                                    <strong className="ai-suggestion-title">
                                        {suggestion.title}
                                    </strong>
                                    <p className="ai-suggestion-reason">
                                        {suggestion.reason}
                                    </p>
                                    <button
                                        className="secondary-button ai-add-btn"
                                        type="button"
                                        onClick={() =>
                                            onApplySuggestion(suggestion, project.id)
                                        }>
                                        + Review & Add
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

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
