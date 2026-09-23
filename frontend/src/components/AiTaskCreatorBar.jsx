import { useState } from "react";

function AiTaskCreatorBar({ onGenerateTask, defaultProjectName, loading = false }) {
    const [prompt, setPrompt] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const samplePrompt = defaultProjectName
        ? `Create a high priority task for the ${defaultProjectName} to fix the login API before Friday.`
        : "Create a high priority task for the website project to fix the login API before Friday.";

    async function handleSubmit(event) {
        event.preventDefault();
        const textToUse = prompt.trim();
        if (!textToUse) {
            setError("Please enter a natural language task description.");
            return;
        }
        setError("");
        setIsSubmitting(true);
        try {
            await onGenerateTask(textToUse);
            setPrompt("");
        } catch (err) {
            setError(err.message || "Failed to parse task with AI.");
        } finally {
            setIsSubmitting(false);
        }
    }

    function applySample(sample) {
        setPrompt(sample);
        setError("");
    }

    return (
        <section className="ai-creator-bar">
            <div className="ai-creator-header">
                <div className="ai-badge-row">
                    <span className="ai-sparkle-pill">✨ AI Task Assistant</span>
                    <span className="ai-feature-tag">Feature 1: Natural Language Task Creation</span>
                </div>
                <p className="ai-creator-subtitle">
                    Type a prompt in plain English. The AI extracts the title, project, priority, and due date for your review before saving.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="ai-creator-form">
                <div className="ai-input-wrapper">
                    <input
                        id="ai-natural-prompt-input"
                        className="ai-natural-input"
                        type="text"
                        value={prompt}
                        placeholder='e.g. "Create a high priority task for the website project to fix the login API before Friday."'
                        onChange={(e) => {
                            setPrompt(e.target.value);
                            if (error) setError("");
                        }}
                        disabled={isSubmitting || loading}
                    />
                    <button
                        id="ai-generate-task-btn"
                        type="submit"
                        className="primary-button ai-submit-btn"
                        disabled={isSubmitting || loading || !prompt.trim()}>
                        {isSubmitting || loading ? "✨ Extracting..." : "✨ Generate Task"}
                    </button>
                </div>
                {error && <p className="form-error ai-bar-error">{error}</p>}
            </form>

            <div className="ai-pills-row">
                <span className="ai-pills-label">Try example:</span>
                <button
                    type="button"
                    className="ai-sample-pill"
                    onClick={() => applySample(samplePrompt)}>
                    💡 "{samplePrompt}"
                </button>
            </div>
        </section>
    );
}

export default AiTaskCreatorBar;
