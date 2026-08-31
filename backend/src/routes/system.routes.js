/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import { Router } from "express";

import { PERMISSION } from "../config/roles.js";
import * as systemController from "../controllers/system.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate());

router.get(
  "/",
  authorize(PERMISSION.PROJECT_READ),
  systemController.getSystemConfiguration
);

/**
 * Changing system configuration is an administrative act and is restricted to
 * `system:admin`.
 */
router.put(
  "/",
  authorize(PERMISSION.SYSTEM_ADMIN),
  systemController.updateSystemConfiguration
);

export default router;
