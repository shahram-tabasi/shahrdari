/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import { Router } from "express";
import { z } from "zod";

import { ROLES, isKnownRole } from "../config/roles.js";
import env from "../config/env.js";
import { authenticate, issueToken } from "../middleware/auth.middleware.js";
import { rateLimit } from "../middleware/rate-limit.middleware.js";
import validate from "../middleware/validate.middleware.js";
import * as audit from "../services/audit.service.js";
import { AUDIT_CATEGORY } from "../services/audit.service.js";
import { successResponse } from "../utils/api-response.js";
import HttpError from "../utils/http-error.js";

const router = Router();

/**
 * Session issuance.
 *
 * SCOPE NOTE — this is the pilot's session layer, not an identity provider. It
 * issues and verifies signed, expiring sessions; it does not verify who the
 * person is. The security document requires OAuth 2.0 / OIDC against the
 * municipality's directory, and that is what belongs behind this route before
 * production. The route is written so that swap changes this file and nothing
 * else: every other layer consumes `req.principal`.
 *
 * Until then it refuses to run in production at all, rather than shipping a
 * credential-free login that would quietly become the real one.
 */

const loginSchema = z
  .object({
    userId: z.string().trim().min(1).max(64).regex(/^[\w.@-]+$/),
    name: z.string().trim().min(1).max(120),
    role: z.string().trim().refine(isKnownRole, "نقش ناشناخته است."),
    districts: z.array(z.string().trim().min(1).max(60)).max(20).optional()
  })
  .strict();

router.post(
  "/session",
  rateLimit({ name: "auth", windowSeconds: 300, maxRequests: 10 }),
  validate(loginSchema),
  (req, res, next) => {
    if (env.app.isProduction) {
      audit.record({
        category: AUDIT_CATEGORY.AUTH,
        action: "session.issue",
        outcome: "denied",
        requestId: req.id,
        detail: { reason: "development-session-endpoint-disabled-in-production" }
      });

      return next(
        new HttpError(
          501,
          "صدور نشست باید از راه ارائه‌دهنده هویت سازمانی (OIDC) انجام شود."
        )
      );
    }

    const { token, expiresAt } = issueToken({
      id: req.body.userId,
      name: req.body.name,
      role: req.body.role,
      districts: req.body.districts ?? []
    });

    audit.record({
      category: AUDIT_CATEGORY.AUTH,
      action: "session.issue",
      requestId: req.id,
      actor: { id: req.body.userId, name: req.body.name, role: req.body.role },
      detail: { districts: req.body.districts ?? [], expiresAt }
    });

    return res.status(201).json(
      successResponse({
        message: "نشست صادر شد.",
        data: { token, expiresAt, role: req.body.role },
        meta: {
          notice:
            "این مسیر فقط برای محیط توسعه است؛ در محیط تولید احراز هویت از راه OIDC سازمانی انجام می‌شود."
        }
      })
    );
  }
);

/**
 * Who am I, and what may I do. The UI uses this to hide actions the principal
 * cannot perform — a usability measure layered on top of enforcement, never
 * instead of it.
 */
router.get("/me", authenticate(), (req, res) => {
  res.status(200).json(
    successResponse({
      message: "اطلاعات نشست بازیابی شد.",
      data: {
        id: req.principal.id,
        name: req.principal.name,
        role: req.principal.role,
        roleLabel: ROLES[req.principal.role]?.label ?? null,
        districts: req.principal.districts,
        permissions: [...req.principal.permissions],
        expiresAt: req.principal.expiresAt
      }
    })
  );
});

export default router;
