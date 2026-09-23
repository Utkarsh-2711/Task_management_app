import { useState } from "react";
import TaskBoard from "./TaskBoard";
import AiTaskCreatorBar from "./AiTaskCreatorBar";

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
    onGenerateTask,
    projectSummary,
    summaryLoading,
    onSummarizeProject,
    projectSuggestions,
    suggestionsLoading,
    onSuggestTasks,
    onApplySuggestion,
    onDismissSuggestion,
    onCloseSuggestionsPanel,
}) {
    const [copiedSummary, setCopiedSummary] = useState(false);

    // Current summary for all tasks or selected filter project
    const currentSummary =
        projectSummary?.projectId === (filters?.projectId || "all")
            ? projectSummary.text
            : projectSummary?.text || "";

    const currentSuggestions =
        projectSuggestions?.projectId === (filters?.projectId || "all")
            ? projectSuggestions.items
            : projectSuggestions?.items || null;

    const activeProjectName = filters?.projectId
        ? projects.find((p) => String(p.id) === String(filters.projectId))?.name || "Filtered Project"
        : (projects[0]?.name || "Website Project");

    function handleCopySummary() {
        if (!currentSummary) return;
        navigator.clipboard.writeText(currentSummary);
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
    }

    const targetScopeId = filters?.projectId || "all";

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

            {/* AI Feature 1: Natural Language Task Creation */}
            {onGenerateTask && (
                <AiTaskCreatorBar
                    onGenerateTask={(prompt) =>
                        onGenerateTask(prompt, filters?.projectId || null)
                    }
                    defaultProjectName={activeProjectName}
                />
            )}

            {/* AI Feature 2: Task / Project Summary */}
            <section className="ai-summary-section">
                <div className="ai-summary-content">
                    <div className="ai-summary-badge-row">
                        <span className="ai-sparkle-pill">✨ AI Task Summary</span>
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
                            Click <strong>AI Summarize</strong> to generate a concise English summary of total tasks, completion status, pending tasks, and highest-priority tasks to tackle first.
                        </p>
                    )}
                </div>
                <div className="ai-buttons-row">
                    <button
                        id="ai-summarize-all-btn"
                        className="secondary-button ai-action-btn"
                        type="button"
                        onClick={() => onSummarizeProject(targetScopeId)}
                        disabled={summaryLoading}>
                        {summaryLoading ? "✨ Summarizing..." : "✨ AI Summarize"}
                    </button>
                    {/* AI Feature 3: Suggested Next Tasks */}
                    <button
                        id="ai-suggest-task-all-btn"
                        className="secondary-button ai-action-btn"
                        type="button"
                        onClick={() => onSuggestTasks(targetScopeId)}
                        disabled={suggestionsLoading}>
                        {suggestionsLoading ? "✨ Thinking..." : "✨ Suggest Next Task"}
                    </button>
                </div>
            </section>

            {/* AI Feature 3: Suggested Next Tasks Cards */}
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
                            Based on existing tasks, the AI suggests the following next tasks. Review before adding to the workspace.
                        </small>
                    </div>
                    <div className="ai-suggestions-cards">
                        {currentSuggestions.map((suggestion, idx) => {
                            const priLower = String(
                                suggestion.priority || "medium",
                            ).toLowerCase();
                            const targetProjectId =
                                filters?.projectId || projects[0]?.id || "";
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
                                            onApplySuggestion(
                                                suggestion,
                                                targetProjectId,
                                            )
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
                selectedProjectName="Everything in one view"
                showProjectFilter={true}
                onFilterChange={onFilterChange}
                onEditTask={onEditTask}
                onCompleteTask={onCompleteTask}
                onDeleteTask={onDeleteTask}
            />
        </>
    );
}

export default AllTasksPage;
