import { Router } from "express";

import { PERMISSION } from "../config/roles.js";
import * as dashboardController from "../controllers/dashboard.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * The dashboard aggregates the whole project set, so it is gated on the same
 * read permission as the projects themselves rather than being open because it
 * "only reads".
 */
router.get(
  "/",
  authenticate(),
  authorize(PERMISSION.PROJECT_READ),
  dashboardController.getDashboard
);

export default router;
