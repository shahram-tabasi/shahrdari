import { Router } from "express";

import dashboardRoutes from "./dashboard.routes.js";
import projectRoutes from "./project.routes.js";
import systemRoutes from "./system.routes.js";
import criteriaRoutes from "./criteria.routes.js";
import neighborhoodRoutes from "./neighborhood.routes.js";
import aiRoutes from "./ai.routes.js";
import decisionRoutes from "./decision.routes.js";
import exportRoutes from "./export.routes.js";

const router = Router();

/**
 * API root endpoint.
 */
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Municipality Decision Support System API",
    data: {
      name: "Municipality Decision Support System",
      version: "v1",
      status: "online"
    },
    errors: null,
    meta: null
  });
});

/**
 * Register feature routes.
 */
router.use("/dashboard", dashboardRoutes);
router.use("/projects", projectRoutes);
router.use("/system", systemRoutes);
router.use("/criteria", criteriaRoutes);
router.use("/neighborhoods", neighborhoodRoutes);
router.use("/ai", aiRoutes);
router.use("/decisions", decisionRoutes);
router.use("/export", exportRoutes);

export default router;
