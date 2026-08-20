import { Router } from "express";

import * as decisionController from "../controllers/decision.controller.js";
import validate from "../middleware/validate.middleware.js";
import {
  portfolioSchema,
  rankingSchema
} from "../validators/decision.validator.js";

const router = Router();

router.get("/scenarios", decisionController.getScenarios);
router.post(
  "/rankings",
  validate(rankingSchema),
  decisionController.createRanking
);
router.post(
  "/portfolio",
  validate(portfolioSchema),
  decisionController.optimizePortfolio
);

export default router;
