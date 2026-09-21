function SummaryCards({
    taskCount,
    pendingTasks,
    completedTasks,
    projectCount,
}) {
    const cards = [
        ["Visible tasks", taskCount, "Across your workspace", "highlight"],
        ["In progress", pendingTasks, "Need your attention", ""],
        ["Completed", completedTasks, "Keep the momentum", ""],
        ["Projects", projectCount, "Active workstreams", ""],
    ];

    return (
        <section className="summary-grid">
            {cards.map(([label, value, hint, className]) => (
                <div className={`summary-card ${className}`} key={label}>
                    <span className="summary-label">{label}</span>
                    <strong>{value}</strong>
                    <small>{hint}</small>
                </div>
            ))}
        </section>
    );
}

export default SummaryCards;
