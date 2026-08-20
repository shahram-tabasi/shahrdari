import { z } from "zod";

/**
 * AI chat request validation schema.
 */
export const chatSchema = z.object({
  message: z
    .string({
      required_error: "Message is required.",
      invalid_type_error: "Message must be a string."
    })
    .trim()
    .min(1, "Message cannot be empty.")
    .max(10000, "Message is too long.")
});

/**
 * Validate AI chat request.
 *
 * @param {Object} payload
 * @returns {Object}
 */
export function validateChatRequest(payload) {
  return chatSchema.parse(payload);
}