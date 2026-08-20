import * as aiService from "../services/ai.service.js";
import { validateChatRequest } from "../validators/ai.validator.js";
import { successResponse } from "../utils/api-response.js";

/**
 * Handle AI chat requests.
 */
export async function chat(req, res, next) {
  try {
    const { message } = validateChatRequest(req.body);

    const result = await aiService.chat(message);

    res.status(200).json(
      successResponse({
        message: "AI response generated successfully.",
        data: result
      })
    );
  } catch (error) {
    next(error);
  }
}