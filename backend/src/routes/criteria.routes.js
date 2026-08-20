import { Router } from "express";

import * as criteriaController from "../controllers/criteria.controller.js";

const router = Router();

/**
 * Retrieve all criteria.
 */
router.get("/", criteriaController.getAllCriteria);

/**
 * Retrieve a criterion by its identifier.
 */
router.get("/:id", criteriaController.getCriterionById);

/**
 * Replace the entire criteria collection.
 */
router.put("/", criteriaController.replaceCriteria);

export default router;