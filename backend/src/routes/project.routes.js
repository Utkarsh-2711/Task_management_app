// Project route definitions map HTTP methods to project controller functions.
import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import {
    createProject,
    deleteProject,
    getProject,
    listProjects,
    updateProject,
} from "../controllers/project.controller.js";

const router = Router();

// Project CRUD routes are mounted under /api/projects in server.js.
router
    .route("/")
    .post(asyncHandler(createProject))
    .get(asyncHandler(listProjects));
router
    .route("/:id")
    .get(asyncHandler(getProject))
    .put(asyncHandler(updateProject))
    .delete(asyncHandler(deleteProject));

export default router;
