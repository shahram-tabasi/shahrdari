import { Router } from "express";

import * as systemController from "../controllers/system.controller.js";

const router = Router();

/**
 * Retrieve system configuration.
 */
router.get("/", systemController.getSystemConfiguration);

/**
 * Update system configuration.
 */
router.put("/", systemController.updateSystemConfiguration);

export default router;