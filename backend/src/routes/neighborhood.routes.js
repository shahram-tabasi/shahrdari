import { Router } from "express";

import * as neighborhoodController from "../controllers/neighborhood.controller.js";

const router = Router();

/**
 * Retrieve all neighborhoods.
 */
router.get("/", neighborhoodController.getAllNeighborhoods);

/**
 * Retrieve a neighborhood by its identifier.
 */
router.get("/:id", neighborhoodController.getNeighborhoodById);

/**
 * Replace the entire neighborhood collection.
 */
router.put("/", neighborhoodController.replaceNeighborhoods);

export default router;