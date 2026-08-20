import { z } from "zod";

const criterionKeySchema = z.enum([
  "social",
  "economic",
  "urgency",
  "justice",
  "strategy",
  "risk"
]);

const weightsSchema = z
  .record(criterionKeySchema, z.number().finite().min(0).max(100))
  .refine(weights => Object.values(weights).some(weight => weight > 0), {
    message: "At least one criterion weight must be greater than zero."
  });

const createProjectIdsSchema = ({ required = false } = {}) => {
  let schema = z.array(z.string().trim().min(1).max(100)).max(500);

  if (required) {
    schema = schema.min(1);
  }

  return schema.refine(ids => new Set(ids).size === ids.length, {
    message: "Project identifiers must be unique."
  });
};

export const rankingSchema = z
  .object({
    weights: weightsSchema.optional(),
    projectIds: createProjectIdsSchema({ required: true }).optional()
  })
  .strict();

export const portfolioSchema = z
  .object({
    budget: z.number().finite().positive().max(1_000_000_000),
    weights: weightsSchema.optional(),
    includeProjectIds: createProjectIdsSchema().optional().default([]),
    excludeProjectIds: createProjectIdsSchema().optional().default([])
  })
  .strict()
  .superRefine((value, context) => {
    const excluded = new Set(value.excludeProjectIds);

    value.includeProjectIds.forEach((id, index) => {
      if (excluded.has(id)) {
        context.addIssue({
          code: "custom",
          path: ["includeProjectIds", index],
          message: "A project cannot be both included and excluded."
        });
      }
    });
  });
