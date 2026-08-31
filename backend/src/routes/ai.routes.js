import { Router } from "express";

import { PERMISSION } from "../config/roles.js";
import * as aiController from "../controllers/ai.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import env from "../config/env.js";
import {
  enforceTokenBudget,
  rateLimit
} from "../middleware/rate-limit.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  aiTaskSchema,
  suggestionIdSchema,
  suggestionQuerySchema,
  suggestionReviewSchema
} from "../validators/ai.validator.js";

const router = Router();

router.use(authenticate());

/**
 * Availability is readable by anyone who may use the assistant, so the UI can
 * disable the AI panel and explain the degraded mode rather than failing on
 * every keystroke.
 */
router.get("/status", authorize(PERMISSION.AI_USE), aiController.getStatus);

/**
 * Running a task: the tightest limits in the system.
 *
 * محدودسازی نرخ و جلوگیری از مصرف بی‌رویه — a request cap bounds how often the
 * model can be called, and the token budget bounds what those calls may cost.
 * Both are needed: neither alone bounds spend.
 */
router.post(
  "/tasks",
  authorize(PERMISSION.AI_USE),
  rateLimit({
    name: "ai",
    windowSeconds: env.ai.rateLimit.windowSeconds,
    maxRequests: env.ai.rateLimit.maxRequests
  }),
  enforceTokenBudget(),
  validate(aiTaskSchema),
  aiController.runTask
);

/**
 * Suggestion review — «تأیید کارشناس».
 *
 * Separated from `ai:use` on purpose: the person who asked the model a question
 * is not automatically the person entitled to accept its answer into the
 * decision record.
 */
router.get(
  "/suggestions",
  authorize(PERMISSION.AI_REVIEW),
  validate(suggestionQuerySchema, "query"),
  aiController.listSuggestions
);

router.get(
  "/suggestions/:id",
  authorize(PERMISSION.AI_REVIEW),
  validate(suggestionIdSchema, "params"),
  aiController.getSuggestion
);

router.post(
  "/suggestions/:id/review",
  authorize(PERMISSION.AI_REVIEW),
  validate(suggestionIdSchema, "params"),
  validate(suggestionReviewSchema),
  aiController.reviewSuggestion
);

export default router;
