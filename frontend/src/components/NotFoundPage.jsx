import { Link } from "react-router-dom";

function NotFoundPage() {
    return (
        <section className="not-found-page">
            <p className="overline">Error 404</p>
            <h1>Page not found</h1>
            <p>The page you are looking for does not exist or has moved.</p>
            <div className="not-found-actions">
                <Link className="primary-button" to="/projects">
                    Go to projects
                </Link>
                <Link className="text-button" to="/tasks">
                    View all tasks
                </Link>
            </div>
        </section>
    );
}

export default NotFoundPage;
