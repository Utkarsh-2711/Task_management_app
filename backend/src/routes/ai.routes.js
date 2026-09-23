import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import {
    parseTask,
    projectSummary,
    suggestTasks,
} from "../controllers/ai.controller.js";

const router = Router();

router.post("/parse-task", asyncHandler(parseTask));
router.get("/summary", asyncHandler(projectSummary));
router.get("/project-summary/:projectId", asyncHandler(projectSummary));
router.post("/suggest-tasks", asyncHandler(suggestTasks));
router.post("/suggest-tasks/:projectId", asyncHandler(suggestTasks));

export default router;
