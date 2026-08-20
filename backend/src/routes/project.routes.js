import { Router } from "express";

import * as projectController from "../controllers/project.controller.js";

const router = Router();

/**
 * Get all projects.
 */
router.get("/", projectController.getAllProjects);

/**
 * Get project by identifier.
 */
router.get("/:id", projectController.getProjectById);

/**
 * Create a new project.
 */
router.post("/", projectController.createProject);

/**
 * Update an existing project.
 */
router.put("/:id", projectController.updateProject);

/**
 * Delete a project.
 */
router.delete("/:id", projectController.deleteProject);

export default router;