import OpenAI from "openai";

import env from "../config/env.js";

/**
 * Singleton OpenAI client.
 * This provider is the only place where the OpenAI SDK
 * should be instantiated.
 */

const client = new OpenAI({
  apiKey: env.openai.apiKey
});

/**
 * Generate a chat completion.
 *
 * @param {Array} messages
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function createChatCompletion(
  messages,
  options = {}
) {
  const response = await client.responses.create({
    model: options.model ?? env.openai.model,
    input: messages,
    temperature: options.temperature ?? 0.2,
    max_output_tokens: options.maxOutputTokens ?? 2000
  });

  return response;
}

export default client;