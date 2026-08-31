import { z } from "zod";

import { AI_TASK, REVIEW_STATUS } from "../services/ai-governance.service.js";

/**
 * اعتبارسنجی ورودی — «ترجیحاً بر اساس یک لیست سفید از مقادیر، فرمت‌ها یا
 * کاراکترهای مجاز».
 *
 * Every schema here is `.strict()`: an unexpected property is rejected rather
 * than ignored, so a client cannot smuggle a field past validation in the hope
 * that some layer downstream reads it.
 */

/** Project identifiers are ours and have a fixed shape — an allowlist, not a
 * length check. */
const projectId = z
  .string()
  .trim()
  .regex(/^P-\d{3,8}$/, "شناسه پروژه معتبر نیست.");

const projectIds = z
  .array(projectId)
  .max(200)
  .refine(ids => new Set(ids).size === ids.length, {
    message: "شناسه پروژه‌ها باید یکتا باشند."
  });

export const aiTaskSchema = z
  .object({
    task: z.enum(Object.values(AI_TASK)),
    message: z
      .string({ error: "متن پرسش الزامی است." })
      .trim()
      .min(1, "متن پرسش نمی‌تواند خالی باشد.")
      .max(8000, "متن پرسش بیش از حد طولانی است."),
    projectIds: projectIds.optional()
  })
  .strict();

export const suggestionReviewSchema = z
  .object({
    status: z.enum([REVIEW_STATUS.ACCEPTED, REVIEW_STATUS.REJECTED]),
    reason: z
      .string({ error: "ثبت دلیل پذیرش یا رد الزامی است." })
      .trim()
      .min(3, "دلیل باید حداقل سه نویسه باشد.")
      .max(2000),
    correctedOutput: z.string().trim().max(20000).optional()
  })
  .strict();

export const suggestionQuerySchema = z
  .object({
    status: z
      .enum([REVIEW_STATUS.PENDING, REVIEW_STATUS.ACCEPTED, REVIEW_STATUS.REJECTED])
      .optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50)
  })
  .strict();

export const suggestionIdSchema = z
  .object({
    id: z.string().uuid("شناسه پیشنهاد معتبر نیست.")
  })
  .strict();
