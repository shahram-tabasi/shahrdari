import OpenAI from "openai";

import env from "../config/env.js";
import HttpError from "../utils/http-error.js";

/**
 * The only place the model SDK is instantiated.
 *
 * The client is created lazily rather than at import time, because
 * `env.ai.enabled` may be false: the decision engine must start and serve every
 * non-AI endpoint when no model is configured («در زمان قطع سرویس هوش
 * مصنوعی، سامانه چگونه ادامه فعالیت می‌دهد»). Constructing a client with a null
 * key at module load would turn a missing optional integration into a boot
 * failure for the whole system.
 */

let client = null;

/**
 * @returns {OpenAI}
 */
function getClient() {
  if (!env.ai.enabled) {
    throw new HttpError(
      503,
      "سرویس مدل زبانی پیکربندی نشده است؛ سایر بخش‌های سامانه بدون آن کار می‌کنند."
    );
  }

  if (client === null) {
    client = new OpenAI({
      apiKey: env.ai.apiKey,
      ...(env.ai.baseUrl ? { baseURL: env.ai.baseUrl } : {}),
      // Bound every call: an unbounded request to a third party is an
      // availability risk for this service, not only for that one.
      timeout: 30_000,
      maxRetries: 1
    });
  }

  return client;
}

/**
 * Generate a completion.
 *
 * Upstream failures are translated into a 502/503 with a generic message: the
 * provider's error text can contain request ids, model names, quota details and
 * occasionally a fragment of the prompt, none of which may reach the caller.
 *
 * @param {Array} messages
 * @param {Object} [options]
 * @returns {Promise<Object>}
 */
export async function createChatCompletion(messages, options = {}) {
  const openai = getClient();

  try {
    return await openai.responses.create({
      model: options.model ?? env.ai.model,
      input: messages,
      temperature: options.temperature ?? 0.2,
      max_output_tokens: Math.min(
        options.maxOutputTokens ?? env.ai.maxOutputTokens,
        env.ai.maxOutputTokens
      )
    });
  } catch (error) {
    // Log the provider detail server-side; return a generic failure.
    console.error(
      JSON.stringify({
        level: "error",
        message: "AI provider request failed.",
        status: error?.status ?? null,
        type: error?.type ?? error?.name ?? null
      })
    );

    if (error?.status === 429) {
      throw new HttpError(
        503,
        "سرویس مدل زبانی در حال حاضر ظرفیت پاسخ‌گویی ندارد؛ کمی بعد تلاش کنید."
      );
    }

    throw new HttpError(
      502,
      "ارتباط با سرویس مدل زبانی برقرار نشد؛ تحلیل‌های سامانه بدون مدل زبانی در دسترس هستند."
    );
  }
}

/**
 * Whether the AI integration is usable at all.
 *
 * @returns {boolean}
 */
export function isAvailable() {
  return env.ai.enabled;
}
