// Application entry point: configure Express, register API routes, and start the server.
import cors from "cors";
import express from "express";
import "dotenv/config";
import healthRoutes from "./routes/health.routes.js";
import projectRoutes from "./routes/project.routes.js";
import taskRoutes from "./routes/task.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import { checkDatabaseConnection, initializeDatabase } from "./config/db.js";
import {
    errorMiddleware,
    getStartupErrorMessage,
} from "./middleware/error.middleware.js";

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json());

// Basic endpoint used to confirm that the API process is running.
app.get("/", (_request, response) => {
    response.json({
        success: true,
        message: "Task Management API is running.",
    });
});

app.use("/api/health", healthRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/ai", aiRoutes);

// Return a consistent JSON response when no registered route matches the request.
app.use((_request, response) => {
    response.status(404).json({ success: false, message: "Route not found." });
});

// Convert malformed JSON and unexpected failures into safe, consistent API responses.
app.use(errorMiddleware);

try {
    await initializeDatabase();
    await checkDatabaseConnection();
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
} catch (error) {
    console.error(`Could not start backend: ${getStartupErrorMessage(error)}`);
    process.exit(1);
}
