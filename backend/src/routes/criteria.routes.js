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
 * mandatory gates of «فیلتر شماره یک».
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
 * expert and admin roles hold — «تعریف شاخص، مقیاس، جهت و منبع داده» is a
 * governed act, not a UI preference.
 */
router.put(
  "/",
  authorize(PERMISSION.CRITERIA_WRITE),
  criteriaController.replaceCriteria
);

export default router;
