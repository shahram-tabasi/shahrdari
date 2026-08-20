import { Router } from "express";

import * as aiController from "../controllers/ai.controller.js";

const router = Router();

/**
 * Generate an AI response.
 */
router.post("/chat", aiController.chat);

export default router;