import { Router } from "express";

import { PERMISSION } from "../config/roles.js";
import * as decisionController from "../controllers/decision.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { rateLimit } from "../middleware/rate-limit.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  evaluationSchema,
  portfolioSchema,
  rankingSchema,
  sensitivityRequestSchema
} from "../validators/decision.validator.js";

const router = Router();

/**
 * Every decision endpoint requires an authenticated principal holding
 * `decision:run`. There is no anonymous access to the engines: a ranking or a
 * portfolio is an official artefact and its author must be on the record.
 */
router.use(authenticate(), authorize(PERMISSION.DECISION_RUN));

/**
 * The optimiser and the sensitivity sweep are computationally heavy — the
 * sweep re-runs the whole pipeline dozens of times — so they carry a tighter
 * limit than the general API budget.
 */
const heavyAnalysis = rateLimit({
  name: "decision-analysis",
  windowSeconds: 60,
  maxRequests: 20
});

router.get("/scenarios", decisionController.getScenarios);

router.post(
  "/evaluations",
  validate(evaluationSchema),
  decisionController.evaluate
);

router.post(
  "/rankings",
  validate(rankingSchema),
  decisionController.createRanking
);

router.post(
  "/portfolio",
  heavyAnalysis,
  validate(portfolioSchema),
  decisionController.optimizePortfolio
);

router.post(
  "/sensitivity",
  heavyAnalysis,
  validate(sensitivityRequestSchema),
  decisionController.analyzeSensitivity
);

export default router;
