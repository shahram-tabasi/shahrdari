/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import { Router } from "express";

import { PERMISSION } from "../config/roles.js";
import {
  exportExcel,
  exportPdf,
  exportPptx
} from "../controllers/export.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { rateLimit } from "../middleware/rate-limit.middleware.js";

const router = Router();

router.use(authenticate(), authorize(PERMISSION.REPORT_EXPORT));

/**
 * Report generation spawns a browser for PDF and builds workbooks in memory,
 * so it is expensive enough to be a denial-of-service vector on its own and
 * carries a limit well below the general API budget.
 */
const exportLimit = rateLimit({
  name: "export",
  windowSeconds: 300,
  maxRequests: 10
});

router.post("/excel", exportLimit, exportExcel);
router.post("/pdf", exportLimit, exportPdf);
router.post("/pptx", exportLimit, exportPptx);

export default router;
