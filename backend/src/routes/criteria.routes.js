/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import { Router } from "express";

import { PERMISSION } from "../config/roles.js";
import * as criteriaController from "../controllers/criteria.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate());

/**
 * The eight weighting dimensions.
 */
router.get(
  "/",
  authorize(PERMISSION.CRITERIA_READ),
  criteriaController.getAllCriteria
);

/**
 * The full model: dimensions, the thirty-seven preferential criteria and the
 * mandatory gates of filter 1.
 */
router.get(
  "/model",
  authorize(PERMISSION.CRITERIA_READ),
  criteriaController.getCriteriaModel
);

router.get(
  "/:id",
  authorize(PERMISSION.CRITERIA_READ),
  criteriaController.getCriterionById
);

/**
 * Rewriting the official weights requires `criteria:write`, which only the
 * expert and admin roles hold. Defining indicators and their weights is a
 * governed act, not a UI preference.
 */
router.put(
  "/",
  authorize(PERMISSION.CRITERIA_WRITE),
  criteriaController.replaceCriteria
);

export default router;
