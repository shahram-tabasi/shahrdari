import { createChatCompletion } from "../providers/openai.provider.js";
import { buildPrompt } from "./prompt-builder.service.js";
import HttpError from "../utils/http-error.js";

/**
 * Generate an AI response using the application context.
 *
 * @param {Object} options
 * @param {string} options.message
 * @param {Object} options.context
 * @returns {Promise<Object>}
 */
export async function generateResponse({
  message,
  context = {}
}) {
  if (!message || typeof message !== "string") {
    throw new HttpError(400, "Message is required.");
  }

  const prompt = buildPrompt({
    message,
    context
  });

  const response = await createChatCompletion(prompt, {
    temperature: 0.2,
    maxOutputTokens: 4000
  });

  return {
    id: response.id,
    model: response.model,
    output: response.output_text,
    usage: response.usage ?? null,
    createdAt: new Date().toISOString()
  };
}