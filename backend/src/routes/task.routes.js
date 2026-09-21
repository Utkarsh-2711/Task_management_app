// Task route definitions map HTTP methods to task controller functions.
import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import {
    createTask,
    deleteTask,
    getTask,
    listTasks,
    updateTask,
} from "../controllers/task.controller.js";

const router = Router();

// Task CRUD routes are mounted under /api/tasks in server.js.
router.route("/").post(asyncHandler(createTask)).get(asyncHandler(listTasks));
router
    .route("/:id")
    .get(asyncHandler(getTask))
    .put(asyncHandler(updateTask))
    .delete(asyncHandler(deleteTask));

export default router;
