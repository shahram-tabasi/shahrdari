import { Router } from "express";

import * as dashboardController from "../controllers/dashboard.controller.js";

const router = Router();

/**
 * Retrieve dashboard data.
 */
router.get("/", dashboardController.getDashboard);

export default router;