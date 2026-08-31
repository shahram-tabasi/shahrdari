import { Router } from "express";

import aiRoutes from "./ai.routes.js";
import auditRoutes from "./audit.routes.js";
import authRoutes from "./auth.routes.js";
import criteriaRoutes from "./criteria.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import decisionRoutes from "./decision.routes.js";
import exportRoutes from "./export.routes.js";
import neighborhoodRoutes from "./neighborhood.routes.js";
import projectRoutes from "./project.routes.js";
import systemRoutes from "./system.routes.js";

const router = Router();

/**
 * API root.
 *
 * Deliberately minimal and unauthenticated: it confirms the service is the one
 * the caller expects and nothing more. Version numbers, dependency status and
 * feature flags are configuration disclosure and belong behind authentication.
 */
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "سامانه پشتیبان تصمیم مدیریت سبد پروژه",
    data: { version: "v1", status: "online" },
    errors: null,
    meta: null
  });
});

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/projects", projectRoutes);
router.use("/system", systemRoutes);
router.use("/criteria", criteriaRoutes);
router.use("/neighborhoods", neighborhoodRoutes);
router.use("/ai", aiRoutes);
router.use("/decisions", decisionRoutes);
router.use("/export", exportRoutes);
router.use("/audit", auditRoutes);

export default router;
