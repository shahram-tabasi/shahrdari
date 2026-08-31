/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import { z } from "zod";

import { dimensions } from "../data/criteria.js";

/**
 * Decision-engine request validation.
 *
 * Whitelisting throughout: dimension keys come from the criteria model, not
 * from a free-form record, so an unknown weight key is a validation error
 * rather than a silently ignored field. Every object is `.strict()`.
 */

const dimensionKey = z.enum(dimensions.map(dimension => dimension.key));

const projectId = z
  .string()
  .trim()
  .regex(/^P-\d{3,8}$/, "شناسه پروژه معتبر نیست.");

const createProjectIds = ({ required = false } = {}) => {
  // Array constraints must be applied before `.refine`: refining returns an
  // effects wrapper that no longer exposes `.min`/`.max`.
  const base = required
    ? z.array(projectId).min(1).max(500)
    : z.array(projectId).max(500);

  return base.refine(ids => new Set(ids).size === ids.length, {
    message: "شناسه پروژه‌ها باید یکتا باشند."
  });
};

const weightsSchema = z
  .record(dimensionKey, z.number().finite().min(0).max(100))
  .refine(weights => Object.values(weights).some(weight => weight > 0), {
    message: "دست‌کم وزن یک بعد باید بزرگ‌تر از صفر باشد."
  });

/**
 * AHP pairwise comparison matrix on Saaty's 1/9..9 scale.
 *
 * The reciprocal and unit-diagonal properties are checked here rather than in
 * the engine, so an inconsistent matrix is rejected as bad input with a clear
 * message instead of producing a plausible-looking but meaningless weight
 * vector.
 */
const pairwiseSchema = z
  .object({
    keys: z
      .array(dimensionKey)
      .min(2)
      .max(dimensions.length)
      .refine(keys => new Set(keys).size === keys.length, {
        message: "کلید ابعاد در ماتریس نباید تکراری باشد."
      }),
    matrix: z
      .array(z.array(z.number().finite().min(1 / 9).max(9)))
      .min(2)
      .max(dimensions.length)
  })
  .strict()
  .superRefine((value, context) => {
    const size = value.keys.length;

    if (value.matrix.length !== size) {
      context.addIssue({
        code: "custom",
        path: ["matrix"],
        message: `ماتریس باید ${size} سطر داشته باشد.`
      });

      return;
    }

    value.matrix.forEach((row, rowIndex) => {
      if (row.length !== size) {
        context.addIssue({
          code: "custom",
          path: ["matrix", rowIndex],
          message: `هر سطر ماتریس باید ${size} ستون داشته باشد.`
        });

        return;
      }

      if (Math.abs(row[rowIndex] - 1) > 1e-6) {
        context.addIssue({
          code: "custom",
          path: ["matrix", rowIndex, rowIndex],
          message: "قطر اصلی ماتریس مقایسات زوجی باید یک باشد."
        });
      }

      row.forEach((cell, columnIndex) => {
        const mirror = value.matrix[columnIndex]?.[rowIndex];

        if (
          Number.isFinite(mirror) &&
          Math.abs(cell * mirror - 1) > 1e-3
        ) {
          context.addIssue({
            code: "custom",
            path: ["matrix", rowIndex, columnIndex],
            message: "ماتریس باید معکوس‌متقارن باشد (a[i][j] × a[j][i] = 1)."
          });
        }
      });
    });
  });

const budget = z.number().finite().positive().max(1_000_000);

/**
 * Scenario overrides. Every field is optional; omitting one keeps the policy
 * default from `data/policy.js`.
 */
const financialOverrides = z
  .object({
    totalBudget: budget.optional(),
    annualCaps: z.record(z.string().regex(/^\d{4}$/), budget).optional(),
    futureCommitmentCap: budget.optional(),
    districtCaps: z.record(z.string().min(1).max(60), budget).optional()
  })
  .strict();

const capacityOverrides = z
  .object({
    maxConcurrentProjects: z.number().int().min(0).max(500).optional(),
    supervisionCapacity: z.number().int().min(0).max(500).optional(),
    contractorCapacity: z.number().int().min(0).max(500).optional(),
    maxProjectsPendingLandAcquisition: z.number().int().min(0).max(500).optional(),
    maxProjectsPendingPermits: z.number().int().min(0).max(500).optional()
  })
  .strict();

const policyOverrides = z
  .object({
    minSafetySharePercent: z.number().min(0).max(100).optional(),
    minPublicTransportSharePercent: z.number().min(0).max(100).optional(),
    minNeighborhoodProjects: z.number().int().min(0).max(500).optional(),
    maxProjectsWithoutExecutivePlan: z.number().int().min(0).max(500).optional(),
    mandatoryCompletionProgressThreshold: z.number().min(0).max(100).optional(),
    maxLowImpactSharePercent: z.number().min(0).max(100).optional()
  })
  .strict();

const equityOverrides = z
  .object({
    deprivedThreshold: z.number().min(0).max(1).optional(),
    minDeprivedSharePercent: z.number().min(0).max(100).optional()
  })
  .strict();

const weightingFields = {
  weights: weightsSchema.optional(),
  pairwise: pairwiseSchema.optional()
};

export const evaluationSchema = z
  .object({
    projectIds: createProjectIds({ required: true }).optional()
  })
  .strict();

export const rankingSchema = z
  .object({
    ...weightingFields,
    projectIds: createProjectIds({ required: true }).optional()
  })
  .strict()
  .refine(value => !(value.weights && value.pairwise), {
    message: "وزن‌ها را یا مستقیم یا از راه ماتریس مقایسات زوجی مشخص کنید، نه هر دو.",
    path: ["pairwise"]
  });

export const portfolioSchema = z
  .object({
    budget,
    ...weightingFields,
    includeProjectIds: createProjectIds().optional().default([]),
    excludeProjectIds: createProjectIds().optional().default([]),
    financial: financialOverrides.optional(),
    capacity: capacityOverrides.optional(),
    policy: policyOverrides.optional(),
    equity: equityOverrides.optional(),
    /** Seeded so a recommended portfolio can be reproduced exactly. */
    seed: z.number().int().min(0).max(2 ** 31 - 1).optional(),
    restarts: z.number().int().min(1).max(200).optional()
  })
  .strict()
  .superRefine((value, context) => {
    if (value.weights && value.pairwise) {
      context.addIssue({
        code: "custom",
        path: ["pairwise"],
        message: "وزن‌ها را یا مستقیم یا از راه ماتریس مقایسات زوجی مشخص کنید، نه هر دو."
      });
    }

    const excluded = new Set(value.excludeProjectIds);

    value.includeProjectIds.forEach((id, index) => {
      if (excluded.has(id)) {
        context.addIssue({
          code: "custom",
          path: ["includeProjectIds", index],
          message: "یک پروژه نمی‌تواند هم‌زمان الزامی و مستثنا باشد."
        });
      }
    });
  });

/**
 * Sensitivity analysis takes the portfolio inputs plus a scenario count.
 * The sweep is expensive, so the count is capped rather than left to the
 * caller: the standard requires bounding heavy and repeated requests.
 */
export const sensitivityRequestSchema = z
  .object({
    budget,
    ...weightingFields,
    includeProjectIds: createProjectIds().optional().default([]),
    excludeProjectIds: createProjectIds().optional().default([]),
    financial: financialOverrides.optional(),
    capacity: capacityOverrides.optional(),
    policy: policyOverrides.optional(),
    equity: equityOverrides.optional(),
    scenarios: z.number().int().min(5).max(200).optional().default(40),
    seed: z.number().int().min(0).max(2 ** 31 - 1).optional()
  })
  .strict();
