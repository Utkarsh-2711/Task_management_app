// Health route used by the frontend or deployment checks to verify API and MySQL availability.
import { Router } from "express";
import pool from "../config/db.js";
import { asyncHandler } from "../middleware/async-handler.js";

const router = Router();

router.get(
    "/",
    asyncHandler(async (_request, response) => {
        await pool.query("SELECT 1");
        response.json({
            success: true,
            message: "API and database are healthy.",
        });
    }),
);

export default router;
