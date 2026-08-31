import { Router } from "express";

import { PERMISSION } from "../config/roles.js";
import * as neighborhoodController from "../controllers/neighborhood.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate());

router.get(
  "/",
  authorize(PERMISSION.PROJECT_READ),
  neighborhoodController.getAllNeighborhoods
);
router.get(
  "/:id",
  authorize(PERMISSION.PROJECT_READ),
  neighborhoodController.getNeighborhoodById
);

/**
 * Neighborhood data feeds the deprivation index, which drives the regional
 * equity constraint — replacing it changes portfolio outcomes, so it is an
 * administrative act.
 */
router.put(
  "/",
  authorize(PERMISSION.SYSTEM_ADMIN),
  neighborhoodController.replaceNeighborhoods
);

export default router;
