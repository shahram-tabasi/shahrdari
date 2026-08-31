import { Router } from "express";
import { z } from "zod";

import { PERMISSION } from "../config/roles.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import * as audit from "../services/audit.service.js";
import { successResponse } from "../utils/api-response.js";

const router = Router();

/**
 * The audit trail is readable only by principals holding `audit:read`, and it
 * is read-only over HTTP: there is no route that edits or deletes a record.
 * «این الگ‌ها باید در برابر حذف یا دستکاری محافظت شوند» — the strongest
 * protection the API layer can offer is to expose no mutation at all.
 */
router.use(authenticate(), authorize(PERMISSION.AUDIT_READ));

const querySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(500).default(100),
    category: z.enum(Object.values(audit.AUDIT_CATEGORY)).optional()
  })
  .strict();

router.get("/", validate(querySchema, "query"), (req, res) => {
  res.status(200).json(
    successResponse({
      message: "سوابق ممیزی بازیابی شد.",
      data: audit.list(req.query)
    })
  );
});

/**
 * Chain integrity. A verification failure names the sequence number where the
 * chain breaks, which is the point at which a record was altered or removed.
 */
router.get("/integrity", (req, res) => {
  const state = audit.status();

  res.status(state.integrity.valid ? 200 : 409).json(
    successResponse({
      message: state.integrity.valid
        ? "زنجیره سوابق ممیزی سالم است."
        : "زنجیره سوابق ممیزی نقض شده است.",
      data: state
    })
  );
});

export default router;
