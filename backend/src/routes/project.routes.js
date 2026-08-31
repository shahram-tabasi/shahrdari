/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import { Router } from "express";

import { PERMISSION } from "../config/roles.js";
import * as projectController from "../controllers/project.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate());

/**
 * Reads and writes are separated: a proposer may register a project, but only
 * roles holding `project:write` may change or remove one. Previously every one
 * of these was reachable with no authentication at all.
 */
router.get("/", authorize(PERMISSION.PROJECT_READ), projectController.getAllProjects);
router.get("/:id", authorize(PERMISSION.PROJECT_READ), projectController.getProjectById);

router.post("/", authorize(PERMISSION.PROJECT_WRITE), projectController.createProject);
router.put("/:id", authorize(PERMISSION.PROJECT_WRITE), projectController.updateProject);
router.delete("/:id", authorize(PERMISSION.PROJECT_WRITE), projectController.deleteProject);

export default router;
