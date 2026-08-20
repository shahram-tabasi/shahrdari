import * as contextBuilderService from "./context-builder.service.js";
import * as openaiService from "./openai.service.js";

/**
 * AI orchestration service.
 *
 * This service coordinates all AI-related operations.
 * Controllers should never communicate directly with
 * OpenAI providers or context builders.
 *
 * Future responsibilities:
 *
 * - Conversation history
 * - Memory
 * - Tool calling
 * - RAG
 * - Vector search
 * - Multi-agent workflows
 * - Streaming responses
 * - AI provider routing
 *
 * @param {string} message
 * @returns {Promise<Object>}
 */
export async function chat(message) {
  const context = await contextBuilderService.buildContext();

  const response = await openaiService.generateResponse({
    message,
    context
  });

  return {
    context,
    response
  };
}